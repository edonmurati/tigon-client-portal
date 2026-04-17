import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const workspace = await prisma.workspace.upsert({
    where: { slug: "tigon" },
    update: {},
    create: { name: "Tigon", slug: "tigon" },
  });

  const passwordHash = await hash("admin123", 12);

  const edon = await prisma.user.upsert({
    where: { workspaceId_email: { workspaceId: workspace.id, email: "edon.muratovic@tigonautomation.de" } },
    update: { passwordHash, role: "ADMIN" },
    create: {
      email: "edon.muratovic@tigonautomation.de",
      passwordHash,
      name: "Edon Muratovic",
      role: "ADMIN",
      workspaceId: workspace.id,
    },
  });

  const gent = await prisma.user.upsert({
    where: { workspaceId_email: { workspaceId: workspace.id, email: "gent.cungu@tigonautomation.de" } },
    update: { passwordHash, role: "ADMIN" },
    create: {
      email: "gent.cungu@tigonautomation.de",
      passwordHash,
      name: "Gent Cungu",
      role: "ADMIN",
      workspaceId: workspace.id,
    },
  });

  console.log(`Workspace: ${workspace.name} (${workspace.id})`);
  console.log(`Admin: ${edon.email} / admin123`);
  console.log(`Admin: ${gent.email} / admin123`);
}

main().finally(() => prisma.$disconnect());
