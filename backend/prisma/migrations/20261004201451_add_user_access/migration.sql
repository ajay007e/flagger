-- CreateTable
CREATE TABLE `user_access` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `assignment_id` CHAR(36) NOT NULL,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `role_id` INTEGER UNSIGNED NOT NULL,
    `project_id` INTEGER UNSIGNED NULL,
    `entity_id` INTEGER UNSIGNED NULL,
    `environment_id` INTEGER UNSIGNED NULL,
    `updated_by` INTEGER UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    INDEX `user_access_assignment_id_idx`(`assignment_id`),
    INDEX `user_access_user_id_deleted_at_idx`(`user_id`, `deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_access` ADD CONSTRAINT `user_access_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_access` ADD CONSTRAINT `user_access_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_access` ADD CONSTRAINT `user_access_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_access` ADD CONSTRAINT `user_access_entity_id_fkey` FOREIGN KEY (`entity_id`) REFERENCES `entities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_access` ADD CONSTRAINT `user_access_environment_id_fkey` FOREIGN KEY (`environment_id`) REFERENCES `environments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_access` ADD CONSTRAINT `user_access_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
