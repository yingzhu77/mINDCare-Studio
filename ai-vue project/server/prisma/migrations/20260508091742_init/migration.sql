-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "status" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "knowledge_categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoryName" TEXT NOT NULL,
    "parentId" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "knowledge_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "knowledge_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "knowledge_articles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "categoryId" INTEGER,
    "authorId" INTEGER NOT NULL,
    "reviewerId" INTEGER,
    "summary" TEXT,
    "tags" TEXT,
    "coverImage" TEXT,
    "content" TEXT,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "rejectReason" TEXT,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "knowledge_articles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "knowledge_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "knowledge_articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "knowledge_articles_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chat_sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "userName" TEXT,
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "emotionTags" TEXT,
    "aiSummary" TEXT,
    "riskLevel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "chat_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawPayload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "chat_sessions" ("sessionId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "emotion_diaries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "userName" TEXT,
    "diaryDate" TEXT NOT NULL,
    "moodScore" INTEGER,
    "sleepQuality" INTEGER,
    "stressLevel" INTEGER,
    "dominantEmotion" TEXT,
    "emotionTriggers" TEXT,
    "diaryContent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "emotion_diaries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_analysis_results" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bizType" TEXT NOT NULL,
    "bizId" INTEGER NOT NULL,
    "mainEmotion" TEXT,
    "emotionIntensity" INTEGER,
    "emotionNature" TEXT,
    "riskLevel" TEXT,
    "riskDescription" TEXT,
    "professionalAdvice" TEXT,
    "improvementSuggestions" TEXT,
    "summary" TEXT,
    "emotionTags" TEXT,
    "modelName" TEXT,
    "rawResponse" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    "emotionDiaryId" INTEGER,
    "chatSessionId" INTEGER,
    CONSTRAINT "ai_analysis_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ai_analysis_results_emotionDiaryId_fkey" FOREIGN KEY ("emotionDiaryId") REFERENCES "emotion_diaries" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ai_analysis_results_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "chat_sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "chat_sessions_sessionId_key" ON "chat_sessions"("sessionId");
