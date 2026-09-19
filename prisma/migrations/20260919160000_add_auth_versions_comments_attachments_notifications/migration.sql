-- DEV-004 — Cierre funcional del Gestor de Ofertas.
--
-- Migración **acumulativa y no destructiva**: solo añade columnas nullable,
-- tablas y tipos nuevos. No borra, renumera ni reinicia ninguna oferta,
-- contador, auditoría ni histórico existente, de modo que se puede aplicar
-- tal cual sobre una base que ya contiene datos de DEV-003 y también sobre
-- una base nueva.
--
-- Notas de revisión:
--   * `clients.code` se añade nullable a propósito: los clientes de DEV-003 no
--     tienen código y no se les inventa ninguno. La obligatoriedad es
--     funcional (alta y edición), no de columna. El índice único de PostgreSQL
--     ignora los NULL, así que varios clientes «Código pendiente» conviven.
--   * `offers.created_by_id`, `archived_by_id` y `restored_by_id` son nullable:
--     las ofertas anteriores al login no tienen actor conocido.
--   * Todas las claves foráneas hacia `users` son `ON DELETE SET NULL` y las
--     que apuntan a histórico funcional son `RESTRICT`: ninguna cascada puede
--     borrar versiones, comentarios, adjuntos ni auditoría.

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "NotificationTrigger" AS ENUM ('OFFER_CREATED', 'OFFER_STATUS_CHANGED', 'OFFER_COMMENT_ADDED', 'OFFER_ATTACHMENT_ADDED', 'OFFER_PENDING_PM_REVIEW', 'OFFER_PENDING_SALES_REVIEW');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('INTERNAL', 'INTERNAL_AND_EMAIL');

-- CreateEnum
CREATE TYPE "NotificationConditionField" AS ENUM ('STATUS', 'PROJECT_MANAGER', 'COMMERCIAL', 'CREATOR', 'CLIENT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NotificationConditionOperator" AS ENUM ('IS', 'IS_NOT');

-- CreateEnum
CREATE TYPE "NotificationConditionGroup" AS ENUM ('ALL', 'ANY');

-- CreateEnum
CREATE TYPE "NotificationRecipientKind" AS ENUM ('PROJECT_MANAGER', 'COMMERCIAL', 'CREATOR', 'ALL_ADMINS', 'SPECIFIC_PERSON');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "code" TEXT;

-- AlterTable
ALTER TABLE "offers" ADD COLUMN     "archived_by_id" TEXT,
ADD COLUMN     "created_by_id" TEXT,
ADD COLUMN     "restored_at" TIMESTAMP(3),
ADD COLUMN     "restored_by_id" TEXT;

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,
    "person_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_versions" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author_id" TEXT,
    "snapshot" JSONB NOT NULL,

    CONSTRAINT "offer_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_comments" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "author_id" TEXT,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offer_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_attachments" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "uploaded_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removed_at" TIMESTAMP(3),
    "removed_by_id" TEXT,

    CONSTRAINT "offer_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_rules" (
    "id" TEXT NOT NULL,
    "key" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "trigger" "NotificationTrigger" NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'INTERNAL',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_rule_conditions" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "group" "NotificationConditionGroup" NOT NULL,
    "field" "NotificationConditionField" NOT NULL,
    "operator" "NotificationConditionOperator" NOT NULL,
    "status_id" TEXT,
    "person_id" TEXT,
    "client_id" TEXT,
    "boolean_value" BOOLEAN,

    CONSTRAINT "notification_rule_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_rule_actions" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "kind" "NotificationRecipientKind" NOT NULL,
    "person_id" TEXT,

    CONSTRAINT "notification_rule_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "offer_id" TEXT,
    "rule_id" TEXT,
    "trigger" "NotificationTrigger" NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'INTERNAL',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "actor_id" TEXT,
    "dedupe_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_person_id_key" ON "users"("person_id");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE INDEX "offer_versions_offer_id_created_at_idx" ON "offer_versions"("offer_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "offer_versions_offer_id_version_key" ON "offer_versions"("offer_id", "version");

-- CreateIndex
CREATE INDEX "offer_comments_offer_id_created_at_idx" ON "offer_comments"("offer_id", "created_at");

-- CreateIndex
CREATE INDEX "offer_comments_author_id_idx" ON "offer_comments"("author_id");

-- CreateIndex
CREATE UNIQUE INDEX "offer_attachments_storage_key_key" ON "offer_attachments"("storage_key");

-- CreateIndex
CREATE INDEX "offer_attachments_offer_id_created_at_idx" ON "offer_attachments"("offer_id", "created_at");

-- CreateIndex
CREATE INDEX "offer_attachments_removed_at_idx" ON "offer_attachments"("removed_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_rules_key_key" ON "notification_rules"("key");

-- CreateIndex
CREATE INDEX "notification_rules_trigger_is_active_idx" ON "notification_rules"("trigger", "is_active");

-- CreateIndex
CREATE INDEX "notification_rule_conditions_rule_id_idx" ON "notification_rule_conditions"("rule_id");

-- CreateIndex
CREATE INDEX "notification_rule_conditions_status_id_idx" ON "notification_rule_conditions"("status_id");

-- CreateIndex
CREATE INDEX "notification_rule_conditions_person_id_idx" ON "notification_rule_conditions"("person_id");

-- CreateIndex
CREATE INDEX "notification_rule_conditions_client_id_idx" ON "notification_rule_conditions"("client_id");

-- CreateIndex
CREATE INDEX "notification_rule_actions_rule_id_idx" ON "notification_rule_actions"("rule_id");

-- CreateIndex
CREATE INDEX "notification_rule_actions_person_id_idx" ON "notification_rule_actions"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_dedupe_key_key" ON "notifications"("dedupe_key");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_created_at_idx" ON "notifications"("user_id", "read_at", "created_at");

-- CreateIndex
CREATE INDEX "notifications_offer_id_idx" ON "notifications"("offer_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "audit_logs"("actor_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_code_key" ON "clients"("code");

-- CreateIndex
CREATE INDEX "offer_status_history_actor_id_idx" ON "offer_status_history"("actor_id");

-- CreateIndex
CREATE INDEX "offers_created_by_id_idx" ON "offers"("created_by_id");

-- CreateIndex
CREATE INDEX "offers_status_id_deleted_at_idx" ON "offers"("status_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_archived_by_id_fkey" FOREIGN KEY ("archived_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_restored_by_id_fkey" FOREIGN KEY ("restored_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_status_history" ADD CONSTRAINT "offer_status_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_versions" ADD CONSTRAINT "offer_versions_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_versions" ADD CONSTRAINT "offer_versions_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_comments" ADD CONSTRAINT "offer_comments_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_comments" ADD CONSTRAINT "offer_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_attachments" ADD CONSTRAINT "offer_attachments_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_attachments" ADD CONSTRAINT "offer_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_attachments" ADD CONSTRAINT "offer_attachments_removed_by_id_fkey" FOREIGN KEY ("removed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_rule_conditions" ADD CONSTRAINT "notification_rule_conditions_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "notification_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_rule_conditions" ADD CONSTRAINT "notification_rule_conditions_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "offer_statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_rule_conditions" ADD CONSTRAINT "notification_rule_conditions_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_rule_conditions" ADD CONSTRAINT "notification_rule_conditions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_rule_actions" ADD CONSTRAINT "notification_rule_actions_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "notification_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_rule_actions" ADD CONSTRAINT "notification_rule_actions_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "notification_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

