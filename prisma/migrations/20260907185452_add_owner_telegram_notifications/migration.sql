-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'new_booking_alert';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "telegramChatId" TEXT,
ADD COLUMN     "telegramLinkToken" TEXT,
ADD COLUMN     "telegramLinkTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegramChatId_key" ON "users"("telegramChatId");

-- CreateIndex
CREATE UNIQUE INDEX "users_telegramLinkToken_key" ON "users"("telegramLinkToken");

