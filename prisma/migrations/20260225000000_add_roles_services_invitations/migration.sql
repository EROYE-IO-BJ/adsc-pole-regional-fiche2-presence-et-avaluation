-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PARTICIPANT', 'INTERVENANT', 'RESPONSABLE_SERVICE', 'ADMIN');

-- AlterTable: Add role to User
ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'PARTICIPANT';

-- Migrate existing users to ADMIN role
UPDATE "User" SET "role" = 'ADMIN', "emailVerified" = NOW() WHERE "emailVerified" IS NULL;

-- AlterTable: Make User.password nullable
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- AlterTable: Make User.serviceId nullable
ALTER TABLE "User" ALTER COLUMN "serviceId" DROP NOT NULL;

-- Drop the foreign key constraint on User.serviceId to recreate as optional
ALTER TABLE "User" DROP CONSTRAINT "User_serviceId_fkey";
ALTER TABLE "User" ADD CONSTRAINT "User_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Add slug and description to Service, make name unique
ALTER TABLE "Service" ADD COLUMN "slug" TEXT;
ALTER TABLE "Service" ADD COLUMN "description" TEXT;

-- Migrate ServiceType to slug
UPDATE "Service" SET "slug" = CASE
  WHEN "type" = 'IMA_LINGUA' THEN 'ima-lingua'
  WHEN "type" = 'CAREER_CENTER' THEN 'career-center'
  WHEN "type" = 'RECRUTEMENT_MOBILITE' THEN 'recrutement-mobilite'
  ELSE LOWER(REPLACE("type"::TEXT, '_', '-'))
END;

-- Make slug NOT NULL and UNIQUE after migration
ALTER TABLE "Service" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Service_slug_key" ON "Service"("slug");

-- Make name unique
CREATE UNIQUE INDEX "Service_name_key" ON "Service"("name");

-- Drop type column and enum
ALTER TABLE "Service" DROP COLUMN "type";
DROP INDEX IF EXISTS "Service_type_key";
DROP TYPE "ServiceType";

-- AlterTable: Add new fields to Activity
ALTER TABLE "Activity" ADD COLUMN "requiresRegistration" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Activity" ADD COLUMN "intervenantId" TEXT;

-- Add foreign key for intervenantId
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_intervenantId_fkey" FOREIGN KEY ("intervenantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Rename the existing User-Activity relation to ActivityCreator
-- (Prisma handles this via relation names, but the FK constraint name may need updating)
-- The existing constraint name is based on the old schema
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_createdById_fkey";
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: Registration
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Registration_userId_activityId_key" ON "Registration"("userId", "activityId");

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: Invitation
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "serviceId" TEXT,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_token_key" ON "Invitation"("token");
CREATE UNIQUE INDEX "Invitation_receiverId_key" ON "Invitation"("receiverId");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
