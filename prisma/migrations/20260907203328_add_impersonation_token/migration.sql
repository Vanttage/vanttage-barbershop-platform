-- AlterTable
ALTER TABLE "users" ADD COLUMN     "impersonationToken" TEXT,
ADD COLUMN     "impersonationTokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_impersonationToken_key" ON "users"("impersonationToken");

