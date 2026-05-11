-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'user',
    `status` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `knowledge_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `categoryName` VARCHAR(191) NOT NULL,
    `parentId` INTEGER NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `status` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `knowledge_articles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `categoryId` INTEGER NULL,
    `authorId` INTEGER NOT NULL,
    `reviewerId` INTEGER NULL,
    `summary` VARCHAR(191) NULL,
    `tags` VARCHAR(191) NULL,
    `coverImage` VARCHAR(191) NULL,
    `content` MEDIUMTEXT NULL,
    `readCount` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    `rejectReason` VARCHAR(191) NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionId` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `userName` VARCHAR(191) NULL,
    `startTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endTime` DATETIME(3) NULL,
    `messageCount` INTEGER NOT NULL DEFAULT 0,
    `emotionTags` VARCHAR(191) NULL,
    `aiSummary` TEXT NULL,
    `riskLevel` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `chat_sessions_sessionId_key`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `messageTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `rawPayload` MEDIUMTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emotion_diaries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `userName` VARCHAR(191) NULL,
    `diaryDate` VARCHAR(191) NOT NULL,
    `moodScore` INTEGER NULL,
    `sleepQuality` INTEGER NULL,
    `stressLevel` INTEGER NULL,
    `dominantEmotion` VARCHAR(191) NULL,
    `emotionTriggers` VARCHAR(191) NULL,
    `diaryContent` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_analysis_results` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bizType` VARCHAR(191) NOT NULL,
    `bizId` INTEGER NOT NULL,
    `mainEmotion` VARCHAR(191) NULL,
    `emotionIntensity` INTEGER NULL,
    `emotionNature` VARCHAR(191) NULL,
    `riskLevel` VARCHAR(191) NULL,
    `riskDescription` TEXT NULL,
    `professionalAdvice` TEXT NULL,
    `improvementSuggestions` TEXT NULL,
    `summary` TEXT NULL,
    `emotionTags` VARCHAR(191) NULL,
    `modelName` VARCHAR(191) NULL,
    `rawResponse` MEDIUMTEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `errorMessage` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` INTEGER NOT NULL,
    `emotionDiaryId` INTEGER NULL,
    `chatSessionId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `knowledge_categories` ADD CONSTRAINT `knowledge_categories_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `knowledge_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `knowledge_articles` ADD CONSTRAINT `knowledge_articles_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `knowledge_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `knowledge_articles` ADD CONSTRAINT `knowledge_articles_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `knowledge_articles` ADD CONSTRAINT `knowledge_articles_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_sessions` ADD CONSTRAINT `chat_sessions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `chat_sessions`(`sessionId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emotion_diaries` ADD CONSTRAINT `emotion_diaries_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_analysis_results` ADD CONSTRAINT `ai_analysis_results_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_analysis_results` ADD CONSTRAINT `ai_analysis_results_emotionDiaryId_fkey` FOREIGN KEY (`emotionDiaryId`) REFERENCES `emotion_diaries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_analysis_results` ADD CONSTRAINT `ai_analysis_results_chatSessionId_fkey` FOREIGN KEY (`chatSessionId`) REFERENCES `chat_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

