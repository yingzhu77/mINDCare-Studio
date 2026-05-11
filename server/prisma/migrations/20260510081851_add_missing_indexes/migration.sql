-- CreateIndex
CREATE INDEX "ai_analysis_results_bizType_bizId_idx" ON "ai_analysis_results"("bizType", "bizId");

-- CreateIndex
CREATE INDEX "knowledge_articles_status_idx" ON "knowledge_articles"("status");

-- CreateIndex
CREATE INDEX "knowledge_articles_authorId_idx" ON "knowledge_articles"("authorId");
