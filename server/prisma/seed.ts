import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

  // ========== 用户 ==========

  // 创建管理员
  let admin = await prisma.user.findUnique({ where: { username: adminUsername } });
  if (!admin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    admin = await prisma.user.create({
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

  // 创建测试用户
  let testUser = await prisma.user.findUnique({ where: { username: 'testuser' } });
  if (!testUser) {
    const passwordHash = await bcrypt.hash('test123456', 10);
    testUser = await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'testuser@example.com',
        passwordHash,
        role: 'user',
        status: 1,
      },
    });
    console.log('测试用户已创建: testuser / test123456');
  } else {
    console.log('测试用户已存在: testuser');
  }

  // ========== 知识分类 ==========

  const categories = [
    { categoryName: '情绪管理', sortOrder: 1 },
    { categoryName: '压力应对', sortOrder: 2 },
    { categoryName: '人际关系', sortOrder: 3 },
    { categoryName: '自我成长', sortOrder: 4 },
    { categoryName: '睡眠改善', sortOrder: 5 },
  ];

  const categoryMap: Record<string, number> = {};
  for (const cat of categories) {
    const existingCat = await prisma.knowledgeCategory.findFirst({
      where: { categoryName: cat.categoryName },
    });
    if (!existingCat) {
      const created = await prisma.knowledgeCategory.create({ data: cat });
      categoryMap[cat.categoryName] = created.id;
    } else {
      categoryMap[cat.categoryName] = existingCat.id;
    }
  }

  // ========== 知识文章 ==========

  const sampleArticles = [
    {
      title: '如何有效管理日常焦虑',
      categoryName: '情绪管理',
      summary: '介绍几种科学的焦虑管理方法，帮助你在日常生活中保持平静。',
      content:
        '焦虑是一种常见的情绪反应。本文介绍几种经过心理学验证的方法：正念冥想、呼吸调节、认知重构等。通过定期练习，你可以更好地管理焦虑情绪。',
      tags: JSON.stringify(['焦虑', '正念', '情绪管理']),
      status: 'published',
    },
    {
      title: '工作压力的应对策略',
      categoryName: '压力应对',
      summary: '职场压力不可避免，关键在于如何有效应对。',
      content:
        '高压工作环境下的自我调节技巧：合理设定边界、时间管理、寻求社交支持、保持运动习惯。科学应对压力，提升工作幸福感。',
      tags: JSON.stringify(['压力', '职场', '应对策略']),
      status: 'published',
    },
    {
      title: '改善人际沟通的五个技巧',
      categoryName: '人际关系',
      summary: '良好的人际关系始于有效的沟通。',
      content:
        '沟通是人际关系的基础。学习积极倾听、非暴力沟通、共情表达等技巧，能显著提升你的人际关系质量。',
      tags: JSON.stringify(['沟通', '人际关系', '社交']),
      status: 'published',
    },
    {
      title: '正念冥想入门指南',
      categoryName: '自我成长',
      summary: '从零开始学习正念冥想，提升自我觉察能力。',
      content:
        '正念冥想是一种培养当下觉察力的练习。本指南涵盖基础呼吸冥想、身体扫描、行走冥想等入门技术。',
      tags: JSON.stringify(['正念', '冥想', '自我成长']),
      status: 'published',
    },
    {
      title: '改善睡眠质量的科学方法',
      categoryName: '睡眠改善',
      summary: '基于睡眠科学的实用改善建议。',
      content:
        '良好的睡眠对心理健康至关重要。本文介绍睡眠卫生、环境优化、作息调整等科学改善方法。',
      tags: JSON.stringify(['睡眠', '健康', '作息']),
      status: 'published',
    },
    {
      title: '儿童情绪管理家长指南',
      categoryName: '情绪管理',
      summary: '帮助家长引导孩子认识和管理情绪。',
      content:
        '儿童情绪管理是家长关注的重点话题。本文提供适合不同年龄段儿童的情绪引导策略。',
      tags: JSON.stringify(['儿童', '情绪管理', '育儿']),
      status: 'draft',
    },
    {
      title: '运动与心理健康的关系',
      categoryName: '自我成长',
      summary: '探讨规律运动对心理健康的积极影响。',
      content:
        '运动不仅能改善身体健康，对心理健康也有显著益处。本文总结运动对焦虑、抑郁、自尊等方面的影响。',
      tags: JSON.stringify(['运动', '心理健康', '自我成长']),
      status: 'pending_review',
    },
  ];

  for (const art of sampleArticles) {
    const existing = await prisma.knowledgeArticle.findFirst({
      where: { title: art.title },
    });
    if (!existing) {
      await prisma.knowledgeArticle.create({
        data: {
          title: art.title,
          categoryId: categoryMap[art.categoryName] || null,
          authorId: admin.id,
          summary: art.summary,
          content: art.content,
          tags: art.tags,
          status: art.status,
          publishedAt: art.status === 'published' ? new Date() : null,
        },
      });
    }
  }
  console.log(`知识文章已同步: ${Object.keys(sampleArticles).length} 篇`);

  // ========== 咨询会话 ==========

  const existingSessions = await prisma.chatSession.count();
  if (existingSessions === 0) {
    const session1 = await prisma.chatSession.create({
      data: {
        sessionId: 'sample-session-001',
        userId: testUser.id,
        userName: 'testuser',
        startTime: new Date(Date.now() - 86400000), // 1 天前
        status: 'closed',
        messageCount: 4,
        emotionTags: JSON.stringify(['焦虑', '紧张']),
        aiSummary:
          '用户表达了工作压力带来的焦虑情绪，通过对话引导用户进行了呼吸放松练习，情绪有所缓解。',
        riskLevel: 'low',
      },
    });

    await prisma.chatMessage.createMany({
      data: [
        {
          sessionId: session1.sessionId,
          role: 'user',
          content: '最近工作压力很大，经常失眠，不知道该怎么办。',
        },
        {
          sessionId: session1.sessionId,
          role: 'assistant',
          content:
            '听起来你最近确实承受了不少压力。能和我具体说说是什么样的工作压力吗？我们可以一起探讨一些应对方法。',
        },
        {
          sessionId: session1.sessionId,
          role: 'user',
          content: '主要是项目截止日期很紧，感觉时间不够用。',
        },
        {
          sessionId: session1.sessionId,
          role: 'assistant',
          content:
            '时间压力确实是常见的压力源。我建议你可以尝试番茄工作法，把大任务拆解成小单元，每25分钟专注工作后休息5分钟。同时，和上级沟通一下项目优先级也很重要。',
        },
      ],
    });

    const session2 = await prisma.chatSession.create({
      data: {
        sessionId: 'sample-session-002',
        userId: testUser.id,
        userName: 'testuser',
        startTime: new Date(Date.now() - 172800000), // 2 天前
        status: 'closed',
        messageCount: 2,
        emotionTags: JSON.stringify(['低落', '迷茫']),
        aiSummary:
          '用户分享了近期生活中的迷茫感，对话帮助用户梳理了当前困惑的核心原因。',
        riskLevel: 'low',
      },
    });

    await prisma.chatMessage.createMany({
      data: [
        {
          sessionId: session2.sessionId,
          role: 'user',
          content: '感觉最近做什么都提不起劲，对未来很迷茫。',
        },
        {
          sessionId: session2.sessionId,
          role: 'assistant',
          content:
            '这种感受很多人都会有。你能说说具体是什么让你感到迷茫吗？有时把模糊的担忧写下来，反而能看得更清楚。',
        },
      ],
    });

    console.log('咨询会话已创建: 2 条');
  } else {
    console.log('咨询会话已存在，跳过');
  }

  // ========== 情绪日记 ==========

  const existingDiaries = await prisma.emotionDiary.count();
  if (existingDiaries === 0) {
    await prisma.emotionDiary.createMany({
      data: [
        {
          userId: testUser.id,
          userName: 'testuser',
          diaryDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          moodScore: 6,
          sleepQuality: 5,
          stressLevel: 7,
          dominantEmotion: '焦虑',
          emotionTriggers: '工作截止日期临近',
          diaryContent: '今天工作特别忙，项目进度落后了，感觉压力很大。晚上加班到很晚，睡眠质量也不好。',
        },
        {
          userId: testUser.id,
          userName: 'testuser',
          diaryDate: new Date(Date.now() - 172800000).toISOString().split('T')[0],
          moodScore: 8,
          sleepQuality: 8,
          stressLevel: 3,
          dominantEmotion: '平静',
          emotionTriggers: '周末休息、户外散步',
          diaryContent: '今天难得休息，去公园散步了。阳光很好，看到很多花开，心情放松了很多。',
        },
        {
          userId: testUser.id,
          userName: 'testuser',
          diaryDate: new Date(Date.now() - 259200000).toISOString().split('T')[0],
          moodScore: 4,
          sleepQuality: 4,
          stressLevel: 8,
          dominantEmotion: '悲伤',
          emotionTriggers: '与朋友发生争执',
          diaryContent: '今天和朋友吵架了，说了些伤人的话。现在很后悔，不知道该怎么修复关系。',
        },
      ],
    });
    console.log('情绪日记已创建: 3 条');
  } else {
    console.log('情绪日记已存在，跳过');
  }

  console.log('Seed 完成');
  console.log('');
  console.log('可用账号:');
  console.log(`  管理员: ${adminUsername} / ${adminPassword}`);
  console.log('  测试用户: testuser / test123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
