import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

  // 创建管理员
  const existing = await prisma.user.findUnique({ where: { username: adminUsername } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        username: adminUsername,
        email: adminEmail,
        passwordHash,
        role: 'admin',
        status: 1,
      },
    });
    console.log(`管理员账号已创建: ${adminUsername}`);
  } else {
    console.log(`管理员账号已存在: ${adminUsername}`);
  }

  // 创建默认分类
  const categories = [
    { categoryName: '情绪管理', sortOrder: 1 },
    { categoryName: '压力应对', sortOrder: 2 },
    { categoryName: '人际关系', sortOrder: 3 },
    { categoryName: '自我成长', sortOrder: 4 },
    { categoryName: '睡眠改善', sortOrder: 5 },
  ];

  for (const cat of categories) {
    const existingCat = await prisma.knowledgeCategory.findFirst({
      where: { categoryName: cat.categoryName },
    });
    if (!existingCat) {
      await prisma.knowledgeCategory.create({ data: cat });
      console.log(`分类已创建: ${cat.categoryName}`);
    }
  }

  console.log('Seed 完成');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
