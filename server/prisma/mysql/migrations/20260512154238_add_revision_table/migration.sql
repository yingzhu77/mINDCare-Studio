-- CreateTable: knowledge_article_revisions
CREATE TABLE `knowledge_article_revisions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `articleId` INTEGER NOT NULL,
    `authorId` INTEGER NOT NULL,
    `reviewerId` INTEGER NULL,
    `title` VARCHAR(200) NOT NULL,
    `categoryId` INTEGER NULL,
    `summary` TEXT NULL,
    `tags` VARCHAR(500) NULL,
    `coverImage` VARCHAR(500) NULL,
    `content` LONGTEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending_review',
    `rejectReason` TEXT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `knowledge_article_revisions_status_idx`(`status`),
    INDEX `knowledge_article_revisions_articleId_status_idx`(`articleId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `knowledge_article_revisions` ADD CONSTRAINT `knowledge_article_revisions_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `knowledge_articles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `knowledge_article_revisions` ADD CONSTRAINT `knowledge_article_revisions_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `knowledge_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `knowledge_article_revisions` ADD CONSTRAINT `knowledge_article_revisions_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `knowledge_article_revisions` ADD CONSTRAINT `knowledge_article_revisions_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
