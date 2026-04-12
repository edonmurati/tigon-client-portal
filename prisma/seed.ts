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

  // ─── Client: FinSense ─────────────────────────────────────────────────────

  const finsense = await prisma.client.upsert({
    where: { slug: "finsense" },
    update: {},
    create: {
      name: "FinSense GmbH & Co. KG",
      slug: "finsense",
      status: "ACTIVE",
      partnershipScope:
        "Website-Redesign, DSGVO-konformes Dokumentenportal fuer Kreditvermittler",
    },
  });

  const tuna = await prisma.user.upsert({
    where: { email: "tuna@finsense.de" },
    update: {},
    create: {
      email: "tuna@finsense.de",
      passwordHash: clientPassword,
      name: "Tuna Tuncali",
      role: "CLIENT",
      clientId: finsense.id,
    },
  });

  console.log(
    `  Client: ${finsense.name} — User: ${tuna.name} (${tuna.email})`
  );

  const finsenseWebsite = await prisma.project.upsert({
    where: { id: "proj_finsense_website" },
    update: {},
    create: {
      id: "proj_finsense_website",
      clientId: finsense.id,
      name: "Website Redesign",
      description:
        "Next.js Website-Redesign fuer Kreditvermittler — modern, responsive, 3-Step Consultation Modal",
      status: "ACTIVE",
      startDate: new Date("2026-03-15"),
    },
  });

  const finsenseDoku = await prisma.project.upsert({
    where: { id: "proj_finsense_dokumentenhub" },
    update: {},
    create: {
      id: "proj_finsense_dokumentenhub",
      clientId: finsense.id,
      name: "DokumentenHub",
      description:
        "DSGVO-konformes Dokumentenportal — Broker-Dashboard, Client-Upload, automatische Erinnerungen",
      status: "ACTIVE",
      startDate: new Date("2026-04-01"),
    },
  });

  console.log(
    `  Projects: ${finsenseWebsite.name}, ${finsenseDoku.name}`
  );

  await prisma.contactPerson.createMany({
    data: [
      {
        clientId: finsense.id,
        name: "Tuna Tuncali",
        role: "Geschaeftsfuehrer",
        email: "tuna@finsense.de",
        isPrimary: true,
      },
    ],
  });

  await prisma.note.createMany({
    data: [
      {
        clientId: finsense.id,
        projectId: finsenseWebsite.id,
        authorId: edon.id,
        type: "MEETING",
        title: "Meeting 16.04. — Prototyp-Vorstellung",
        content:
          "Website-Prototyp und DokumentenHub-Konzept vorstellen. Tuna vertraut nur funktionierenden Produkten (Show-First).",
      },
    ],
  });

  await prisma.milestone.create({
    data: {
      projectId: finsenseWebsite.id,
      title: "Prototyp-Vorstellung",
      dueDate: new Date("2026-04-16"),
      sortOrder: 0,
    },
  });

  console.log("  FinSense: contacts (1), notes (1), milestones (1)");

  // ─── Client: Bestattungen Schmid ──────────────────────────────────────────

  const schmid = await prisma.client.upsert({
    where: { slug: "bestattungen-schmid" },
    update: {},
    create: {
      name: "Bestattungen Schmid",
      slug: "bestattungen-schmid",
      status: "ACTIVE",
      partnershipScope: "Website-Redesign WordPress zu Next.js",
    },
  });

  const schmidUser = await prisma.user.upsert({
    where: { email: "kontakt@bestattung-schmid.de" },
    update: {},
    create: {
      email: "kontakt@bestattung-schmid.de",
      passwordHash: clientPassword,
      name: "Herr Schmid",
      role: "CLIENT",
      clientId: schmid.id,
    },
  });

  console.log(
    `  Client: ${schmid.name} — User: ${schmidUser.name} (${schmidUser.email})`
  );

  const schmidProject = await prisma.project.upsert({
    where: { id: "proj_schmid_website" },
    update: {},
    create: {
      id: "proj_schmid_website",
      clientId: schmid.id,
      name: "Website Redesign",
      description:
        "WordPress zu Next.js Migration — wuerdevolles, zurueckhaltendes Design fuer Bestattungsbranche",
      status: "ACTIVE",
      startDate: new Date("2026-03-20"),
    },
  });

  await prisma.contactPerson.createMany({
    data: [
      {
        clientId: schmid.id,
        name: "Herr Schmid",
        role: "Inhaber",
        email: "kontakt@bestattung-schmid.de",
        isPrimary: true,
      },
    ],
  });

  console.log(`  Project: ${schmidProject.name}`);

  // ─── Client: VW Rosenheim ─────────────────────────────────────────────────

  const vwRosenheim = await prisma.client.upsert({
    where: { slug: "vw-rosenheim" },
    update: {},
    create: {
      name: "VW Rosenheim",
      slug: "vw-rosenheim",
      status: "ACTIVE",
      partnershipScope: "Website-Redesign / Neubau",
    },
  });

  const vwUser = await prisma.user.upsert({
    where: { email: "info@vw-rosenheim.de" },
    update: {},
    create: {
      email: "info@vw-rosenheim.de",
      passwordHash: clientPassword,
      name: "VW Rosenheim",
      role: "CLIENT",
      clientId: vwRosenheim.id,
    },
  });

  console.log(
    `  Client: ${vwRosenheim.name} — User: ${vwUser.name} (${vwUser.email})`
  );

  const vwProject = await prisma.project.upsert({
    where: { id: "proj_vw_website" },
    update: {},
    create: {
      id: "proj_vw_website",
      clientId: vwRosenheim.id,
      name: "Website Redesign",
      description: "Moderner Webauftritt fuer Autohaus VW Rosenheim",
      status: "ACTIVE",
      startDate: new Date("2026-03-25"),
    },
  });

  await prisma.contactPerson.createMany({
    data: [
      {
        clientId: vwRosenheim.id,
        name: "Ansprechpartner VW",
        role: "Geschaeftsleitung",
        email: "info@vw-rosenheim.de",
        isPrimary: true,
      },
    ],
  });

  console.log(`  Project: ${vwProject.name}`);

  // ─── Client: EID / LUMINAR Hotelservice ───────────────────────────────────

  const eid = await prisma.client.upsert({
    where: { slug: "eid" },
    update: {},
    create: {
      name: "LUMINAR Hotelservice",
      slug: "eid",
      status: "PAUSED",
      partnershipScope: "Premium Website fuer Hotelservice-Unternehmen",
    },
  });

  const eidUser = await prisma.user.upsert({
    where: { email: "info@luminar-hotel.de" },
    update: {},
    create: {
      email: "info@luminar-hotel.de",
      passwordHash: clientPassword,
      name: "Herr Eid",
      role: "CLIENT",
      clientId: eid.id,
    },
  });

  console.log(
    `  Client: ${eid.name} — User: ${eidUser.name} (${eidUser.email})`
  );

  const eidProject = await prisma.project.upsert({
    where: { id: "proj_eid_website" },
    update: {},
    create: {
      id: "proj_eid_website",
      clientId: eid.id,
      name: "Website",
      description:
        "Premium-Website fuer Hotelservice — Night Audit, Front Office, Housekeeping, Dark Luxury Design",
      status: "PAUSED",
      startDate: new Date("2026-03-28"),
    },
  });

  console.log(`  Project: ${eidProject.name}`);

  // ─── Client: Montenegro Hotels ────────────────────────────────────────────

  const montenegro = await prisma.client.upsert({
    where: { slug: "montenegro" },
    update: {},
    create: {
      name: "Montenegro Hotels",
      slug: "montenegro",
      status: "PAUSED",
      partnershipScope: "Direct Booking Engine fuer Hotels in Ulcinj",
    },
  });

  console.log(`  Client: ${montenegro.name} (no user — family contact)`);

  const montenegroProject = await prisma.project.upsert({
    where: { id: "proj_montenegro_booking" },
    update: {},
    create: {
      id: "proj_montenegro_booking",
      clientId: montenegro.id,
      name: "Direct Booking Engine",
      description:
        "Einbettbares Widget — Echtzeit-Verfuegbarkeit, Online-Zahlung, Channel-Sync. Reduziert Booking.com 15-18% Kommission.",
      status: "PAUSED",
      startDate: new Date("2026-03-29"),
    },
  });

  await prisma.contactPerson.createMany({
    data: [
      {
        clientId: montenegro.id,
        name: "Onkel (Hotelbesitzer)",
        role: "Inhaber",
        notes:
          "Familie — null Barrieren. Hotel in Ulcinj, Montenegro.",
        isPrimary: true,
      },
    ],
  });

  console.log(`  Project: ${montenegroProject.name}`);

  // ─── Client: WMK Architekten ──────────────────────────────────────────────

  const wmk = await prisma.client.upsert({
    where: { slug: "wmk-architekten" },
    update: {},
    create: {
      name: "WMK Architekten",
      slug: "wmk-architekten",
      status: "PAUSED",
      partnershipScope: "Website-Redesign oder digitales Tool",
    },
  });

  console.log(`  Client: ${wmk.name} (no user — no direct contact yet)`);

  await prisma.contactPerson.createMany({
    data: [
      {
        clientId: wmk.id,
        name: "Kontakt ueber Gents Vater",
        role: "Subunternehmer-Beziehung",
        notes:
          "Gents Vater arbeitet seit Jahren als Subunternehmer fuer dieses Buero.",
        isPrimary: true,
      },
    ],
  });

  console.log("  WMK: contacts (1)");

  // ─── Client: Paricon AG ───────────────────────────────────────────────────

  const paricon = await prisma.client.upsert({
    where: { slug: "paricon" },
    update: {},
    create: {
      name: "paricon AG",
      slug: "paricon",
      status: "PAUSED",
      partnershipScope: "Networking Node — kein direkter Business Case",
    },
  });

  console.log(`  Client: ${paricon.name} (no user)`);

  await prisma.contactPerson.createMany({
    data: [
      {
        clientId: paricon.id,
        name: "Kujtim",
        role: "Angestellter (Freund)",
        email: "kujtim@paricon.de",
        notes:
          "SAP-Firma, Zero Tech-Overlap. Langfristiges Networking.",
        isPrimary: true,
      },
    ],
  });

  console.log("  Paricon: contacts (1)");

  // ─── Client: Vasko / Society de Five ─────────────────────────────────────

  const vasko = await prisma.client.upsert({
    where: { slug: "vasko" },
    update: {},
    create: {
      name: "Society de Five",
      slug: "vasko",
      status: "ACTIVE",
      partnershipScope: "Pro-Bono Website — Fashion / D2C Dark Luxury",
    },
  });

  const vaskoUser = await prisma.user.upsert({
    where: { email: "vasko@societydefive.com" },
    update: {},
    create: {
      email: "vasko@societydefive.com",
      passwordHash: clientPassword,
      name: "Vasko",
      role: "CLIENT",
      clientId: vasko.id,
    },
  });

  console.log(
    `  Client: ${vasko.name} — User: ${vaskoUser.name} (${vaskoUser.email})`
  );

  const vaskoProject = await prisma.project.upsert({
    where: { id: "proj_vasko_website" },
    update: {},
    create: {
      id: "proj_vasko_website",
      clientId: vasko.id,
      name: "Brand Website",
      description:
        "Pro-Bono Website fuer Fashion-Brand @societydefive — Dark Luxury Segment",
      status: "ACTIVE",
      startDate: new Date("2026-04-01"),
    },
  });

  console.log(`  Project: ${vaskoProject.name}`);

  console.log("\nSeed complete!");
  console.log("  Admins: edon@tigonautomation.de / gent@tigonautomation.de (admin123)");
  console.log("  Clients (with login): ap@fachwelt-verlag.de / marlon@horbach.de / tuna@finsense.de / kontakt@bestattung-schmid.de / info@vw-rosenheim.de / info@luminar-hotel.de / vasko@societydefive.com (client123)");
  console.log("  Clients (no login): Montenegro Hotels, WMK Architekten, paricon AG");
  console.log("  Total clients: 10");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
