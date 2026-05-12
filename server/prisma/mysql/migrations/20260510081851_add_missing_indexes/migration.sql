-- CreateIndex: AI 分析结果业务类型 + 业务ID 联合索引
CREATE INDEX `ai_analysis_results_bizType_bizId_idx` ON `ai_analysis_results`(`bizType`, `bizId`);

-- CreateIndex: 文章状态查询加速
CREATE INDEX `knowledge_articles_status_idx` ON `knowledge_articles`(`status`);

-- CreateIndex: 文章作者查询加速
CREATE INDEX `knowledge_articles_authorId_idx` ON `knowledge_articles`(`authorId`);
