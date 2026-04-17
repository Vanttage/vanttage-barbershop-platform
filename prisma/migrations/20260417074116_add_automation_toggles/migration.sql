-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "autoConfirmacion" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoReactivacion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoReminder1h" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoReminder24h" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoReviewRequest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoWeeklyReport" BOOLEAN NOT NULL DEFAULT true;
