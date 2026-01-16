-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
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
    `id` VARCHAR(36) NOT NULL,
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
    `id` VARCHAR(36) NOT NULL,
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
    `approved_by` VARCHAR(36) NULL,
    `approved_at` DATETIME(6) NULL,
    `preferred_language` VARCHAR(5) NULL DEFAULT 'en',
    `timezone` VARCHAR(50) NULL DEFAULT 'UTC',
    `last_login_at` DATETIME(6) NULL,
    `fcm_token` TEXT NULL,
    `device_info` JSON NULL,
    `created_by` VARCHAR(36) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL,
    `deleted_at` DATETIME(6) NULL,

    UNIQUE INDEX `therapists_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` VARCHAR(36) NOT NULL,
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
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `module` VARCHAR(50) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `permissions_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_permissions` (
    `role_id` VARCHAR(36) NOT NULL,
    `permission_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`role_id`, `permission_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(36) NOT NULL,
    `token` VARCHAR(512) NOT NULL,
    `user_type` VARCHAR(20) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `expires_at` DATETIME(6) NOT NULL,
    `revoked_at` DATETIME(6) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    UNIQUE INDEX `refresh_tokens_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `specialties` (
    `id` VARCHAR(36) NOT NULL,
    `name` JSON NOT NULL,
    `description` JSON NULL,
    `icon_url` TEXT NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `display_order` INTEGER NULL DEFAULT 0,
    `created_by` VARCHAR(36) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `therapist_specialties` (
    `therapist_id` VARCHAR(36) NOT NULL,
    `specialty_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`therapist_id`, `specialty_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `otp_verifications` (
    `id` VARCHAR(36) NOT NULL,
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
    `id` VARCHAR(36) NOT NULL,
    `therapist_id` VARCHAR(36) NOT NULL,
    `document_type` VARCHAR(30) NULL,
    `title` VARCHAR(255) NULL,
    `file_url` TEXT NOT NULL,
    `file_name` VARCHAR(255) NULL,
    `file_size_bytes` BIGINT NULL,
    `mime_type` VARCHAR(100) NULL,
    `status` VARCHAR(20) NULL DEFAULT 'pending',
    `reviewed_by` VARCHAR(36) NULL,
    `reviewed_at` DATETIME(6) NULL,
    `rejection_reason` TEXT NULL,
    `expires_at` DATE NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questionnaire_categories` (
    `id` VARCHAR(36) NOT NULL,
    `name` JSON NOT NULL,
    `description` JSON NULL,
    `display_order` INTEGER NULL DEFAULT 0,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_by` VARCHAR(36) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questions` (
    `id` VARCHAR(36) NOT NULL,
    `category_id` VARCHAR(36) NULL,
    `question_text` JSON NOT NULL,
    `question_type` VARCHAR(30) NOT NULL,
    `is_required` BOOLEAN NULL DEFAULT true,
    `display_order` INTEGER NULL DEFAULT 0,
    `is_active` BOOLEAN NULL DEFAULT true,
    `scale_min` INTEGER NULL,
    `scale_max` INTEGER NULL,
    `scale_min_label` JSON NULL,
    `scale_max_label` JSON NULL,
    `created_by` VARCHAR(36) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_options` (
    `id` VARCHAR(36) NOT NULL,
    `question_id` VARCHAR(36) NOT NULL,
    `option_text` JSON NOT NULL,
    `display_order` INTEGER NULL DEFAULT 0,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questionnaire_answers` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `question_id` VARCHAR(36) NOT NULL,
    `answer_text` TEXT NULL,
    `answer_scale` INTEGER NULL,
    `selected_option_ids` JSON NULL,
    `question_snapshot` JSON NULL,
    `answered_at` DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `therapist_availability` (
    `id` VARCHAR(36) NOT NULL,
    `therapist_id` VARCHAR(36) NOT NULL,
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
    `id` VARCHAR(36) NOT NULL,
    `therapist_id` VARCHAR(36) NOT NULL,
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
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `therapist_id` VARCHAR(36) NOT NULL,
    `session_type` VARCHAR(20) NOT NULL,
    `scheduled_start` DATETIME(6) NOT NULL,
    `scheduled_end` DATETIME(6) NOT NULL,
    `duration_minutes` INTEGER NOT NULL,
    `is_free_session` BOOLEAN NULL DEFAULT false,
    `amount` DECIMAL(10, 2) NULL,
    `currency` VARCHAR(3) NULL DEFAULT 'USD',
    `status` VARCHAR(30) NULL DEFAULT 'pending',
    `rescheduled_from_booking_id` VARCHAR(36) NULL,
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
    `id` VARCHAR(36) NOT NULL,
    `booking_id` VARCHAR(36) NOT NULL,
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

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conversations` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `therapist_id` VARCHAR(36) NOT NULL,
    `session_id` VARCHAR(36) NULL,
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
    `id` VARCHAR(36) NOT NULL,
    `conversation_id` VARCHAR(36) NOT NULL,
    `sender_type` VARCHAR(20) NOT NULL,
    `sender_id` VARCHAR(36) NOT NULL,
    `content` TEXT NOT NULL,
    `message_type` VARCHAR(20) NULL DEFAULT 'text',
    `is_read` BOOLEAN NULL DEFAULT false,
    `read_at` DATETIME(6) NULL,
    `deleted_at` DATETIME(6) NULL,
    `deleted_by` VARCHAR(36) NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptions` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `therapist_id` VARCHAR(36) NOT NULL,
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
    `id` VARCHAR(36) NOT NULL,
    `booking_id` VARCHAR(36) NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `subscription_id` VARCHAR(36) NULL,
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

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `therapist_payouts` (
    `id` VARCHAR(36) NOT NULL,
    `therapist_id` VARCHAR(36) NOT NULL,
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
    `id` VARCHAR(36) NOT NULL,
    `recipient_type` VARCHAR(20) NOT NULL,
    `recipient_id` VARCHAR(36) NOT NULL,
    `template_id` VARCHAR(36) NULL,
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
    `related_entity_id` VARCHAR(36) NULL,
    `data` JSON NULL,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_templates` (
    `id` VARCHAR(36) NOT NULL,
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
    `id` VARCHAR(36) NOT NULL,
    `actor_type` VARCHAR(20) NOT NULL,
    `actor_id` VARCHAR(36) NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` VARCHAR(36) NOT NULL,
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
    `id` VARCHAR(36) NOT NULL,
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
