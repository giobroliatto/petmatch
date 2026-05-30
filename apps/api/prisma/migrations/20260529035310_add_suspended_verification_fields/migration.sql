-- AlterTable
ALTER TABLE "ProviderProfile" ADD COLUMN     "verificationDocumentUrl" TEXT,
ADD COLUMN     "verificationSubmittedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "suspended" BOOLEAN NOT NULL DEFAULT false;
