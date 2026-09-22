-- CreateTable
CREATE TABLE `audit_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actor_type` ENUM('user', 'api_key', 'system') NOT NULL,
    `actor_id` INTEGER UNSIGNED NULL,
    `action` VARCHAR(100) NOT NULL,
    `resource_type` VARCHAR(100) NOT NULL,
    `resource_id` VARCHAR(191) NULL,
    `project_id` INTEGER UNSIGNED NULL,
    `entity_id` INTEGER UNSIGNED NULL,
    `environment_id` INTEGER UNSIGNED NULL,
    `outcome` ENUM('success', 'failure') NOT NULL DEFAULT 'success',
    `before` JSON NULL,
    `after` JSON NULL,
    `metadata` JSON NULL,
    `request_id` CHAR(36) NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(512) NULL,

    INDEX `audit_logs_created_at_idx`(`created_at`),
    INDEX `audit_logs_resource_type_resource_id_idx`(`resource_type`, `resource_id`),
    INDEX `audit_logs_actor_type_actor_id_action_created_at_idx`(`actor_type`, `actor_id`, `action`, `created_at`),
    INDEX `audit_logs_project_id_created_at_idx`(`project_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
