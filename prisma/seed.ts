import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // ─── Admins ───────────────────────────────────────────────────────────────

  const adminPassword = await hash("admin123", 12);

  const edon = await prisma.user.upsert({
    where: { email: "edon@tigonautomation.de" },
    update: {},
    create: {
      email: "edon@tigonautomation.de",
      passwordHash: adminPassword,
      name: "Edon Muratovic",
      role: "ADMIN",
    },
  });

  const gent = await prisma.user.upsert({
    where: { email: "gent@tigonautomation.de" },
    update: {},
    create: {
      email: "gent@tigonautomation.de",
      passwordHash: adminPassword,
      name: "Gent Cungu",
      role: "ADMIN",
    },
  });

  console.log(`  Admin: ${edon.name} (${edon.email})`);
  console.log(`  Admin: ${gent.name} (${gent.email})`);

  // ─── Client: Fachwelt Verlag ───────────────────────────────────────────────

  const clientPassword = await hash("client123", 12);

  const fachwelt = await prisma.client.upsert({
    where: { slug: "fachwelt" },
    update: {},
    create: {
      name: "Fachwelt Verlag",
      slug: "fachwelt",
      status: "ACTIVE",
      partnershipScope:
        "B2B Marktplatz-Entwicklung, Redaktionsassistent, WebMag-Integration",
    },
  });

  const alija = await prisma.user.upsert({
    where: { email: "ap@fachwelt-verlag.de" },
    update: {},
    create: {
      email: "ap@fachwelt-verlag.de",
      passwordHash: clientPassword,
      name: "Alija Palevic",
      role: "CLIENT",
      clientId: fachwelt.id,
    },
  });

  console.log(
    `  Client: ${fachwelt.name} — User: ${alija.name} (${alija.email})`
  );

  const fachweltProject = await prisma.project.upsert({
    where: { id: "proj_fachwelt_marketplace" },
    update: {},
    create: {
      id: "proj_fachwelt_marketplace",
      clientId: fachwelt.id,
      name: "Fachwelt Marketplace",
      description:
        "B2B Industrie-Marktplatz für Fachwelt Verlag — Phase 1: MVP, Phase 2: AI-Features",
      status: "ACTIVE",
      startDate: new Date("2025-11-01"),
    },
  });

  // Project Areas
  const [areaMarketplace, , ] = await Promise.all([
    prisma.projectArea.create({
      data: {
        projectId: fachweltProject.id,
        name: "Marketplace",
        sortOrder: 0,
      },
    }),
    prisma.projectArea.create({
      data: {
        projectId: fachweltProject.id,
        name: "Redaktionsassistent",
        sortOrder: 1,
      },
    }),
    prisma.projectArea.create({
      data: {
        projectId: fachweltProject.id,
        name: "WebMag Integration",
        sortOrder: 2,
      },
    }),
  ]);

  // Milestones
  await Promise.all([
    prisma.milestone.create({
      data: {
        projectId: fachweltProject.id,
        title: "MVP Deployed",
        description: "Erster lauffähiger Prototyp auf Staging deployed",
        completedAt: new Date("2025-12-15"),
        sortOrder: 0,
      },
    }),
    prisma.milestone.create({
      data: {
        projectId: fachweltProject.id,
        title: "Client Feedback Round",
        description: "Erstes strukturiertes Feedback vom Kunden einholen",
        dueDate: new Date("2026-05-01"),
        sortOrder: 1,
      },
    }),
    prisma.milestone.create({
      data: {
        projectId: fachweltProject.id,
        title: "Production Launch",
        description: "Go-Live auf fachwelt-verlag.de",
        dueDate: new Date("2026-07-01"),
        sortOrder: 2,
      },
    }),
  ]);

  // Sample impulse
  await prisma.impulse.create({
    data: {
      projectId: fachweltProject.id,
      projectAreaId: areaMarketplace.id,
      authorId: alija.id,
      type: "FEEDBACK",
      title: "Suchfilter fehlen auf der Produktseite",
      content:
        "Beim Testen ist aufgefallen, dass die Produktseite keine Filteroptionen hat. Wir brauchen mindestens Branche, Produktkategorie und Preisspanne.",
      status: "NEW",
    },
  });

  console.log(`  Project: ${fachweltProject.name}`);

  // ─── Client: Horbach ──────────────────────────────────────────────────────

  const horbach = await prisma.client.upsert({
    where: { slug: "horbach" },
    update: {},
    create: {
      name: "Horbach",
      slug: "horbach",
      status: "ACTIVE",
      partnershipScope:
        "HubSpot Automatisierung, E-Mail Workflows, Lead Routing für 350 Berater",
    },
  });

  const marlon = await prisma.user.upsert({
    where: { email: "marlon@horbach.de" },
    update: {},
    create: {
      email: "marlon@horbach.de",
      passwordHash: clientPassword,
      name: "Marlon",
      role: "CLIENT",
      clientId: horbach.id,
    },
  });

  console.log(
    `  Client: ${horbach.name} — User: ${marlon.name} (${marlon.email})`
  );

  const horbachProject = await prisma.project.upsert({
    where: { id: "proj_horbach_automation" },
    update: {},
    create: {
      id: "proj_horbach_automation",
      clientId: horbach.id,
      name: "Automatisierungs-Suite",
      description:
        "Umfassende Automatisierungslösung für 350 Horbach-Berater — HubSpot, E-Mail, Lead Routing",
      status: "ACTIVE",
      startDate: new Date("2026-04-01"),
    },
  });

  await Promise.all([
    prisma.projectArea.create({
      data: {
        projectId: horbachProject.id,
        name: "HubSpot Integration",
        sortOrder: 0,
      },
    }),
    prisma.projectArea.create({
      data: {
        projectId: horbachProject.id,
        name: "E-Mail Automatisierung",
        sortOrder: 1,
      },
    }),
    prisma.projectArea.create({
      data: {
        projectId: horbachProject.id,
        name: "Lead Routing",
        sortOrder: 2,
      },
    }),
  ]);

  console.log(`  Project: ${horbachProject.name}`);

  console.log("\nSeed complete!");
  console.log("  Admins: edon@tigonautomation.de / gent@tigonautomation.de (admin123)");
  console.log("  Clients: ap@fachwelt-verlag.de / marlon@horbach.de (client123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
