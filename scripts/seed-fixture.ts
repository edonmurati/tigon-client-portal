import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const workspace = await prisma.workspace.findFirstOrThrow({ where: { slug: "tigon" } });
  const passwordHash = await hash("admin123", 12);

  const edon = await prisma.user.upsert({
    where: { workspaceId_email: { workspaceId: workspace.id, email: "edon@tigonautomation.de" } },
    update: { passwordHash, role: "ADMIN" },
    create: {
      email: "edon@tigonautomation.de",
      passwordHash,
      name: "Edon Muratovic",
      role: "ADMIN",
      workspaceId: workspace.id,
    },
  });

  const client = await prisma.client.upsert({
    where: { workspaceId_slug: { workspaceId: workspace.id, slug: "demo-kunde" } },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: "Demo Kunde",
      slug: "demo-kunde",
      stage: "ACTIVE",
    },
  });

  let project = await prisma.project.findFirst({
    where: { workspaceId: workspace.id, clientId: client.id, name: "Demo Projekt" },
  });
  if (!project) {
    project = await prisma.project.create({
      data: {
        workspaceId: workspace.id,
        clientId: client.id,
        name: "Demo Projekt",
        slug: "demo-projekt",
        status: "ACTIVE",
      },
    });
  }

  let task = await prisma.task.findFirst({
    where: { projectId: project.id, title: "Multi-Assign Testaufgabe" },
  });
  if (!task) {
    task = await prisma.task.create({
      data: {
        projectId: project.id,
        clientId: client.id,
        title: "Multi-Assign Testaufgabe",
        description: "Zum Testen der Chip-basierten Mehrfach-Zuweisung.",
        priority: "NORMAL",
      },
    });
  }

  console.log(`Admin: ${edon.email} / admin123`);
  console.log(`Client: ${client.name} (${client.id})`);
  console.log(`Project: ${project.name} (${project.id})`);
  console.log(`Task: ${task.title} (${task.id})`);
  console.log(`→ http://habit:3001/admin/aufgaben/${task.id}`);
}

main().finally(() => prisma.$disconnect());
