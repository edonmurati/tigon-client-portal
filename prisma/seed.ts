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

  // ─── Client: Fachwelt Verlag (ACTIVE) ─────────────────────────────────────

  const clientPassword = await hash("client123", 12);

  const fachwelt = await prisma.client.upsert({
    where: { slug: "fachwelt" },
    update: {},
    create: {
      name: "Fachwelt Verlag",
      slug: "fachwelt",
      stage: "ACTIVE",
      industry: "Verlagswesen",
      website: "https://fachwelt-verlag.de",
      monthlyRevenueCents: 500000,
      contractType: "Festpreis",
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
    `  Client: ${fachwelt.name} (ACTIVE) — User: ${alija.name} (${alija.email})`
  );

  // Fachwelt Marketplace Project
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
      type: "CLIENT_PROJECT",
      health: "AMBER",
      startDate: new Date("2025-11-01"),
      repoUrl: "edonmurati/fachwelt-marketplace",
      prodUrl: "https://marketplace.fachwelt-verlag.de",
      stagingUrl: "https://staging.fachwelt-verlag.de",
      stack: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "MinIO"],
      phase: "Feature Dev",
    },
  });

  // Project Areas
  const [areaMarketplace, ,] = await Promise.all([
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

  // ─── Client: Horbach (ACTIVE) ─────────────────────────────────────────────

  const horbach = await prisma.client.upsert({
    where: { slug: "horbach" },
    update: {},
    create: {
      name: "Horbach",
      slug: "horbach",
      stage: "ACTIVE",
      industry: "Finanzberatung",
      website: "https://horbach.de",
      monthlyRevenueCents: 300000,
      contractType: "Retainer",
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
    `  Client: ${horbach.name} (ACTIVE) — User: ${marlon.name} (${marlon.email})`
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
      type: "CLIENT_PROJECT",
      health: "GREEN",
      startDate: new Date("2026-04-01"),
      repoUrl: "edonmurati/horbach-automation",
      stack: ["n8n", "HubSpot API", "TypeScript"],
      phase: "Setup",
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

  // ─── Client: ImmoAI (WARM — Pipeline) ────────────────────────────────────

  const immoai = await prisma.client.upsert({
    where: { slug: "immoai" },
    update: {},
    create: {
      name: "ImmoAI",
      slug: "immoai",
      stage: "WARM",
      industry: "Immobilien / PropTech",
      partnershipScope: "KI-Exposé-Generator, Immobilien-Datenanalyse",
    },
  });

  console.log(`  Client: ${immoai.name} (WARM)`);

  // ─── Product: BauBeleg ────────────────────────────────────────────────────

  const baubeleg = await prisma.project.upsert({
    where: { id: "proj_baubeleg" },
    update: {},
    create: {
      id: "proj_baubeleg",
      name: "BauBeleg",
      description:
        "Digitale Bautagebuch-App für Handwerker — Foto-Dokumentation, Aufmaße, Nachträge",
      status: "ACTIVE",
      type: "PRODUCT",
      health: "GREEN",
      startDate: new Date("2025-09-01"),
      repoUrl: "edonmurati/baubeleg-app",
      prodUrl: "https://baubeleg.tigon-automation.de",
      stack: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "MinIO"],
      phase: "Feature Dev",
    },
  });

  console.log(`  Product: ${baubeleg.name}`);

  // ─── Product: Nachtrag ────────────────────────────────────────────────────

  const nachtrag = await prisma.project.upsert({
    where: { id: "proj_nachtrag" },
    update: {},
    create: {
      id: "proj_nachtrag",
      name: "Nachtrag",
      description:
        "Automatisierte Nachtragsberechnung für Bauunternehmen — VOB-konform",
      status: "PAUSED",
      type: "PRODUCT",
      health: "AMBER",
      repoUrl: "edonmurati/nachtrag",
      stack: ["Next.js", "TypeScript"],
      phase: "Research",
    },
  });

  console.log(`  Product: ${nachtrag.name}`);

  // ─── Internal: Tigon Portal ───────────────────────────────────────────────

  const tigonPortal = await prisma.project.upsert({
    where: { id: "proj_tigon_portal" },
    update: {},
    create: {
      id: "proj_tigon_portal",
      name: "Tigon Client Portal",
      description: "Internes Admin-Dashboard + Kunden-Portal",
      status: "ACTIVE",
      type: "INTERNAL",
      health: "GREEN",
      repoUrl: "edonmurati/tigon-client-portal",
      stack: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Tailwind"],
      phase: "Rebuild",
    },
  });

  console.log(`  Internal: ${tigonPortal.name}`);

  // ─── Contact Persons ──────────────────────────────────────────────────────

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

  // ─── Knowledge Entries (replace old Notes) ────────────────────────────────

  await prisma.knowledgeEntry.createMany({
    data: [
      // Meeting notes (was: Note type MEETING/CALL)
      {
        clientId: fachwelt.id,
        authorId: edon.id,
        category: "MEETING_NOTE",
        title: "Kickoff-Meeting Marketplace",
        content:
          "Scope besprochen: Marketplace mit Bildsuche, semantischer Suche. Phase 1 live bis Ende Mai.",
        tags: ["kickoff", "scope"],
      },
      {
        clientId: horbach.id,
        authorId: gent.id,
        category: "MEETING_NOTE",
        title: "Demo-Call Vorbereitung",
        content:
          "Marlon will n8n-Prototypen sehen. 3-5 Tage Aufwand für Demo.",
        tags: ["demo", "n8n"],
      },
      // Research (was: Note type INTERNAL)
      {
        clientId: fachwelt.id,
        projectId: fachweltProject.id,
        authorId: edon.id,
        category: "RESEARCH",
        title: "Bildsuche-Recherche",
        content:
          "CLIP + pgvector Ansatz vielversprechend. 14x Hormozi Score. Muss als USP positioniert werden.",
        tags: ["clip", "pgvector", "ai", "bildsuche"],
      },
      // Decisions (company level)
      {
        authorId: gent.id,
        category: "DECISION",
        title: "Self-Hosted Stack statt BaaS",
        content:
          "Entscheidung: Kein Supabase, kein Firebase. PostgreSQL + Prisma + MinIO self-hosted auf Hetzner VPS via Coolify. Grund: Volle Kontrolle, DSGVO, keine Vendor-Lock-In.",
        tags: ["architektur", "infrastruktur"],
        pinned: true,
      },
      // Playbook
      {
        authorId: edon.id,
        category: "PLAYBOOK",
        title: "Web-Projekt Setup Checklist",
        content:
          "1. GitHub Repo (private, edonmurati/)\n2. CLAUDE.md + docs/ Struktur\n3. Next.js + TypeScript + Tailwind\n4. Prisma + PostgreSQL\n5. Coolify Deployment\n6. .env für Credentials\n7. Feature Branch Workflow",
        tags: ["setup", "checklist", "web"],
        pinned: true,
      },
      // Insight
      {
        authorId: gent.id,
        category: "INSIGHT",
        title: "KI-Assistenten als Wettbewerbsvorteil für KMUs",
        content:
          "Deutsche KMUs sind unterversorgt bei KI-Integration. Große Beratungen sind zu teuer, SaaS-Tools zu generisch. Unsere Nische: maßgeschneiderte KI-Lösungen mit persönlicher Betreuung.",
        tags: ["strategie", "markt", "ki"],
      },
      // Project changelog
      {
        projectId: baubeleg.id,
        authorId: edon.id,
        category: "CHANGELOG",
        title: "Supabase → Self-Hosted Migration",
        content:
          "Komplette Migration von Supabase auf Self-Hosted Stack:\n- PostgreSQL Container\n- MinIO für Datei-Storage\n- Auth via bcryptjs + jose\n- Nur Resend (E-Mail) noch offen",
        tags: ["migration", "infrastruktur"],
      },
    ],
  });

  console.log("  KnowledgeEntries: 7 entries");

  // ─── Tasks ────────────────────────────────────────────────────────────────

  await prisma.task.createMany({
    data: [
      {
        title: "Staging-URL an Fachwelt schicken",
        clientId: fachwelt.id,
        projectId: fachweltProject.id,
        assigneeId: gent.id,
        priority: "HIGH",
        dueDate: new Date("2026-04-14"),
        sortOrder: 0,
      },
      {
        title: "BauBeleg Permission-Cleanup",
        projectId: baubeleg.id,
        assigneeId: edon.id,
        priority: "HIGH",
        dueDate: new Date("2026-04-14"),
        sortOrder: 1,
      },
      {
        title: "HubSpot API-Key beantragen",
        clientId: horbach.id,
        projectId: horbachProject.id,
        assigneeId: gent.id,
        priority: "NORMAL",
        sortOrder: 2,
      },
      {
        title: "Resend E-Mail-Integration für BauBeleg",
        projectId: baubeleg.id,
        assigneeId: edon.id,
        priority: "NORMAL",
        description: "Letzte offene Komponente nach Supabase-Migration",
        sortOrder: 3,
      },
      {
        title: "ImmoAI Research abschließen",
        clientId: immoai.id,
        assigneeId: edon.id,
        priority: "LOW",
        description:
          "Marktanalyse + Wettbewerb, Entscheidung ob wir es bauen",
        sortOrder: 4,
      },
      {
        title: "Demo-Prototyp für Horbach",
        clientId: horbach.id,
        projectId: horbachProject.id,
        assigneeId: gent.id,
        priority: "NORMAL",
        description: "n8n Workflow Prototypen: 3-5 Tage Aufwand",
        dueDate: new Date("2026-04-20"),
        sortOrder: 5,
      },
    ],
  });

  console.log("  Tasks: 6 entries");

  // ─── Credentials (encrypted) ─────────────────────────────────────────────

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

  // ─── Server Entries ───────────────────────────────────────────────────────

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

  // ─── Activity Log ─────────────────────────────────────────────────────────

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
        action: "entry.create",
        entityType: "KnowledgeEntry",
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
  console.log(
    "  Admins: edon@tigonautomation.de / gent@tigonautomation.de (admin123)"
  );
  console.log(
    "  Clients: ap@fachwelt-verlag.de / marlon@horbach.de (client123)"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
