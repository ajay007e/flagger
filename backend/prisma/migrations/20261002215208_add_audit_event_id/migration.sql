/*
  Warnings:

  - A unique constraint covering the columns `[event_id]` on the table `audit_logs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `audit_logs` ADD COLUMN `event_id` CHAR(36) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `audit_logs_event_id_key` ON `audit_logs`(`event_id`);
