import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { writeFileSync } from "node:fs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

(async () => {
  const client = await prisma.client.findFirst({
    where: { slug: "vasko" },
    include: {
      users: true,
      projects: {
        include: {
          milestones: true,
          tasks: true,
          impulses: { include: { comments: true } },
          journals: true,
          entries: true,
          decisions: true,
          credentials: true,
          documents: true,
          servers: true,
          deployments: true,
          activities: true,
          invoices: { include: { lineItems: true } },
          expenses: true,
          estimates: true,
        },
      },
      contacts: true,
      credentials: true,
      documents: true,
      servers: true,
      tasks: true,
      activities: true,
      invoices: { include: { lineItems: true } },
      payments: true,
      expenses: true,
      estimates: true,
      entries: true,
    },
  });

  if (!client) {
    console.log("vasko not found");
    await prisma.$disconnect();
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const path = `/home/habit/tigon/kunden/pro-bono/vasko/portal-snapshot-${today}.json`;
  writeFileSync(path, JSON.stringify(client, null, 2));
  console.log(`Archived to ${path}`);

  const projectIds = client.projects.map((p) => p.id);
  const invoiceIds = [
    ...client.invoices.map((i) => i.id),
    ...client.projects.flatMap((p) => p.invoices.map((i) => i.id)),
  ];

  await prisma.$transaction(async (tx) => {
    // Project-scoped children that are NOT cascade-deleted
    if (projectIds.length > 0) {
      await tx.impulseComment.deleteMany({
        where: { impulse: { projectId: { in: projectIds } } },
      });
      await tx.impulse.deleteMany({ where: { projectId: { in: projectIds } } });
      await tx.milestone.deleteMany({ where: { projectId: { in: projectIds } } });
      await tx.journal.deleteMany({ where: { projectId: { in: projectIds } } });
      await tx.decision.deleteMany({ where: { projectId: { in: projectIds } } });
      await tx.deployment.deleteMany({ where: { projectId: { in: projectIds } } });
    }

    // Invoice line items (Cascade expected but be explicit)
    if (invoiceIds.length > 0) {
      await tx.invoiceLineItem.deleteMany({
        where: { invoiceId: { in: invoiceIds } },
      });
    }

    // Client-scoped children with SetNull or Cascade — explicit delete
    await tx.payment.deleteMany({ where: { clientId: client.id } });
    await tx.invoice.deleteMany({ where: { clientId: client.id } });
    await tx.expense.deleteMany({ where: { clientId: client.id } });
    await tx.pipelineEstimate.deleteMany({ where: { clientId: client.id } });
    await tx.knowledgeEntry.deleteMany({ where: { clientId: client.id } });
    await tx.activity.deleteMany({ where: { clientId: client.id } });
    await tx.document.deleteMany({ where: { clientId: client.id } });
    await tx.credential.deleteMany({ where: { clientId: client.id } });
    await tx.server.deleteMany({ where: { clientId: client.id } });

    // Now projects (SetNull on client — safe to delete projects; their own Cascade rels handle the rest)
    if (projectIds.length > 0) {
      await tx.project.deleteMany({ where: { id: { in: projectIds } } });
    }

    // Contacts (Cascade) + Users (no explicit cascade, need manual)
    await tx.user.deleteMany({ where: { clientId: client.id } });

    // Finally the client (ContactPerson + Task cascade automatically)
    await tx.client.delete({ where: { id: client.id } });
  });

  console.log(
    `Deleted ${client.name}: ${projectIds.length} project(s), ${client.contacts.length} contact(s), ${client.users.length} user(s), ${invoiceIds.length} invoice(s)`,
  );
  await prisma.$disconnect();
})();
