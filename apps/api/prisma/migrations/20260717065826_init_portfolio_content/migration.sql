-- CreateEnum
CREATE TYPE "contact_message_status" AS ENUM ('new', 'read', 'archived');

-- CreateEnum
CREATE TYPE "contact_email_outbox_status" AS ENUM ('queued', 'processing', 'delivered', 'failed');

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "singletonKey" TEXT NOT NULL DEFAULT 'default',
    "name" VARCHAR(120) NOT NULL,
    "biography" VARCHAR(2000) NOT NULL,
    "avatarUrl" VARCHAR(2048),
    "contactEmail" VARCHAR(320) NOT NULL,
    "phoneNumber" VARCHAR(32),
    "resumeUrl" VARCHAR(2048),
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "iconUrl" VARCHAR(2048),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "company" VARCHAR(120) NOT NULL,
    "role" VARCHAR(120) NOT NULL,
    "location" VARCHAR(120),
    "startMonth" VARCHAR(7) NOT NULL,
    "endMonth" VARCHAR(7),
    "current" BOOLEAN NOT NULL DEFAULT false,
    "description" VARCHAR(5000) NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Education" (
    "id" TEXT NOT NULL,
    "institution" VARCHAR(160) NOT NULL,
    "degree" VARCHAR(160) NOT NULL,
    "location" VARCHAR(120),
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER,
    "current" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "issuingOrganization" VARCHAR(160) NOT NULL,
    "issueYear" INTEGER NOT NULL,
    "credentialUrl" VARCHAR(2048),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(5000) NOT NULL,
    "iconUrl" VARCHAR(2048),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "description" VARCHAR(5000) NOT NULL,
    "imageUrl" VARCHAR(2048),
    "projectUrl" VARCHAR(2048),
    "repositoryUrl" VARCHAR(2048),
    "startMonth" VARCHAR(7),
    "endMonth" VARCHAR(7),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSkill" (
    "projectId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,

    CONSTRAINT "ProjectSkill_pkey" PRIMARY KEY ("projectId","skillId")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "idempotencyKey" VARCHAR(255) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "message" VARCHAR(5000) NOT NULL,
    "status" "contact_message_status" NOT NULL DEFAULT 'new',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactEmailOutbox" (
    "id" TEXT NOT NULL,
    "contactMessageId" TEXT NOT NULL,
    "deduplicationKey" VARCHAR(255) NOT NULL,
    "status" "contact_email_outbox_status" NOT NULL DEFAULT 'queued',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseUntil" TIMESTAMP(3),
    "lastError" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactEmailOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_singletonKey_key" ON "Profile"("singletonKey");

-- CreateIndex
CREATE INDEX "Profile_published_idx" ON "Profile"("published");

-- CreateIndex
CREATE INDEX "Skill_published_displayOrder_createdAt_idx" ON "Skill"("published", "displayOrder", "createdAt");

-- CreateIndex
CREATE INDEX "Experience_published_displayOrder_createdAt_idx" ON "Experience"("published", "displayOrder", "createdAt");

-- CreateIndex
CREATE INDEX "Education_published_displayOrder_createdAt_idx" ON "Education"("published", "displayOrder", "createdAt");

-- CreateIndex
CREATE INDEX "Certification_published_displayOrder_createdAt_idx" ON "Certification"("published", "displayOrder", "createdAt");

-- CreateIndex
CREATE INDEX "Service_published_displayOrder_createdAt_idx" ON "Service"("published", "displayOrder", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE INDEX "Project_published_displayOrder_createdAt_idx" ON "Project"("published", "displayOrder", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectSkill_skillId_idx" ON "ProjectSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactMessage_idempotencyKey_key" ON "ContactMessage"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ContactMessage_status_submittedAt_idx" ON "ContactMessage"("status", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContactEmailOutbox_contactMessageId_key" ON "ContactEmailOutbox"("contactMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactEmailOutbox_deduplicationKey_key" ON "ContactEmailOutbox"("deduplicationKey");

-- CreateIndex
CREATE INDEX "ContactEmailOutbox_status_availableAt_idx" ON "ContactEmailOutbox"("status", "availableAt");

-- AddForeignKey
ALTER TABLE "ProjectSkill" ADD CONSTRAINT "ProjectSkill_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSkill" ADD CONSTRAINT "ProjectSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactEmailOutbox" ADD CONSTRAINT "ContactEmailOutbox_contactMessageId_fkey" FOREIGN KEY ("contactMessageId") REFERENCES "ContactMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
