-- AlterTable
ALTER TABLE "Project" ADD COLUMN "telegramChatId" TEXT;
ALTER TABLE "Project" ADD COLUMN "telegramLinkToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Project_telegramLinkToken_key" ON "Project"("telegramLinkToken");
