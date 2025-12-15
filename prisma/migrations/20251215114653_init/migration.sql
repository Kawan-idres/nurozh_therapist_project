-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "password_hash" VARCHAR(255),
    "auth_provider" VARCHAR(20),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "date_of_birth" DATE,
    "gender" VARCHAR(20),
    "avatar_url" TEXT,
    "preferred_language" VARCHAR(5) DEFAULT 'en',
    "timezone" VARCHAR(50) DEFAULT 'UTC',
    "status" VARCHAR(30) DEFAULT 'active',
    "email_verified_at" TIMESTAMP(6),
    "phone_verified_at" TIMESTAMP(6),
    "onboarding_completed_at" TIMESTAMP(6),
    "free_session_used" BOOLEAN DEFAULT false,
    "last_login_at" TIMESTAMP(6),
    "fcm_token" TEXT,
    "device_info" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "role" VARCHAR(50) DEFAULT 'admin',
    "is_active" BOOLEAN DEFAULT true,
    "last_login_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapists" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "date_of_birth" DATE,
    "gender" VARCHAR(20),
    "avatar_url" TEXT,
    "bio" JSONB,
    "title" JSONB,
    "years_of_experience" INTEGER,
    "license_number" VARCHAR(100),
    "session_rate_amount" DECIMAL(10,2),
    "session_rate_currency" VARCHAR(3) DEFAULT 'USD',
    "session_duration_minutes" INTEGER DEFAULT 50,
    "spoken_languages" TEXT[],
    "status" VARCHAR(30) DEFAULT 'pending',
    "approved_by" UUID,
    "approved_at" TIMESTAMP(6),
    "preferred_language" VARCHAR(5) DEFAULT 'en',
    "timezone" VARCHAR(50) DEFAULT 'UTC',
    "last_login_at" TIMESTAMP(6),
    "fcm_token" TEXT,
    "device_info" JSONB,
    "created_by" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "therapists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "module" VARCHAR(50),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "user_type" VARCHAR(20) NOT NULL,
    "user_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "revoked_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specialties" (
    "id" UUID NOT NULL,
    "name" JSONB NOT NULL,
    "description" JSONB,
    "icon_url" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "display_order" INTEGER DEFAULT 0,
    "created_by" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapist_specialties" (
    "therapist_id" UUID NOT NULL,
    "specialty_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "therapist_specialties_pkey" PRIMARY KEY ("therapist_id","specialty_id")
);

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" UUID NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "otp_code" VARCHAR(6) NOT NULL,
    "purpose" VARCHAR(20) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "verified_at" TIMESTAMP(6),
    "attempts" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapist_documents" (
    "id" UUID NOT NULL,
    "therapist_id" UUID NOT NULL,
    "document_type" VARCHAR(30),
    "title" VARCHAR(255),
    "file_url" TEXT NOT NULL,
    "file_name" VARCHAR(255),
    "file_size_bytes" BIGINT,
    "mime_type" VARCHAR(100),
    "status" VARCHAR(20) DEFAULT 'pending',
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(6),
    "rejection_reason" TEXT,
    "expires_at" DATE,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "therapist_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaire_categories" (
    "id" UUID NOT NULL,
    "name" JSONB NOT NULL,
    "description" JSONB,
    "display_order" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "questionnaire_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "category_id" UUID,
    "question_text" JSONB NOT NULL,
    "question_type" VARCHAR(30) NOT NULL,
    "is_required" BOOLEAN DEFAULT true,
    "display_order" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "scale_min" INTEGER,
    "scale_max" INTEGER,
    "scale_min_label" JSONB,
    "scale_max_label" JSONB,
    "created_by" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_options" (
    "id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "option_text" JSONB NOT NULL,
    "display_order" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "question_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaire_answers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "answer_text" TEXT,
    "answer_scale" INTEGER,
    "selected_option_ids" UUID[],
    "question_snapshot" JSONB,
    "answered_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questionnaire_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapist_availability" (
    "id" UUID NOT NULL,
    "therapist_id" UUID NOT NULL,
    "day_of_week" VARCHAR(15) NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "therapist_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapist_availability_exceptions" (
    "id" UUID NOT NULL,
    "therapist_id" UUID NOT NULL,
    "exception_date" DATE NOT NULL,
    "is_available" BOOLEAN DEFAULT false,
    "start_time" TIME(6),
    "end_time" TIME(6),
    "reason" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "therapist_availability_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "therapist_id" UUID NOT NULL,
    "session_type" VARCHAR(20) NOT NULL,
    "scheduled_start" TIMESTAMP(6) NOT NULL,
    "scheduled_end" TIMESTAMP(6) NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "is_free_session" BOOLEAN DEFAULT false,
    "amount" DECIMAL(10,2),
    "currency" VARCHAR(3) DEFAULT 'USD',
    "status" VARCHAR(30) DEFAULT 'pending',
    "rescheduled_from_booking_id" UUID,
    "reschedule_reason" TEXT,
    "rescheduled_at" TIMESTAMP(6),
    "cancelled_at" TIMESTAMP(6),
    "cancellation_reason" TEXT,
    "cancelled_by" VARCHAR(20),
    "confirmed_at" TIMESTAMP(6),
    "user_notes" TEXT,
    "therapist_notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "session_type" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) DEFAULT 'scheduled',
    "started_at" TIMESTAMP(6),
    "ended_at" TIMESTAMP(6),
    "actual_duration_minutes" INTEGER,
    "provider" VARCHAR(50),
    "room_id" VARCHAR(255),
    "room_url" TEXT,
    "provider_metadata" JSONB,
    "user_token" TEXT,
    "therapist_token" TEXT,
    "recording_url" TEXT,
    "recording_duration_seconds" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "therapist_id" UUID NOT NULL,
    "session_id" UUID,
    "last_message_at" TIMESTAMP(6),
    "user_last_read_at" TIMESTAMP(6),
    "therapist_last_read_at" TIMESTAMP(6),
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_type" VARCHAR(20) NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "message_type" VARCHAR(20) DEFAULT 'text',
    "is_read" BOOLEAN DEFAULT false,
    "read_at" TIMESTAMP(6),
    "deleted_at" TIMESTAMP(6),
    "deleted_by" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "therapist_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "started_at" TIMESTAMP(6) NOT NULL,
    "renews_at" TIMESTAMP(6),
    "cancelled_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "booking_id" UUID,
    "user_id" UUID NOT NULL,
    "subscription_id" UUID,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) DEFAULT 'USD',
    "furatpay_invoice_id" VARCHAR(255),
    "furatpay_pay_link" TEXT,
    "status" VARCHAR(20) DEFAULT 'pending',
    "paid_at" TIMESTAMP(6),
    "expires_at" TIMESTAMP(6),
    "refunded_at" TIMESTAMP(6),
    "refund_amount" DECIMAL(10,2),
    "refund_reason" TEXT,
    "webhook_payload" JSONB,
    "webhook_received_at" TIMESTAMP(6),
    "payment_method" VARCHAR(50),
    "transaction_id" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapist_payouts" (
    "id" UUID NOT NULL,
    "therapist_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "paid_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "therapist_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "recipient_type" VARCHAR(20) NOT NULL,
    "recipient_id" UUID NOT NULL,
    "template_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "channel" VARCHAR(20) DEFAULT 'push',
    "status" VARCHAR(20) DEFAULT 'pending',
    "is_read" BOOLEAN DEFAULT false,
    "read_at" TIMESTAMP(6),
    "sent_at" TIMESTAMP(6),
    "delivered_at" TIMESTAMP(6),
    "failed_at" TIMESTAMP(6),
    "failure_reason" TEXT,
    "related_entity_type" VARCHAR(50),
    "related_entity_id" UUID,
    "data" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "title_template" JSONB NOT NULL,
    "body_template" JSONB NOT NULL,
    "channel" VARCHAR(20) DEFAULT 'push',
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_type" VARCHAR(20) NOT NULL,
    "actor_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_logs" (
    "id" UUID NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "event_type" VARCHAR(100),
    "headers" JSONB,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN DEFAULT false,
    "processed_at" TIMESTAMP(6),
    "processing_error" TEXT,
    "response_status" INTEGER,
    "response_body" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "therapists_email_key" ON "therapists"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_name_key" ON "notification_templates"("name");
