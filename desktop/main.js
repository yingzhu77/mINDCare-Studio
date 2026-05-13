const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const net = require('net')
const { spawn } = require('child_process')

// ============================================
// 路径常量
// ============================================
const isDev = !app.isPackaged
const resourcesPath = isDev ? path.join(__dirname, '..') : process.resourcesPath
const USER_DATA_DIR = path.join(os.homedir(), 'AppData', 'Roaming', 'ai-mental-health')
const CONFIG_PATH = path.join(USER_DATA_DIR, 'config.json')
const DB_PATH = path.join(USER_DATA_DIR, 'demo.db')

const BUILTIN_DB = isDev
  ? path.join(__dirname, 'data', 'demo.db')
  : path.join(process.resourcesPath, 'data', 'demo.db')

const SERVER_MAIN = isDev
  ? path.join(__dirname, '..', 'server', 'dist', 'main.js')
  : path.join(process.resourcesPath, 'server', 'dist', 'main.js')

const SERVER_CWD = isDev
  ? path.join(__dirname, '..', 'server')
  : path.join(process.resourcesPath, 'server')

// ============================================
// 全局状态
// ============================================
let mainWindow = null
let backendProcess = null
let apiPort = null
let loadingWindow = null

// ============================================
// 工具函数
// ============================================
function getRandomPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port
      server.close(() => resolve(port))
    })
    server.on('error', reject)
  })
}

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')) }
  catch { return {} }
}

function saveConfig(config) {
  fs.mkdirSync(USER_DATA_DIR, { recursive: true })
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
}

// ============================================
// 数据库初始化
// ============================================
function initDatabase() {
  fs.mkdirSync(USER_DATA_DIR, { recursive: true })
  if (!fs.existsSync(DB_PATH)) {
    if (!fs.existsSync(BUILTIN_DB)) {
      throw new Error(`内置演示数据库未找到: ${BUILTIN_DB}\n请先运行 npm run desktop:prepare-db`)
    }
    fs.copyFileSync(BUILTIN_DB, DB_PATH)
    console.log('[db] 首次启动，已创建演示数据库:', DB_PATH)
  }
}

// ============================================
// 加载窗口
// ============================================
function showLoadingWindow() {
  loadingWindow = new BrowserWindow({
    width: 400,
    height: 300,
    resizable: false,
    frame: false,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
    background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 50%, #C084FC 100%);
    color: #fff;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    height: 100vh; user-select: none;
  }
  .logo { font-size: 32px; font-weight: bold; margin-bottom: 8px; letter-spacing: 2px; }
  .sub { font-size: 14px; opacity: 0.8; margin-bottom: 32px; }
  .spinner {
    width: 36px; height: 36px;
    border: 3px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .status-line { font-size: 13px; opacity: 0.7; margin-top: 24px; }
  #dots::after { content: ''; animation: dots 1.5s steps(4,end) infinite; }
  @keyframes dots { 0% { content: ''; } 25% { content: '.'; } 50% { content: '..'; } 75% { content: '...'; } 100% { content: ''; } }
</style>
</head>
<body>
  <div class="logo">心晴</div>
  <div class="sub">AI 心理健康助手</div>
  <div class="spinner"></div>
  <div class="status-line"><span id="status">正在启动</span><span id="dots"></span></div>
</body>
</html>`

  loadingWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  loadingWindow.once('ready-to-show', () => loadingWindow.show())
}

function updateLoadingStatus(text) {
  if (loadingWindow && !loadingWindow.isDestroyed()) {
    loadingWindow.webContents.executeJavaScript(
      `document.getElementById('status').textContent = ${JSON.stringify(text)}` +
      `;document.getElementById('dots').textContent = ''`
    ).catch(() => {})
  }
}

function closeLoadingWindow() {
  if (loadingWindow) {
    try { loadingWindow.close() } catch {}
    loadingWindow = null
  }
}

// ============================================
// 后端进程管理
// ============================================
function startBackend(port) {
  return new Promise((resolve, reject) => {
    const userConfig = loadConfig()
    const uploadsDir = path.join(USER_DATA_DIR, 'uploads')
    fs.mkdirSync(uploadsDir, { recursive: true })

    const env = {
      ...process.env,
      PORT: String(port),
      DATABASE_URL: `file:${DB_PATH}`,
      APP_ENV: 'desktop',
      APP_MODE: 'desktop',
      UPLOADS_DIR: uploadsDir,
      DEEPSEEK_API_KEY: userConfig.deepseekApiKey || '',
      DEEPSEEK_BASE_URL: 'https://api.deepseek.com',
      DEEPSEEK_MODEL: 'deepseek-v4-flash',
      JWT_SECRET: 'desktop-demo-jwt-' + Math.random().toString(36).slice(2, 10),
      JWT_EXPIRES_IN: '1440m',
      ADMIN_USERNAME: 'admin',
      ADMIN_EMAIL: 'admin@example.com',
      ADMIN_PASSWORD: 'admin123456',
    }

    const backendCommand = isDev ? 'node' : process.execPath
    const backendEnv = isDev ? env : { ...env, ELECTRON_RUN_AS_NODE: '1' }

    backendProcess = spawn(backendCommand, [SERVER_MAIN], {
      env: backendEnv,
      cwd: SERVER_CWD,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    backendProcess.stdout.on('data', (data) => {
      console.log('[backend]', data.toString().trim())
    })

    backendProcess.stderr.on('data', (data) => {
      console.error('[backend]', data.toString().trim())
    })

    backendProcess.on('error', (err) => {
      reject(new Error(`无法启动后端进程: ${err.message}`))
    })

    backendProcess.on('exit', (code) => {
      console.log(`[backend] 进程退出，退出码: ${code}`)
      backendProcess = null
    })

    resolve()
  })
}

function stopBackend() {
  if (backendProcess) {
    try {
      backendProcess.kill('SIGTERM')
    } catch {}
    backendProcess = null
  }
}

// ============================================
// 健康检查轮询
// ============================================
function waitForHealth(port, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const http = require('http')

    function check() {
      if (Date.now() - start > timeoutMs) {
        return reject(new Error('后端启动超时'))
      }

      http.get(`http://127.0.0.1:${port}/health`, (res) => {
        let body = ''
        res.on('data', (chunk) => body += chunk)
        res.on('end', () => {
          try {
            const data = JSON.parse(body)
            const status = data.status || data.data?.status
            if (status === 'ok') return resolve()
          } catch {}
          setTimeout(check, 500)
        })
      }).on('error', () => {
        setTimeout(check, 500)
      })
    }

    check()
  })
}

// ============================================
// 安全声明弹窗（首次启动）
// ============================================
function showDisclaimer() {
  return new Promise((resolve) => {
    const config = loadConfig()
    if (config.disclaimerAccepted) return resolve(true)

    const win = new BrowserWindow({
      width: 560,
      height: 540,
      resizable: false,
      frame: false,
      parent: null,
      modal: true,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    })

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
    background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 50%, #C084FC 100%);
    color: #fff; padding: 32px 28px; user-select: none;
  }
  h2 { font-size: 18px; margin-bottom: 16px; text-align: center; }
  .content { font-size: 13px; line-height: 1.8; margin-bottom: 20px; opacity: 0.95; }
  .content p { margin-bottom: 8px; }
  .highlight { background: rgba(255,255,255,0.15); border-radius: 8px; padding: 12px 16px; font-weight: bold; }
  .checkbox-area { display: flex; align-items: center; gap: 8px; margin: 16px 0; font-size: 14px; }
  .btn-area { display: flex; gap: 12px; justify-content: center; }
  button {
    border: none; border-radius: 8px; padding: 10px 28px;
    font-size: 14px; cursor: pointer; font-weight: bold;
  }
  .btn-accept { background: #fff; color: #8B5CF6; }
  .btn-accept:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-quit { background: rgba(255,255,255,0.2); color: #fff; }
</style>
</head>
<body>
<h2>本地演示版声明</h2>
<div class="content">
  <p>本应用为 AI 心理健康助手的<strong>本地演示版本</strong>，仅供个人体验和学习用途。</p>
  <p>所有数据保存在你的电脑本地，不会上传到任何服务器。</p>
  <p>AI 聊天功能默认使用模拟回复，不会产生 AI API 费用。</p>
  <p>如填入 AI API Key，Key 仅保存在你的电脑上。</p>
  <p>本应用不提供医疗诊断、处方或心理治疗。</p>
  <p class="highlight">如遇紧急情况，请拨打 110 或全国心理援助热线 400-161-9995</p>
</div>
<div class="checkbox-area">
  <input type="checkbox" id="agree" onchange="document.getElementById('btnAccept').disabled=!this.checked">
  <label for="agree">我已了解以上声明（继续使用）</label>
</div>
<div class="btn-area">
  <button id="btnAccept" class="btn-accept" disabled onclick="accept()">继续使用</button>
  <button class="btn-quit" onclick="quit()">退出</button>
</div>
<script>
  try {
    const { ipcRenderer } = require('electron')
    window.accept = function() { ipcRenderer.send('disclaimer-accept') }
    window.quit = function() { ipcRenderer.send('disclaimer-reject') }
  } catch(e) {
    document.body.innerHTML = '<div style="padding:40px;text-align:center;color:#fff"><h2>加载失败</h2><p style="margin:20px 0">'+e.message+'</p><button class="btn-accept" onclick="window.close()" style="padding:10px 28px;border:none;border-radius:8px;background:#fff;color:#8B5CF6;font-size:14px;cursor:pointer">关闭</button></div>'
  }
</script>
</body>
</html>`

    // 写入临时 HTML 文件，规避 data: URL 在 Electron v33 的 nodeIntegration 限制
    const tmpFile = path.join(app.getPath('temp'), 'ai-mental-health-disclaimer.html')
    fs.writeFileSync(tmpFile, html, 'utf-8')
    win.loadFile(tmpFile)
    win.once('ready-to-show', () => win.show())

    ipcMain.once('disclaimer-accept', () => {
      saveConfig({ ...config, disclaimerAccepted: true })
      // 清理临时文件
      try { fs.unlinkSync(tmpFile) } catch {}
      win.close()
      resolve(true)
    })
    ipcMain.once('disclaimer-reject', () => {
      try { fs.unlinkSync(tmpFile) } catch {}
      win.close()
      resolve(false)
    })

    // 安全兜底：弹窗被直接关闭视为拒绝
    win.on('closed', () => {
      resolve(false)
    })
  })
}

// ============================================
// IPC 处理器
// ============================================
function registerIpc() {
  ipcMain.handle('get-config', () => {
    const config = loadConfig()
    let maskedKey = config.deepseekApiKey || ''
    if (maskedKey.length > 12) {
      maskedKey = maskedKey.slice(0, 8) + '****' + maskedKey.slice(-4)
    }
    return { deepseekApiKey: maskedKey, disclaimerAccepted: config.disclaimerAccepted }
  })

  ipcMain.handle('save-config', async (event, key, value) => {
    const config = loadConfig()
    config[key] = value
    saveConfig(config)
    if (key === 'deepseekApiKey') {
      stopBackend()
      await startBackend(apiPort)
      await waitForHealth(apiPort)
    }
    return { success: true }
  })

  ipcMain.handle('reset-demo-data', async () => {
    stopBackend()
    await new Promise(r => setTimeout(r, 1000))
    if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH)
    if (!fs.existsSync(BUILTIN_DB)) {
      return { success: false, message: '内置演示数据库未找到' }
    }
    fs.copyFileSync(BUILTIN_DB, DB_PATH)
    await startBackend(apiPort)
    await waitForHealth(apiPort)
    return { success: true, message: '演示数据已重置' }
  })
}

// ============================================
// 应用启动
// ============================================
app.whenReady().then(async () => {
  try {
    // 1. 立即显示加载窗口（用户获得即时反馈）
    showLoadingWindow()
    updateLoadingStatus('正在初始化')

    // 2. 安全声明弹窗（显示在加载窗口之上，首次启动时拦截）
    const accepted = await showDisclaimer()
    if (!accepted) { closeLoadingWindow(); app.quit(); return }

    // 3. 分配随机端口
    updateLoadingStatus('正在分配端口')
    apiPort = await getRandomPort()
    console.log(`[main] 分配端口: ${apiPort}`)

    // 4. 初始化数据库 + 注册 IPC
    updateLoadingStatus('正在准备数据')
    initDatabase()
    registerIpc()

    // 5. 启动后端
    updateLoadingStatus('正在启动后端服务')
    console.log('[main] 启动后端...')
    await startBackend(apiPort)
    console.log('[main] 等待后端就绪...')
    await waitForHealth(apiPort)
    console.log('[main] 后端已就绪')

    // 6. 创建主窗口
    updateLoadingStatus('正在加载界面')
    mainWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      title: '心晴 · AI心理健康助手',
      icon: path.join(__dirname, 'assets', 'icon.ico'),
      show: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    })

    mainWindow.loadURL(`http://127.0.0.1:${apiPort}`)
    mainWindow.setMenuBarVisibility(false)

    mainWindow.once('ready-to-show', () => {
      closeLoadingWindow()
      mainWindow.show()
    })

    mainWindow.on('closed', () => { mainWindow = null })
  } catch (err) {
    closeLoadingWindow()
    dialog.showErrorBox('启动失败', `应用启动失败，请重试。\n\n${err.message}`)
    app.quit()
  }
})

app.on('window-all-closed', () => {
  stopBackend()
  app.quit()
})

app.on('before-quit', () => {
  stopBackend()
})
