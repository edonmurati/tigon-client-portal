-- DropForeignKey
ALTER TABLE "Credential" DROP CONSTRAINT "Credential_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Credential" DROP CONSTRAINT "Credential_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Server" DROP CONSTRAINT "Server_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Server" DROP CONSTRAINT "Server_projectId_fkey";

-- CreateIndex
CREATE INDEX "Activity_workspaceId_occurredAt_idx" ON "Activity"("workspaceId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "Activity_workspaceId_clientId_occurredAt_idx" ON "Activity"("workspaceId", "clientId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "Activity_workspaceId_projectId_occurredAt_idx" ON "Activity"("workspaceId", "projectId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "Invoice_workspaceId_status_deletedAt_idx" ON "Invoice"("workspaceId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Invoice_workspaceId_issuedAt_idx" ON "Invoice"("workspaceId", "issuedAt" DESC);

-- CreateIndex
CREATE INDEX "KnowledgeEntry_workspaceId_pinned_deletedAt_idx" ON "KnowledgeEntry"("workspaceId", "pinned", "deletedAt");

-- CreateIndex
CREATE INDEX "KnowledgeEntry_workspaceId_category_deletedAt_idx" ON "KnowledgeEntry"("workspaceId", "category", "deletedAt");

-- CreateIndex
CREATE INDEX "Lead_workspaceId_status_deletedAt_idx" ON "Lead"("workspaceId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Task_projectId_status_deletedAt_idx" ON "Task"("projectId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Task_clientId_status_deletedAt_idx" ON "Task"("clientId", "status", "deletedAt");

-- DropIndex
DROP INDEX IF EXISTS "User_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "User_workspaceId_email_key" ON "User"("workspaceId", "email");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Server" ADD CONSTRAINT "Server_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Server" ADD CONSTRAINT "Server_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

