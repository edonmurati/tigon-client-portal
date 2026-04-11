import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { encrypt } from "../src/lib/vault";

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

  // ─── V2: Contact Persons ──────────────────────────────────────────────────

  await prisma.contactPerson.createMany({
    data: [
      {
        clientId: fachwelt.id,
        name: "Alexander Pohle",
        role: "Geschäftsführer",
        email: "alexander.pohle@fachwelt-verlag.de",
        phone: "+49 711 123456",
        isPrimary: true,
      },
      {
        clientId: fachwelt.id,
        name: "Maria Schmidt",
        role: "Redaktionsleiterin",
        email: "ms@fachwelt-verlag.de",
      },
    ],
  });

  await prisma.contactPerson.createMany({
    data: [
      {
        clientId: horbach.id,
        name: "Marlon Horbach",
        role: "Geschäftsführer",
        email: "marlon.horbach@horbach.de",
        phone: "+49 221 654321",
        isPrimary: true,
      },
    ],
  });

  console.log("  ContactPersons: Fachwelt (2), Horbach (1)");

  // ─── V2: Notes ────────────────────────────────────────────────────────────

  await prisma.note.createMany({
    data: [
      {
        clientId: fachwelt.id,
        authorId: edon.id,
        type: "MEETING",
        title: "Kickoff-Meeting Marketplace",
        content:
          "Scope besprochen: Marketplace mit Bildsuche, semantischer Suche. Phase 1 live bis Ende Mai.",
      },
      {
        clientId: fachwelt.id,
        projectId: fachweltProject.id,
        authorId: edon.id,
        type: "INTERNAL",
        title: "Bildsuche-Recherche",
        content:
          "CLIP + pgvector Ansatz vielversprechend. 14x Hormozi Score. Muss als USP positioniert werden.",
      },
      {
        clientId: horbach.id,
        authorId: gent.id,
        type: "CALL",
        title: "Demo-Call Vorbereitung",
        content:
          "Marlon will n8n-Prototypen sehen. 3-5 Tage Aufwand für Demo.",
      },
    ],
  });

  console.log("  Notes: Fachwelt (2), Horbach (1)");

  // ─── V2: Credentials (encrypted) ─────────────────────────────────────────

  const coolifyLogin = encrypt("super-secret-password-123");
  const coolifyCredential = await prisma.credential.create({
    data: {
      clientId: fachwelt.id,
      label: "Coolify Dashboard",
      type: "LOGIN",
      url: "https://coolify.example.com",
      username: "admin@fachwelt-verlag.de",
      encValue: coolifyLogin.encValue,
      encIv: coolifyLogin.encIv,
      encTag: coolifyLogin.encTag,
      notes: "Fachwelt Produktionsserver",
      createdById: edon.id,
    },
  });

  const dbCred = encrypt("postgresql://user:pass@localhost:5432/fachwelt_prod");
  await prisma.credential.create({
    data: {
      clientId: fachwelt.id,
      projectId: fachweltProject.id,
      label: "Produktions-Datenbank",
      type: "DATABASE",
      encValue: dbCred.encValue,
      encIv: dbCred.encIv,
      encTag: dbCred.encTag,
      createdById: edon.id,
    },
  });

  const apiKey = encrypt("sk-test-abc123def456");
  const n8nCredential = await prisma.credential.create({
    data: {
      clientId: horbach.id,
      label: "n8n API Key",
      type: "API_KEY",
      encValue: apiKey.encValue,
      encIv: apiKey.encIv,
      encTag: apiKey.encTag,
      notes: "Für Automatisierungs-Workflows",
      createdById: gent.id,
    },
  });

  console.log("  Credentials: Fachwelt (2), Horbach (1)");

  // ─── V2: Server Entries ───────────────────────────────────────────────────

  const fachweltProdServer = await prisma.serverEntry.create({
    data: {
      clientId: fachwelt.id,
      projectId: fachweltProject.id,
      name: "Fachwelt Production",
      provider: "Hetzner",
      url: "https://marketplace.fachwelt-verlag.de",
      ip: "116.203.45.67",
      status: "ONLINE",
    },
  });

  await prisma.serverEntry.create({
    data: {
      clientId: fachwelt.id,
      name: "Fachwelt Staging",
      provider: "Coolify",
      url: "https://staging.fachwelt-verlag.de",
      status: "ONLINE",
    },
  });

  await prisma.serverEntry.create({
    data: {
      clientId: horbach.id,
      name: "Horbach n8n Instance",
      provider: "Hetzner",
      url: "https://n8n.horbach.de",
      status: "MAINTENANCE",
      statusNote: "Migration auf neue Version",
    },
  });

  console.log("  ServerEntries: Fachwelt (2), Horbach (1)");

  // ─── V2: Activity Log ─────────────────────────────────────────────────────

  await prisma.activityLog.createMany({
    data: [
      {
        userId: edon.id,
        action: "credential.create",
        entityType: "Credential",
        entityId: coolifyCredential.id,
        clientId: fachwelt.id,
        meta: JSON.stringify({ label: "Coolify Dashboard" }),
      },
      {
        userId: gent.id,
        action: "note.create",
        entityType: "Note",
        entityId: "seed",
        clientId: horbach.id,
        meta: JSON.stringify({ title: "Demo-Call Vorbereitung" }),
      },
      {
        userId: edon.id,
        action: "server.create",
        entityType: "ServerEntry",
        entityId: fachweltProdServer.id,
        clientId: fachwelt.id,
        meta: JSON.stringify({ name: "Fachwelt Production" }),
      },
      {
        userId: gent.id,
        action: "credential.create",
        entityType: "Credential",
        entityId: n8nCredential.id,
        clientId: horbach.id,
        meta: JSON.stringify({ label: "n8n API Key" }),
      },
    ],
  });

  console.log("  ActivityLog: 4 entries");

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
