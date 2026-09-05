-- AlterEnum
ALTER TYPE "NotificationChannel" ADD VALUE 'telegram';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'appointment_rescheduled';
ALTER TYPE "NotificationType" ADD VALUE 'appointment_completed';

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "telegramChatId" TEXT,
ADD COLUMN     "telegramLinkToken" TEXT,
ADD COLUMN     "telegramLinkTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "telegramLinkedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "telegramEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "clients_telegramChatId_key" ON "clients"("telegramChatId");

-- CreateIndex
CREATE UNIQUE INDEX "clients_telegramLinkToken_key" ON "clients"("telegramLinkToken");

