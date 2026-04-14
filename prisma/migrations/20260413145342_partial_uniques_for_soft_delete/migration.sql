-- Partial unique indexes for soft-delete semantics.
-- Replaces full unique constraints so that soft-deleted rows (deletedAt IS NOT NULL)
-- do not block re-use of the same slug / email / invoiceNumber.
-- Index names keep the Prisma "_key" suffix so `migrate diff` sees them as satisfying @@unique.

-- Client.workspaceId + slug
DROP INDEX IF EXISTS "Client_workspaceId_slug_key";
CREATE UNIQUE INDEX "Client_workspaceId_slug_key"
  ON "Client" ("workspaceId", "slug")
  WHERE "deletedAt" IS NULL;

-- Project.workspaceId + slug
DROP INDEX IF EXISTS "Project_workspaceId_slug_key";
CREATE UNIQUE INDEX "Project_workspaceId_slug_key"
  ON "Project" ("workspaceId", "slug")
  WHERE "deletedAt" IS NULL;

-- Invoice.workspaceId + invoiceNumber
DROP INDEX IF EXISTS "Invoice_workspaceId_invoiceNumber_key";
CREATE UNIQUE INDEX "Invoice_workspaceId_invoiceNumber_key"
  ON "Invoice" ("workspaceId", "invoiceNumber")
  WHERE "deletedAt" IS NULL;

-- User.email (global unique, but soft-deleted users should free the email)
DROP INDEX IF EXISTS "User_email_key";
CREATE UNIQUE INDEX "User_email_key"
  ON "User" ("email")
  WHERE "deletedAt" IS NULL;
