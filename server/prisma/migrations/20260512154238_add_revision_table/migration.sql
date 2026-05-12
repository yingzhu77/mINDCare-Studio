-- CreateTable
CREATE TABLE "knowledge_article_revisions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "articleId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "reviewerId" INTEGER,
    "title" TEXT NOT NULL,
    "categoryId" INTEGER,
    "summary" TEXT,
    "tags" TEXT,
    "coverImage" TEXT,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending_review',
    "rejectReason" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "knowledge_article_revisions_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "knowledge_articles" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "knowledge_article_revisions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "knowledge_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "knowledge_article_revisions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "knowledge_article_revisions_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "knowledge_article_revisions_status_idx" ON "knowledge_article_revisions"("status");

-- CreateIndex
CREATE INDEX "knowledge_article_revisions_articleId_status_idx" ON "knowledge_article_revisions"("articleId", "status");

-- CreateIndex
CREATE INDEX "chat_messages_sessionId_idx" ON "chat_messages"("sessionId");

-- CreateIndex
CREATE INDEX "chat_sessions_userId_idx" ON "chat_sessions"("userId");
