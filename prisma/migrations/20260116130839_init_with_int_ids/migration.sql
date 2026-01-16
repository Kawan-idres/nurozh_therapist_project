-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `password_hash` VARCHAR(255) NULL,
    `auth_provider` VARCHAR(20) NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `date_of_birth` DATE NULL,
    `gender` VARCHAR(20) NULL,
    `avatar_url` TEXT NULL,
    `preferred_language` VARCHAR(5) NULL DEFAULT 'en',
    `timezone` VARCHAR(50) NULL DEFAULT 'UTC',
    `status` VARCHAR(30) NULL DEFAULT 'active',
    `email_verified_at` DATETIME(6) NULL,
    `phone_verified_at` DATETIME(6) NULL,
    `onboarding_completed_at` DATETIME(6) NULL,
    `free_session_used` BOOLEAN NULL DEFAULT false,
    `last_login_at` DATETIME(6) NULL,
    `fcm_token` TEXT NULL,
    `device_info` JSON NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL,
    `deleted_at` DATETIME(6) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `role` VARCHAR(50) NULL DEFAULT 'admin',
    `is_active` BOOLEAN NULL DEFAULT true,
    `last_login_at` DATETIME(6) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL,

    UNIQUE INDEX `admins_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `therapists` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `date_of_birth` DATE NULL,
    `gender` VARCHAR(20) NULL,
    `avatar_url` TEXT NULL,
    `bio` JSON NULL,
    `title` JSON NULL,
    `years_of_experience` INTEGER NULL,
    `license_number` VARCHAR(100) NULL,
    `session_rate_amount` DECIMAL(10, 2) NULL,
    `session_rate_currency` VARCHAR(3) NULL DEFAULT 'USD',
    `session_duration_minutes` INTEGER NULL DEFAULT 50,
    `spoken_languages` JSON NULL,
    `status` VARCHAR(30) NULL DEFAULT 'pending',
    `approved_by` INTEGER NULL,
    `approved_at` DATETIME(6) NULL,
    `preferred_language` VARCHAR(5) NULL DEFAULT 'en',
    `timezone` VARCHAR(50) NULL DEFAULT 'UTC',
    `last_login_at` DATETIME(6) NULL,
    `fcm_token` TEXT NULL,
    `device_info` JSON NULL,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL,
    `deleted_at` DATETIME(6) NULL,

    UNIQUE INDEX `therapists_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL,

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `module` VARCHAR(50) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `permissions_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `role_id` INTEGER NOT NULL,
    `permission_id` INTEGER NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`role_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(512) NOT NULL,
    `user_type` VARCHAR(20) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `expires_at` DATETIME(6) NOT NULL,
    `revoked_at` DATETIME(6) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `refresh_tokens_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `specialties` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` JSON NOT NULL,
    `description` JSON NULL,
    `icon_url` TEXT NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `display_order` INTEGER NULL DEFAULT 0,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `therapist_specialties` (
    `therapist_id` INTEGER NOT NULL,
    `specialty_id` INTEGER NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`therapist_id`, `specialty_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `otp_verifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `phone` VARCHAR(20) NOT NULL,
    `otp_code` VARCHAR(6) NOT NULL,
    `purpose` VARCHAR(20) NOT NULL,
    `expires_at` DATETIME(6) NOT NULL,
    `verified_at` DATETIME(6) NULL,
    `attempts` INTEGER NULL DEFAULT 0,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `therapist_documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `therapist_id` INTEGER NOT NULL,
    `document_type` VARCHAR(30) NULL,
    `title` VARCHAR(255) NULL,
    `file_url` TEXT NOT NULL,
    `file_name` VARCHAR(255) NULL,
    `file_size_bytes` BIGINT NULL,
    `mime_type` VARCHAR(100) NULL,
    `status` VARCHAR(20) NULL DEFAULT 'pending',
    `reviewed_by` INTEGER NULL,
    `reviewed_at` DATETIME(6) NULL,
    `rejection_reason` TEXT NULL,
    `expires_at` DATE NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questionnaire_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` JSON NOT NULL,
    `description` JSON NULL,
    `display_order` INTEGER NULL DEFAULT 0,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `category_id` INTEGER NULL,
    `question_text` JSON NOT NULL,
    `question_type` VARCHAR(30) NOT NULL,
    `is_required` BOOLEAN NULL DEFAULT true,
    `display_order` INTEGER NULL DEFAULT 0,
    `is_active` BOOLEAN NULL DEFAULT true,
    `scale_min` INTEGER NULL,
    `scale_max` INTEGER NULL,
    `scale_min_label` JSON NULL,
    `scale_max_label` JSON NULL,
    `created_by` INTEGER NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_options` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `question_id` INTEGER NOT NULL,
    `option_text` JSON NOT NULL,
    `display_order` INTEGER NULL DEFAULT 0,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questionnaire_answers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `question_id` INTEGER NOT NULL,
    `answer_text` TEXT NULL,
    `answer_scale` INTEGER NULL,
    `selected_option_ids` JSON NULL,
    `question_snapshot` JSON NULL,
    `answered_at` DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `therapist_availability` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `therapist_id` INTEGER NOT NULL,
    `day_of_week` VARCHAR(15) NOT NULL,
    `start_time` TIME(0) NOT NULL,
    `end_time` TIME(0) NOT NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `therapist_availability_exceptions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `therapist_id` INTEGER NOT NULL,
    `exception_date` DATE NOT NULL,
    `is_available` BOOLEAN NULL DEFAULT false,
    `start_time` TIME(0) NULL,
    `end_time` TIME(0) NULL,
    `reason` TEXT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bookings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `therapist_id` INTEGER NOT NULL,
    `session_type` VARCHAR(20) NOT NULL,
    `scheduled_start` DATETIME(6) NOT NULL,
    `scheduled_end` DATETIME(6) NOT NULL,
    `duration_minutes` INTEGER NOT NULL,
    `is_free_session` BOOLEAN NULL DEFAULT false,
    `amount` DECIMAL(10, 2) NULL,
    `currency` VARCHAR(3) NULL DEFAULT 'USD',
    `status` VARCHAR(30) NULL DEFAULT 'pending',
    `rescheduled_from_booking_id` INTEGER NULL,
    `reschedule_reason` TEXT NULL,
    `rescheduled_at` DATETIME(6) NULL,
    `cancelled_at` DATETIME(6) NULL,
    `cancellation_reason` TEXT NULL,
    `cancelled_by` VARCHAR(20) NULL,
    `confirmed_at` DATETIME(6) NULL,
    `user_notes` TEXT NULL,
    `therapist_notes` TEXT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `booking_id` INTEGER NOT NULL,
    `session_type` VARCHAR(20) NOT NULL,
    `status` VARCHAR(20) NULL DEFAULT 'scheduled',
    `started_at` DATETIME(6) NULL,
    `ended_at` DATETIME(6) NULL,
    `actual_duration_minutes` INTEGER NULL,
    `provider` VARCHAR(50) NULL,
    `room_id` VARCHAR(255) NULL,
    `room_url` TEXT NULL,
    `provider_metadata` JSON NULL,
    `user_token` TEXT NULL,
    `therapist_token` TEXT NULL,
    `recording_url` TEXT NULL,
    `recording_duration_seconds` INTEGER NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL,

    UNIQUE INDEX `sessions_booking_id_key`(`booking_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `therapist_id` INTEGER NOT NULL,
    `session_id` INTEGER NULL,
    `last_message_at` DATETIME(6) NULL,
    `user_last_read_at` DATETIME(6) NULL,
    `therapist_last_read_at` DATETIME(6) NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conversation_id` INTEGER NOT NULL,
    `sender_type` VARCHAR(20) NOT NULL,
    `sender_id` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `message_type` VARCHAR(20) NULL DEFAULT 'text',
    `is_read` BOOLEAN NULL DEFAULT false,
    `read_at` DATETIME(6) NULL,
    `deleted_at` DATETIME(6) NULL,
    `deleted_by` INTEGER NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `therapist_id` INTEGER NOT NULL,
    `type` VARCHAR(20) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `started_at` DATETIME(6) NOT NULL,
    `renews_at` DATETIME(6) NULL,
    `cancelled_at` DATETIME(6) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `booking_id` INTEGER NULL,
    `user_id` INTEGER NOT NULL,
    `subscription_id` INTEGER NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(3) NULL DEFAULT 'USD',
    `furatpay_invoice_id` VARCHAR(255) NULL,
    `furatpay_pay_link` TEXT NULL,
    `status` VARCHAR(20) NULL DEFAULT 'pending',
    `paid_at` DATETIME(6) NULL,
    `expires_at` DATETIME(6) NULL,
    `refunded_at` DATETIME(6) NULL,
    `refund_amount` DECIMAL(10, 2) NULL,
    `refund_reason` TEXT NULL,
    `webhook_payload` JSON NULL,
    `webhook_received_at` DATETIME(6) NULL,
    `payment_method` VARCHAR(50) NULL,
    `transaction_id` VARCHAR(255) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL,

    UNIQUE INDEX `payments_booking_id_key`(`booking_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `therapist_payouts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `therapist_id` INTEGER NOT NULL,
    `period_start` DATE NOT NULL,
    `period_end` DATE NOT NULL,
    `total_amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `paid_at` DATETIME(6) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `recipient_type` VARCHAR(20) NOT NULL,
    `recipient_id` INTEGER NOT NULL,
    `template_id` INTEGER NULL,
    `title` VARCHAR(255) NOT NULL,
    `body` TEXT NOT NULL,
    `channel` VARCHAR(20) NULL DEFAULT 'push',
    `status` VARCHAR(20) NULL DEFAULT 'pending',
    `is_read` BOOLEAN NULL DEFAULT false,
    `read_at` DATETIME(6) NULL,
    `sent_at` DATETIME(6) NULL,
    `delivered_at` DATETIME(6) NULL,
    `failed_at` DATETIME(6) NULL,
    `failure_reason` TEXT NULL,
    `related_entity_type` VARCHAR(50) NULL,
    `related_entity_id` INTEGER NULL,
    `data` JSON NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `title_template` JSON NOT NULL,
    `body_template` JSON NOT NULL,
    `channel` VARCHAR(20) NULL DEFAULT 'push',
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL,

    UNIQUE INDEX `notification_templates_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actor_type` VARCHAR(20) NOT NULL,
    `actor_id` INTEGER NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` INTEGER NOT NULL,
    `old_values` JSON NULL,
    `new_values` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webhook_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `source` VARCHAR(50) NOT NULL,
    `event_type` VARCHAR(100) NULL,
    `headers` JSON NULL,
    `payload` JSON NOT NULL,
    `processed` BOOLEAN NULL DEFAULT false,
    `processed_at` DATETIME(6) NULL,
    `processing_error` TEXT NULL,
    `response_status` INTEGER NULL,
    `response_body` TEXT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `therapist_specialties` ADD CONSTRAINT `therapist_specialties_therapist_id_fkey` FOREIGN KEY (`therapist_id`) REFERENCES `therapists`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `therapist_specialties` ADD CONSTRAINT `therapist_specialties_specialty_id_fkey` FOREIGN KEY (`specialty_id`) REFERENCES `specialties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `therapist_documents` ADD CONSTRAINT `therapist_documents_therapist_id_fkey` FOREIGN KEY (`therapist_id`) REFERENCES `therapists`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `questionnaire_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_options` ADD CONSTRAINT `question_options_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questionnaire_answers` ADD CONSTRAINT `questionnaire_answers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questionnaire_answers` ADD CONSTRAINT `questionnaire_answers_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `therapist_availability` ADD CONSTRAINT `therapist_availability_therapist_id_fkey` FOREIGN KEY (`therapist_id`) REFERENCES `therapists`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bookings` ADD CONSTRAINT `bookings_therapist_id_fkey` FOREIGN KEY (`therapist_id`) REFERENCES `therapists`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `session_therapist` FOREIGN KEY (`booking_id`) REFERENCES `therapists`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_therapist_id_fkey` FOREIGN KEY (`therapist_id`) REFERENCES `therapists`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversations` ADD CONSTRAINT `conversations_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_therapist_id_fkey` FOREIGN KEY (`therapist_id`) REFERENCES `therapists`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notification_user` FOREIGN KEY (`recipient_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
