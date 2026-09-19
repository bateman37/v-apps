-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_normalized" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "people" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "can_be_commercial" BOOLEAN NOT NULL DEFAULT false,
    "can_be_project_manager" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "priority_id" TEXT NOT NULL,
    "commercial_id" TEXT NOT NULL,
    "offer_date" DATE NOT NULL,
    "origin_id" TEXT NOT NULL,
    "project_manager_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "offer_type_id" TEXT NOT NULL,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "status_id" TEXT NOT NULL,
    "requester_name" TEXT NOT NULL,
    "implantation_text" TEXT,
    "estimated_commercial_delivery_date" DATE,
    "estimated_client_delivery_date" DATE,
    "commercial_days" DECIMAL(8,2),
    "estimated_portfolio_date" DATE,
    "segmentation_id" TEXT,
    "notes" TEXT,
    "language_id" TEXT,
    "navision_order" TEXT,
    "cancellation_reason_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_profile_days" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "professional_profile_id" TEXT NOT NULL,
    "days" DECIMAL(8,2) NOT NULL,

    CONSTRAINT "offer_profile_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_status_history" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "previous_status_id" TEXT,
    "new_status_id" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_id" TEXT,

    CONSTRAINT "offer_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_counters" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_counters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "actor_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_name_normalized_key" ON "clients"("name_normalized");

-- CreateIndex
CREATE INDEX "clients_is_active_name_idx" ON "clients"("is_active", "name");

-- CreateIndex
CREATE INDEX "people_is_active_name_idx" ON "people"("is_active", "name");

-- CreateIndex
CREATE UNIQUE INDEX "offers_number_key" ON "offers"("number");

-- CreateIndex
CREATE INDEX "offers_deleted_at_offer_date_idx" ON "offers"("deleted_at", "offer_date");

-- CreateIndex
CREATE INDEX "offers_client_id_idx" ON "offers"("client_id");

-- CreateIndex
CREATE INDEX "offers_commercial_id_idx" ON "offers"("commercial_id");

-- CreateIndex
CREATE INDEX "offers_project_manager_id_idx" ON "offers"("project_manager_id");

-- CreateIndex
CREATE INDEX "offers_status_id_idx" ON "offers"("status_id");

-- CreateIndex
CREATE INDEX "offers_offer_type_id_idx" ON "offers"("offer_type_id");

-- CreateIndex
CREATE INDEX "offers_origin_id_idx" ON "offers"("origin_id");

-- CreateIndex
CREATE INDEX "offers_priority_id_idx" ON "offers"("priority_id");

-- CreateIndex
CREATE INDEX "offers_segmentation_id_idx" ON "offers"("segmentation_id");

-- CreateIndex
CREATE INDEX "offers_language_id_idx" ON "offers"("language_id");

-- CreateIndex
CREATE INDEX "offers_cancellation_reason_id_idx" ON "offers"("cancellation_reason_id");

-- CreateIndex
CREATE INDEX "offer_profile_days_professional_profile_id_idx" ON "offer_profile_days"("professional_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "offer_profile_days_offer_id_professional_profile_id_key" ON "offer_profile_days"("offer_id", "professional_profile_id");

-- CreateIndex
CREATE INDEX "offer_status_history_offer_id_changed_at_idx" ON "offer_status_history"("offer_id", "changed_at");

-- CreateIndex
CREATE INDEX "offer_status_history_previous_status_id_idx" ON "offer_status_history"("previous_status_id");

-- CreateIndex
CREATE INDEX "offer_status_history_new_status_id_idx" ON "offer_status_history"("new_status_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_counters_key_key" ON "system_counters"("key");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_created_at_idx" ON "audit_logs"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_priority_id_fkey" FOREIGN KEY ("priority_id") REFERENCES "priorities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_commercial_id_fkey" FOREIGN KEY ("commercial_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_project_manager_id_fkey" FOREIGN KEY ("project_manager_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_origin_id_fkey" FOREIGN KEY ("origin_id") REFERENCES "origins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_offer_type_id_fkey" FOREIGN KEY ("offer_type_id") REFERENCES "offer_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "offer_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_segmentation_id_fkey" FOREIGN KEY ("segmentation_id") REFERENCES "segmentations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_language_id_fkey" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_cancellation_reason_id_fkey" FOREIGN KEY ("cancellation_reason_id") REFERENCES "cancellation_reasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_profile_days" ADD CONSTRAINT "offer_profile_days_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_profile_days" ADD CONSTRAINT "offer_profile_days_professional_profile_id_fkey" FOREIGN KEY ("professional_profile_id") REFERENCES "professional_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_status_history" ADD CONSTRAINT "offer_status_history_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_status_history" ADD CONSTRAINT "offer_status_history_previous_status_id_fkey" FOREIGN KEY ("previous_status_id") REFERENCES "offer_statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_status_history" ADD CONSTRAINT "offer_status_history_new_status_id_fkey" FOREIGN KEY ("new_status_id") REFERENCES "offer_statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
