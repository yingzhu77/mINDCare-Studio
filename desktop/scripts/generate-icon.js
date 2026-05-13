// 将 public/favicon.png 转为 desktop/assets/icon.ico
// 256x256 用 PNG 格式，16/32/48 用 BMP（DIB）格式以确保 Windows 兼容
// 用法: node scripts/generate-icon.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', '..', 'public', 'favicon.png');
const DEST = path.join(__dirname, '..', 'assets', 'icon.ico');

// BMP DIB 头（40 bytes）
function createDibHeader(width, height, dataSize) {
  const buf = Buffer.alloc(40);
  buf.writeUInt32LE(40, 0);             // biSize
  buf.writeInt32LE(width, 4);           // biWidth
  buf.writeInt32LE(height * 2, 8);       // biHeight = height * 2 (正数=倒置 + AND mask)
  buf.writeUInt16LE(1, 12);             // biPlanes
  buf.writeUInt16LE(32, 14);            // biBitCount
  buf.writeUInt32LE(0, 16);             // biCompression (BI_RGB)
  buf.writeUInt32LE(dataSize, 20);      // biSizeImage
  buf.writeInt32LE(0, 24);              // biXPelsPerMeter
  buf.writeInt32LE(0, 28);              // biYPelsPerMeter
  buf.writeUInt32LE(0, 32);             // biClrUsed
  buf.writeUInt32LE(0, 36);             // biClrImportant
  return buf;
}

// 生成 AND mask（1bit/pixel，4字节对齐行）
function createAndMask(width, height) {
  const rowBytes = Math.ceil(width / 8);
  const paddedRowBytes = Math.ceil(rowBytes / 4) * 4;
  // 32bpp 时 AND mask 被 alpha 通道替代，写 0 即可
  return Buffer.alloc(paddedRowBytes * height, 0);
}

async function main() {
  const srcBuffer = fs.readFileSync(SRC);

  // 生成各尺寸
  const png256 = await sharp(srcBuffer).resize(256, 256, { fit: 'cover' }).png().toBuffer();

  // BMP 格式的小尺寸
  const bmpBuffers = await Promise.all(
    [48, 32, 16].map(w =>
      sharp(srcBuffer).resize(w, w, { fit: 'cover' }).raw().toBuffer()
    )
  );

  // 构建 ICO
  const entries = [];
  const imageData = [];

  // 1. 256x256 PNG
  imageData.push(png256);
  entries.push({ w: 0, h: 0, size: png256.length, offset: 0, isPng: true });

  // 2. 48, 32, 16 BMP
  for (let i = 0; i < bmpBuffers.length; i++) {
    const raw = bmpBuffers[i];
    const w = [48, 32, 16][i];
    const h = w;

    // raw 是 RGBA 平坦数据，需要转为 BGRA（BMP 格式要求）
    const bgra = Buffer.alloc(raw.length);
    for (let p = 0; p < raw.length; p += 4) {
      bgra[p + 0] = raw[p + 2]; // B
      bgra[p + 1] = raw[p + 1]; // G
      bgra[p + 2] = raw[p + 0]; // R
      bgra[p + 3] = raw[p + 3]; // A
    }

    // BMP 像素行是 bottom-up，翻转行序
    const rowSize = w * 4;
    const flipped = Buffer.alloc(bgra.length);
    for (let row = 0; row < h; row++) {
      bgra.copy(flipped, row * rowSize, (h - 1 - row) * rowSize, (h - row) * rowSize);
    }

    const dibHeader = createDibHeader(w, h, flipped.length);
    const andMask = createAndMask(w, h);
    const dib = Buffer.concat([dibHeader, flipped, andMask]);

    imageData.push(dib);
    entries.push({ w: w, h: h, size: dib.length, offset: 0, isPng: false });
  }

  // 写入 ICO 文件
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);          // reserved
  header.writeUInt16LE(1, 2);          // type: 1=icon
  header.writeUInt16LE(entries.length, 4);

  let offset = 6 + entries.length * 16;
  const entryHeaders = [];

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(e.w, 0);
    entry.writeUInt8(e.h, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);         // planes
    entry.writeUInt16LE(32, 6);        // bpp
    entry.writeUInt32LE(e.size, 8);
    entry.writeUInt32LE(offset, 12);
    entryHeaders.push(entry);
    offset += e.size;
  }

  fs.mkdirSync(path.dirname(DEST), { recursive: true });
  const ico = Buffer.concat([header, ...entryHeaders, ...imageData]);
  fs.writeFileSync(DEST, ico);

  const stat = fs.statSync(DEST);
  console.log(`icon.ico 已生成: ${DEST} (${(stat.size / 1024).toFixed(1)} KB, ${entries.length} sizes, 小尺寸 BMP)`);
}

main().catch(err => {
  console.error('生成失败:', err);
  process.exit(1);
});
