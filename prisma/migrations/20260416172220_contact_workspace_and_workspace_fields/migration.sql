/*
  Warnings:

  - Added the required column `workspaceId` to the `ContactPerson` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ContactPerson" ADD COLUMN     "workspaceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "branche" TEXT,
ADD COLUMN     "budget" TEXT,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "problem" TEXT,
ADD COLUMN     "projekttypen" TEXT[],
ADD COLUMN     "rawPayload" JSONB,
ADD COLUMN     "servicebedarf" TEXT,
ADD COLUMN     "telefon" TEXT,
ADD COLUMN     "userAgent" TEXT,
ADD COLUMN     "zeitrahmen" TEXT;

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "burnRateCents" INTEGER,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "mrrCents" INTEGER,
ADD COLUMN     "objective" TEXT,
ADD COLUMN     "techStack" TEXT[];

-- CreateIndex
CREATE INDEX "ContactPerson_workspaceId_idx" ON "ContactPerson"("workspaceId");

-- AddForeignKey
ALTER TABLE "ContactPerson" ADD CONSTRAINT "ContactPerson_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
