-- CreateTable
CREATE TABLE `flags` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `entity_id` INTEGER UNSIGNED NOT NULL,
    `key` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(500) NULL,
    `type` ENUM('boolean', 'string', 'number', 'json') NOT NULL,
    `updated_by` INTEGER UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `flags_entity_id_key_key`(`entity_id`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `flag_variants` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `flag_id` INTEGER UNSIGNED NOT NULL,
    `key` VARCHAR(50) NOT NULL,
    `value` JSON NOT NULL,

    UNIQUE INDEX `flag_variants_flag_id_key_key`(`flag_id`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `flag_environments` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `flag_id` INTEGER UNSIGNED NOT NULL,
    `environment_id` INTEGER UNSIGNED NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `default_variant_id` INTEGER UNSIGNED NOT NULL,
    `off_variant_id` INTEGER UNSIGNED NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `flag_environments_flag_id_environment_id_key`(`flag_id`, `environment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `flag_rules` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `flag_environment_id` INTEGER UNSIGNED NOT NULL,
    `position` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `conditions` JSON NOT NULL,
    `serve_variant_id` INTEGER UNSIGNED NULL,
    `rollout` JSON NULL,
    `bucket_by` VARCHAR(100) NOT NULL DEFAULT 'userId',

    INDEX `flag_rules_flag_environment_id_position_idx`(`flag_environment_id`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `flags` ADD CONSTRAINT `flags_entity_id_fkey` FOREIGN KEY (`entity_id`) REFERENCES `entities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `flags` ADD CONSTRAINT `flags_updated_by_fkey` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `flag_variants` ADD CONSTRAINT `flag_variants_flag_id_fkey` FOREIGN KEY (`flag_id`) REFERENCES `flags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `flag_environments` ADD CONSTRAINT `flag_environments_flag_id_fkey` FOREIGN KEY (`flag_id`) REFERENCES `flags`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `flag_environments` ADD CONSTRAINT `flag_environments_environment_id_fkey` FOREIGN KEY (`environment_id`) REFERENCES `environments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `flag_environments` ADD CONSTRAINT `flag_environments_default_variant_id_fkey` FOREIGN KEY (`default_variant_id`) REFERENCES `flag_variants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `flag_environments` ADD CONSTRAINT `flag_environments_off_variant_id_fkey` FOREIGN KEY (`off_variant_id`) REFERENCES `flag_variants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `flag_rules` ADD CONSTRAINT `flag_rules_flag_environment_id_fkey` FOREIGN KEY (`flag_environment_id`) REFERENCES `flag_environments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `flag_rules` ADD CONSTRAINT `flag_rules_serve_variant_id_fkey` FOREIGN KEY (`serve_variant_id`) REFERENCES `flag_variants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
