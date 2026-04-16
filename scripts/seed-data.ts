import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { encrypt } from "../src/lib/vault";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🏗️  Seeding Tigon Client Portal...\n");

  // Lookup existing IDs dynamically (survive DB resets)
  const workspace = await prisma.workspace.findFirstOrThrow({ where: { slug: "tigon" } });
  const gent = await prisma.user.findFirstOrThrow({ where: { workspaceId: workspace.id, email: "gent.cungu@tigonautomation.de" } });
  const edon = await prisma.user.findFirstOrThrow({ where: { workspaceId: workspace.id, email: "edon.murati@tigonautomation.de" } });
  const WORKSPACE_ID = workspace.id;
  const GENT_ID = gent.id;
  const EDON_ID = edon.id;

  // ═══════════════════════════════════════════════════════════════════
  // CLIENTS
  // ═══════════════════════════════════════════════════════════════════

  const fachwelt = await prisma.client.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "fachwelt" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      name: "Fachwelt Verlag",
      slug: "fachwelt",
      stage: "ACTIVE",
      industry: "B2B Industrial Publishing",
      website: "https://fachwelt-verlag.de",
      contractType: "Fixed Price",
    },
  });
  console.log(`  Client: ${fachwelt.name}`);

  const horbach = await prisma.client.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "horbach" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      name: "Horbach",
      slug: "horbach",
      stage: "ACTIVE",
      industry: "Finanzberatung / Vertrieb",
      contractType: "SaaS (geplant)",
    },
  });
  console.log(`  Client: ${horbach.name}`);

  const vasko = await prisma.client.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "vasko" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      name: "Vasko (Society de Five)",
      slug: "vasko",
      stage: "PRO_BONO",
      industry: "Fashion / D2C — Dark Luxury",
    },
  });
  console.log(`  Client: ${vasko.name}`);

  const eid = await prisma.client.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "eid" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      name: "LUMINAR Hotelservice",
      slug: "eid",
      stage: "WARM",
      industry: "Hotelservice / Einzelunternehmen",
    },
  });
  console.log(`  Client: ${eid.name}`);

  // Keep existing Demo Kunde, just reference it
  const demoKunde = await prisma.client.findFirst({
    where: { workspaceId: WORKSPACE_ID, slug: "demo-kunde" },
  });

  // ═══════════════════════════════════════════════════════════════════
  // CONTACT PERSONS
  // ═══════════════════════════════════════════════════════════════════

  const alija = await prisma.contactPerson.upsert({
    where: { id: "seed-contact-alija" },
    update: {},
    create: {
      id: "seed-contact-alija",
      workspaceId: WORKSPACE_ID,
      clientId: fachwelt.id,
      name: "Alija Palevic",
      role: "Geschaeftsfuehrerin",
      email: "ap@fachwelt-verlag.de",
      isPrimary: true,
    },
  });

  const katrin = await prisma.contactPerson.upsert({
    where: { id: "seed-contact-katrin" },
    update: {},
    create: {
      id: "seed-contact-katrin",
      workspaceId: WORKSPACE_ID,
      clientId: fachwelt.id,
      name: "Katrin",
      role: "Redaktion",
      isPrimary: false,
    },
  });

  const marlon = await prisma.contactPerson.upsert({
    where: { id: "seed-contact-marlon" },
    update: {},
    create: {
      id: "seed-contact-marlon",
      workspaceId: WORKSPACE_ID,
      clientId: horbach.id,
      name: "Marlon",
      role: "Teamleiter",
      isPrimary: true,
    },
  });

  const paul = await prisma.contactPerson.upsert({
    where: { id: "seed-contact-paul" },
    update: {},
    create: {
      id: "seed-contact-paul",
      workspaceId: WORKSPACE_ID,
      clientId: horbach.id,
      name: "Paul",
      role: "Berater",
      isPrimary: false,
    },
  });

  const jonathan = await prisma.contactPerson.upsert({
    where: { id: "seed-contact-jonathan" },
    update: {},
    create: {
      id: "seed-contact-jonathan",
      workspaceId: WORKSPACE_ID,
      clientId: horbach.id,
      name: "Jonathan",
      role: "Berater",
      isPrimary: false,
    },
  });

  const vaskoContact = await prisma.contactPerson.upsert({
    where: { id: "seed-contact-vasko" },
    update: {},
    create: {
      id: "seed-contact-vasko",
      workspaceId: WORKSPACE_ID,
      clientId: vasko.id,
      name: "Vasko",
      role: "Inhaber / Creative Director",
      isPrimary: true,
      notes: "Persoenlicher Kontakt",
    },
  });

  const eidContact = await prisma.contactPerson.upsert({
    where: { id: "seed-contact-eid-client" },
    update: {},
    create: {
      id: "seed-contact-eid-client",
      workspaceId: WORKSPACE_ID,
      clientId: eid.id,
      name: "Herr Eid",
      role: "Inhaber",
      isPrimary: true,
      notes: "Kontakt via Kollege des Operators",
    },
  });

  console.log(`  Contacts: Alija, Katrin, Marlon, Paul, Jonathan, Vasko, Hr. Eid`);

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN USERS — set password on existing users (created by init-workspace)
  // ═══════════════════════════════════════════════════════════════════

  const adminPasswordHash = await hash("tigon2026", 12);

  await prisma.user.update({
    where: { workspaceId_email: { workspaceId: WORKSPACE_ID, email: "gent.cungu@tigonautomation.de" } },
    data: { passwordHash: adminPasswordHash },
  });
  await prisma.user.update({
    where: { workspaceId_email: { workspaceId: WORKSPACE_ID, email: "edon.murati@tigonautomation.de" } },
    data: { passwordHash: adminPasswordHash },
  });
  console.log(`  Admin Passwords set: gent.cungu@ + edon.murati@ / tigon2026`);

  // ═══════════════════════════════════════════════════════════════════
  // CLIENT USER (for client portal login)
  // ═══════════════════════════════════════════════════════════════════

  const clientPasswordHash = await hash("portal2026", 12);

  const alijaUser = await prisma.user.upsert({
    where: { workspaceId_email: { workspaceId: WORKSPACE_ID, email: "ap@fachwelt-verlag.de" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      email: "ap@fachwelt-verlag.de",
      passwordHash: clientPasswordHash,
      name: "Alija Palevic",
      role: "CLIENT",
      clientId: fachwelt.id,
    },
  });
  console.log(`  Client User: ${alijaUser.email} / portal2026`);

  // ═══════════════════════════════════════════════════════════════════
  // PROJECTS — Fachwelt
  // ═══════════════════════════════════════════════════════════════════

  const redaktionsassistent = await prisma.project.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "fachwelt-redaktionsassistent" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      clientId: fachwelt.id,
      name: "Redaktionsassistent",
      slug: "fachwelt-redaktionsassistent",
      description: "Email Qualification System — Incoming email → auto-qualifies → categorizes → generates response text → publishes",
      status: "ACTIVE",
      type: "CLIENT_PROJECT",
      health: "GREEN",
      startDate: new Date("2026-03-01"),
      repoUrl: "https://github.com/edonmurati/fachwelt-marketplace",
      stack: ["Next.js", "Supabase", "Vercel", "n8n"],
      phase: "2.0 — CRM-Anbindung",
      areas: ["Email-Qualifizierung", "Beitragserstellung", "Portal-Upload", "CRM"],
    },
  });

  const marketplace = await prisma.project.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "fachwelt-marketplace" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      clientId: fachwelt.id,
      name: "Industrie-Marketplace",
      slug: "fachwelt-marketplace",
      description: "B2B Produkt-Marktplatz 'Industry Business' — Visitor inquiry → Admin processes → Manufacturer → Sale → Commission",
      status: "ACTIVE",
      type: "CLIENT_PROJECT",
      health: "AMBER",
      startDate: new Date("2026-03-15"),
      repoUrl: "https://github.com/edonmurati/fachwelt-marketplace",
      stack: ["Next.js", "Supabase", "Vercel"],
      phase: "Design + Content",
      areas: ["Auth", "Admin", "Hersteller-Portal", "Produktkatalog"],
    },
  });

  const crmMigration = await prisma.project.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "fachwelt-crm-migration" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      clientId: fachwelt.id,
      name: "CRM-Migration (Access → Odoo)",
      slug: "fachwelt-crm-migration",
      description: "Migration von Microsoft Access zu Odoo Cloud. Nur Stammdaten (Firmen + Kontakte), keine Transaktionsdaten.",
      status: "ACTIVE",
      type: "CLIENT_PROJECT",
      health: "GREEN",
      startDate: new Date("2026-04-08"),
      stack: ["Odoo", "Python", "n8n"],
      phase: "Migration",
      areas: ["Daten-Export", "Bereinigung", "Import", "Sync"],
    },
  });

  console.log(`  Projects: ${redaktionsassistent.name}, ${marketplace.name}, ${crmMigration.name}`);

  // ═══════════════════════════════════════════════════════════════════
  // PROJECTS — Horbach
  // ═══════════════════════════════════════════════════════════════════

  const horbachAutomation = await prisma.project.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "horbach-automation" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      clientId: horbach.id,
      name: "Automation-Suite",
      slug: "horbach-automation",
      description: "HubSpot ↔ Outlook Integration, automatisierte segmentierte Mails, Reminder, Re-Booking, Lead-Routing, Nurture-Funnel",
      status: "ACTIVE",
      type: "CLIENT_PROJECT",
      health: "AMBER",
      startDate: new Date("2026-04-08"),
      stack: ["n8n", "HubSpot API", "Outlook API"],
      phase: "Warte auf API-Zugang",
      areas: ["HubSpot-Sync", "Mail-Segmentierung", "WhatsApp-Bot", "Lead-Routing"],
    },
  });

  console.log(`  Projects: ${horbachAutomation.name}`);

  // ═══════════════════════════════════════════════════════════════════
  // PROJECTS — Internal
  // ═══════════════════════════════════════════════════════════════════

  const clientPortal = await prisma.project.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "client-portal" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      name: "Client Portal",
      slug: "client-portal",
      description: "Tigon Client Portal — Multi-Tenant SaaS fuer Kunden-Management, Projekte, CRM, Finanzen",
      status: "ACTIVE",
      type: "INTERNAL",
      health: "GREEN",
      startDate: new Date("2026-03-15"),
      repoUrl: "https://github.com/edonmurati/tigon-client-portal",
      prodUrl: "https://portal.tigonautomation.de",
      stack: ["Next.js", "PostgreSQL", "Prisma", "Tailwind", "Coolify"],
      phase: "MVP",
      areas: ["Auth", "Admin-Dashboard", "Client-Portal", "CRM", "Finanzen"],
    },
  });

  const baubeleg = await prisma.project.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "baubeleg-app" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      name: "BauBeleg-App",
      slug: "baubeleg-app",
      description: "Mobile-first PWA fuer Subunternehmer im Baugewerbe. Nachtraege + Behinderungsanzeigen als VOB/B-konformes PDF in 45 Sekunden.",
      status: "ACTIVE",
      type: "PRODUCT",
      health: "GREEN",
      startDate: new Date("2026-02-01"),
      repoUrl: "https://github.com/edonmurati/baubeleg-app",
      prodUrl: "https://baubeleg.surfingtigon.com",
      stagingUrl: "https://staging-baubeleg.surfingtigon.com",
      stack: ["Next.js", "Tailwind", "Prisma", "PostgreSQL", "MinIO", "Coolify"],
      phase: "Production-Ready",
      areas: ["Nachtraege", "Behinderungsanzeigen", "PDF-Generator", "Baustellen"],
    },
  });

  const baubeleLanding = await prisma.project.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "baubeleg-landing" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      name: "BauBeleg Landing Page",
      slug: "baubeleg-landing",
      description: "Marketing-Landingpage fuer baubeleg.de",
      status: "ACTIVE",
      type: "PRODUCT",
      health: "GREEN",
      prodUrl: "https://baubeleg.de",
      stack: ["Next.js", "Tailwind"],
      phase: "Live",
    },
  });

  const tigonWebsite = await prisma.project.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "tigon-website" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      name: "Tigon Website",
      slug: "tigon-website",
      description: "Firmenwebsite tigonautomation.de",
      status: "ACTIVE",
      type: "INTERNAL",
      health: "GREEN",
      prodUrl: "https://tigonautomation.de",
      stack: ["Next.js", "Tailwind", "Coolify"],
      phase: "Maintenance",
    },
  });

  const hurghadaTours = await prisma.project.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "hurghada-tours" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      name: "Hurghada Tours",
      slug: "hurghada-tours",
      description: "Tourismus-Website. Stats-Zahlen muessen vor oeffentlichem Launch durch echte Werte ersetzt werden (UWG §5).",
      status: "ACTIVE",
      type: "CLIENT_PROJECT",
      health: "AMBER",
      stack: ["Next.js", "Tailwind"],
      phase: "Live — Content-Approval pending",
    },
  });

  const vaskoWebsite = await prisma.project.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "vasko-website" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      clientId: vasko.id,
      name: "Society de Five Website",
      slug: "vasko-website",
      description: "Brand-Website fuer Dark Luxury Fashion Label @societydefive",
      status: "ACTIVE",
      type: "CLIENT_PROJECT",
      health: "GREEN",
      repoUrl: "https://github.com/gentdergent/vasko-website",
      stack: ["Next.js", "Tailwind"],
      phase: "Setup",
    },
  });

  const eidWebsite = await prisma.project.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "luminar-website" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      clientId: eid.id,
      name: "LUMINAR Website",
      slug: "luminar-website",
      description: "Website fuer LUMINAR Hotelservice — Night Audit, Front Office, Housekeeping, Fruehstuecksservice",
      status: "ACTIVE",
      type: "CLIENT_PROJECT",
      health: "GREEN",
      repoUrl: "https://github.com/gentdergent/luminar-website",
      stack: ["Next.js", "Tailwind"],
      phase: "Setup — Design Foundation als naechstes",
    },
  });

  const habitMonitor = await prisma.project.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "habit-monitor" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      name: "HABIT Monitor",
      slug: "habit-monitor",
      description: "Live-Dashboard fuer den HABIT-Server. System-Auslastung, Docker, Dev-Server, Prozesse in Echtzeit.",
      status: "ACTIVE",
      type: "INTERNAL",
      health: "GREEN",
      stack: ["Node.js", "WebSocket", "React", "Tailwind", "uPlot"],
      phase: "Live / Maintenance",
    },
  });

  const habitFiles = await prisma.project.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "habit-files" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      name: "HABIT Files",
      slug: "habit-files",
      description: "Server-side File Explorer via Tailscale. Two-Pane Commander UI, CodeMirror Editor, streamed Uploads.",
      status: "ACTIVE",
      type: "INTERNAL",
      health: "GREEN",
      stack: ["Node.js", "Vanilla JS", "Vite", "CodeMirror"],
      phase: "Live / Maintenance",
    },
  });

  const articleEditorSaas = await prisma.project.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "article-editor-saas" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      clientId: fachwelt.id,
      name: "Article Editor SaaS",
      slug: "article-editor-saas",
      description: "SaaS-Version des Redaktionstools — API + Frontend deployed auf Coolify",
      status: "ACTIVE",
      type: "CLIENT_PROJECT",
      health: "GREEN",
      prodUrl: "https://editor.surfingtigon.com",
      repoUrl: "https://github.com/gentdergent/article-editor-saas",
      stack: ["Vite", "React", "Supabase", "Tailwind"],
      phase: "Deployed",
    },
  });

  const finsenseWebsite = await prisma.project.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "finsense-website" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      name: "FinSense Prototyp-Website",
      slug: "finsense-website",
      description: "Prototyp-Website fuer FinSense (Kreditvermittler). Gebaut, noch nicht gezeigt.",
      status: "PAUSED",
      type: "CLIENT_PROJECT",
      health: "GREEN",
      stack: ["Next.js", "Tailwind"],
      phase: "Prototyp fertig — wartet auf Pitch",
    },
  });

  const vwRosenheim = await prisma.project.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "vw-rosenheim" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      name: "VW Rosenheim Prototyp",
      slug: "vw-rosenheim",
      description: "Prototyp-Website fuer VW Zentrum Rosenheim. PARKED — ausserhalb strategischem Radius.",
      status: "PAUSED",
      type: "CLIENT_PROJECT",
      health: "GREEN",
      stack: ["Next.js", "React", "Tailwind", "Framer Motion"],
      phase: "PARKED — Portfolio/Referenz only",
    },
  });

  const bestattungenSchmid = await prisma.project.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "bestattungen-schmid" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      name: "Bestattungen Schmid Prototyp",
      slug: "bestattungen-schmid",
      description: "Prototyp-Website fuer Bestattungsunternehmen in Rosenheim",
      status: "PAUSED",
      type: "CLIENT_PROJECT",
      health: "GREEN",
      stack: ["Next.js", "Tailwind"],
      phase: "Prototyp — kein direkter Kontakt",
    },
  });

  console.log(`  Projects: ${clientPortal.name}, BauBeleg, Tigon Website, +9 more`);

  // ═══════════════════════════════════════════════════════════════════
  // MILESTONES — BauBeleg
  // ═══════════════════════════════════════════════════════════════════

  await prisma.milestone.upsert({
    where: { id: "seed-ms-baubeleg-mvp" },
    update: {},
    create: {
      id: "seed-ms-baubeleg-mvp",
      projectId: baubeleg.id,
      title: "MVP — Nachtrag + Behinderungsanzeige als PDF",
      status: "DONE",
      completedAt: new Date("2026-03-25"),
      sortOrder: 1,
    },
  });

  await prisma.milestone.upsert({
    where: { id: "seed-ms-baubeleg-selfhost" },
    update: {},
    create: {
      id: "seed-ms-baubeleg-selfhost",
      projectId: baubeleg.id,
      title: "Self-Hosted Migration (Supabase → Coolify PG + MinIO)",
      status: "DONE",
      completedAt: new Date("2026-04-09"),
      sortOrder: 2,
    },
  });

  await prisma.milestone.upsert({
    where: { id: "seed-ms-baubeleg-production" },
    update: {},
    create: {
      id: "seed-ms-baubeleg-production",
      projectId: baubeleg.id,
      title: "Production Deploy + Staging-Smoke-Test",
      status: "IN_PROGRESS",
      sortOrder: 3,
    },
  });

  await prisma.milestone.upsert({
    where: { id: "seed-ms-baubeleg-rapporte" },
    update: {},
    create: {
      id: "seed-ms-baubeleg-rapporte",
      projectId: baubeleg.id,
      title: "Rapporte + weitere Dokumenttypen",
      status: "PLANNED",
      sortOrder: 4,
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // MILESTONES — Redaktionsassistent
  // ═══════════════════════════════════════════════════════════════════

  const ms1 = await prisma.milestone.upsert({
    where: { id: "seed-ms-redaktion-v1" },
    update: {},
    create: {
      id: "seed-ms-redaktion-v1",
      projectId: redaktionsassistent.id,
      title: "v1.0 — Email Pipeline funktionsfaehig",
      description: "Posteingang, Klassifizierung, Beitragserstellung, Upload auf Portale",
      status: "DONE",
      completedAt: new Date("2026-03-28"),
      sortOrder: 1,
    },
  });

  const ms2 = await prisma.milestone.upsert({
    where: { id: "seed-ms-redaktion-v2" },
    update: {},
    create: {
      id: "seed-ms-redaktion-v2",
      projectId: redaktionsassistent.id,
      title: "v2.0 — CRM + E-Mag + Newsletter",
      description: "Odoo-Anbindung, E-Mag-Software, Newsletter-Integration",
      status: "IN_PROGRESS",
      dueDate: new Date("2026-05-15"),
      sortOrder: 2,
    },
  });

  const ms3 = await prisma.milestone.upsert({
    where: { id: "seed-ms-redaktion-access" },
    update: {},
    create: {
      id: "seed-ms-redaktion-access",
      projectId: redaktionsassistent.id,
      title: "Oeffentlicher Zugang fuer Alija + Katrin",
      status: "PLANNED",
      sortOrder: 3,
    },
  });

  // Milestones — Marketplace
  const msMarket1 = await prisma.milestone.upsert({
    where: { id: "seed-ms-marketplace-grundstruktur" },
    update: {},
    create: {
      id: "seed-ms-marketplace-grundstruktur",
      projectId: marketplace.id,
      title: "Grundstruktur (Auth, DB, Admin, Hersteller-Portal)",
      status: "DONE",
      completedAt: new Date("2026-04-01"),
      sortOrder: 1,
    },
  });

  const msMarket2 = await prisma.milestone.upsert({
    where: { id: "seed-ms-marketplace-design" },
    update: {},
    create: {
      id: "seed-ms-marketplace-design",
      projectId: marketplace.id,
      title: "Design + Content + Beispieldaten",
      description: "Modern/schlicht, mobile.de-Filter, 'Industry Business' Branding, Beispiel-Anbieter + Produkte",
      status: "IN_PROGRESS",
      dueDate: new Date("2026-05-01"),
      sortOrder: 2,
    },
  });

  // Milestones — CRM Migration
  const msCrm1 = await prisma.milestone.upsert({
    where: { id: "seed-ms-crm-export" },
    update: {},
    create: {
      id: "seed-ms-crm-export",
      projectId: crmMigration.id,
      title: "Access → CSV Export (Alija)",
      status: "IN_PROGRESS",
      sortOrder: 1,
    },
  });

  const msCrm2 = await prisma.milestone.upsert({
    where: { id: "seed-ms-crm-cleanup" },
    update: {},
    create: {
      id: "seed-ms-crm-cleanup",
      projectId: crmMigration.id,
      title: "CSV bereinigen + Odoo Import",
      status: "PLANNED",
      sortOrder: 2,
    },
  });

  const msCrm3 = await prisma.milestone.upsert({
    where: { id: "seed-ms-crm-sync" },
    update: {},
    create: {
      id: "seed-ms-crm-sync",
      projectId: crmMigration.id,
      title: "Odoo → Supabase Sync (n8n)",
      status: "PLANNED",
      sortOrder: 3,
    },
  });

  // Milestones — Client Portal
  const msPortal1 = await prisma.milestone.upsert({
    where: { id: "seed-ms-portal-auth" },
    update: {},
    create: {
      id: "seed-ms-portal-auth",
      projectId: clientPortal.id,
      title: "Auth + Admin Dashboard MVP",
      status: "DONE",
      completedAt: new Date("2026-04-10"),
      sortOrder: 1,
    },
  });

  const msPortal2 = await prisma.milestone.upsert({
    where: { id: "seed-ms-portal-client" },
    update: {},
    create: {
      id: "seed-ms-portal-client",
      projectId: clientPortal.id,
      title: "Client Portal + Impulse System",
      status: "IN_PROGRESS",
      sortOrder: 2,
    },
  });

  const msPortal3 = await prisma.milestone.upsert({
    where: { id: "seed-ms-portal-finance" },
    update: {},
    create: {
      id: "seed-ms-portal-finance",
      projectId: clientPortal.id,
      title: "Finanzen (Rechnungen, Zahlungen, Ausgaben)",
      status: "PLANNED",
      sortOrder: 3,
    },
  });

  console.log(`  Milestones: 11 created`);

  // ═══════════════════════════════════════════════════════════════════
  // TASKS
  // ═══════════════════════════════════════════════════════════════════

  const tasks = [
    // Redaktionsassistent
    {
      id: "seed-task-odoo-anbindung",
      projectId: redaktionsassistent.id,
      clientId: fachwelt.id,
      milestoneId: ms2.id,
      title: "Odoo CRM anbinden",
      description: "Odoo XML-RPC API → n8n Sync → Supabase Firmen-Tabelle. odoo_id als externer Schluessel.",
      ownerTag: "EDON" as const,
      priority: "HIGH" as const,
      status: "OPEN" as const,
      tags: ["integration", "odoo"],
    },
    {
      id: "seed-task-emag-anbindung",
      projectId: redaktionsassistent.id,
      clientId: fachwelt.id,
      milestoneId: ms2.id,
      title: "E-Mag-Software anbinden",
      description: "webmag.io Integration fuer nahtlosen Uebergang vom Redaktionssystem zur E-Mag-Produktion",
      ownerTag: "GENT" as const,
      priority: "NORMAL" as const,
      status: "OPEN" as const,
      tags: ["integration"],
    },
    {
      id: "seed-task-newsletter",
      projectId: redaktionsassistent.id,
      clientId: fachwelt.id,
      milestoneId: ms2.id,
      title: "Newsletter-Software anbinden",
      ownerTag: "GENT" as const,
      priority: "NORMAL" as const,
      status: "OPEN" as const,
      tags: ["integration"],
    },
    // Marketplace
    {
      id: "seed-task-marketplace-bilder",
      projectId: marketplace.id,
      clientId: fachwelt.id,
      milestoneId: msMarket2.id,
      title: "Bilddarstellung Fehler beheben",
      ownerTag: "EDON" as const,
      priority: "HIGH" as const,
      status: "OPEN" as const,
      tags: ["bug", "ui"],
    },
    {
      id: "seed-task-marketplace-filter",
      projectId: marketplace.id,
      clientId: fachwelt.id,
      milestoneId: msMarket2.id,
      title: "Filter wie mobile.de orientieren",
      description: "Kategorie-Filter, Preis-Range, Hersteller, Zustand",
      ownerTag: "EDON" as const,
      priority: "NORMAL" as const,
      status: "OPEN" as const,
      tags: ["feature", "ui"],
    },
    {
      id: "seed-task-marketplace-beispieldaten",
      projectId: marketplace.id,
      clientId: fachwelt.id,
      milestoneId: msMarket2.id,
      title: "Beispieldaten inserieren (Anbieter + Produkte)",
      ownerTag: "BEIDE" as const,
      priority: "HIGH" as const,
      status: "OPEN" as const,
      tags: ["content"],
    },
    {
      id: "seed-task-marketplace-design",
      projectId: marketplace.id,
      clientId: fachwelt.id,
      milestoneId: msMarket2.id,
      title: "Design-Brainstorming mit Edon, Daniel, Nedo",
      description: "Modern, schlicht, 'Industry Business' Branding prominent oben. Logos von Daniel noetig.",
      ownerTag: "EDON" as const,
      priority: "NORMAL" as const,
      status: "OPEN" as const,
      tags: ["design"],
    },
    // CRM Migration
    {
      id: "seed-task-crm-csv-export",
      projectId: crmMigration.id,
      clientId: fachwelt.id,
      milestoneId: msCrm1.id,
      title: "Access → CSV Export (wartet auf Alija)",
      ownerTag: "GENT" as const,
      priority: "URGENT" as const,
      status: "BLOCKED" as const,
      blockedReason: "Wartet auf CSV-Export von Alija",
      tags: ["migration"],
    },
    {
      id: "seed-task-crm-cleanup",
      projectId: crmMigration.id,
      clientId: fachwelt.id,
      milestoneId: msCrm2.id,
      title: "CSV bereinigen (Duplikate, Normalisierung)",
      description: "Python-Script: Firma/Kontakt-Trennung, Duplikate entfernen, Felder normalisieren",
      ownerTag: "EDON" as const,
      priority: "HIGH" as const,
      status: "OPEN" as const,
      tags: ["migration", "python"],
    },
    {
      id: "seed-task-crm-odoo-setup",
      projectId: crmMigration.id,
      clientId: fachwelt.id,
      milestoneId: msCrm2.id,
      title: "Odoo einrichten + Felder anlegen + CSV Import",
      ownerTag: "GENT" as const,
      priority: "HIGH" as const,
      status: "OPEN" as const,
      tags: ["migration", "odoo"],
    },
    // Horbach
    {
      id: "seed-task-horbach-hubspot",
      projectId: horbachAutomation.id,
      clientId: horbach.id,
      title: "HubSpot ↔ Outlook Kernfluss + Mail-Segmentierung",
      ownerTag: "GENT" as const,
      priority: "HIGH" as const,
      status: "BLOCKED" as const,
      blockedReason: "Wartet auf HubSpot API-Zugang von Marlon",
      tags: ["integration", "hubspot"],
    },
    {
      id: "seed-task-horbach-whatsapp",
      projectId: horbachAutomation.id,
      clientId: horbach.id,
      title: "WhatsApp-Bot + Lead-Routing",
      ownerTag: "EDON" as const,
      priority: "NORMAL" as const,
      status: "OPEN" as const,
      tags: ["integration", "whatsapp"],
    },
    // Client Portal
    {
      id: "seed-task-portal-seed",
      projectId: clientPortal.id,
      title: "DB mit echten Daten befuellen",
      ownerTag: "GENT" as const,
      priority: "HIGH" as const,
      status: "IN_PROGRESS" as const,
      tags: ["infra"],
    },
    {
      id: "seed-task-portal-deploy",
      projectId: clientPortal.id,
      title: "Production Deploy (Coolify)",
      ownerTag: "GENT" as const,
      priority: "HIGH" as const,
      status: "OPEN" as const,
      tags: ["deploy"],
    },
    // BauBeleg
    {
      id: "seed-task-baubeleg-dezimal",
      projectId: baubeleg.id,
      title: "Dezimal-Input Bug fixen",
      description: "\"45.5\" wird als 455,00 interpretiert statt 45,50",
      ownerTag: "GENT" as const,
      priority: "HIGH" as const,
      status: "OPEN" as const,
      tags: ["bug"],
    },
    {
      id: "seed-task-baubeleg-staging-test",
      projectId: baubeleg.id,
      title: "Staging-Smoke-Test im Browser",
      description: "https://staging-baubeleg.surfingtigon.com testen, danach /dev done",
      ownerTag: "GENT" as const,
      priority: "HIGH" as const,
      status: "OPEN" as const,
      tags: ["qa"],
    },
    {
      id: "seed-task-baubeleg-resend",
      projectId: baubeleg.id,
      title: "Resend Email-Integration einrichten",
      description: "Letzter offener Punkt der Self-Hosted Migration",
      ownerTag: "GENT" as const,
      priority: "NORMAL" as const,
      status: "OPEN" as const,
      tags: ["integration"],
    },
    // Hurghada Tours
    {
      id: "seed-task-hurghada-stats",
      projectId: hurghadaTours.id,
      title: "Stats-Zahlen durch echte Werte ersetzen",
      description: "UWG §5 — keine erfundenen Zahlen. Echte Werte von Amo Magdy oder Zahlen entfernen.",
      ownerTag: "GENT" as const,
      priority: "URGENT" as const,
      status: "OPEN" as const,
      tags: ["legal", "content"],
    },
    {
      id: "seed-task-hurghada-impressum",
      projectId: hurghadaTours.id,
      title: "Impressum + Datenschutz nachziehen",
      ownerTag: "GENT" as const,
      priority: "HIGH" as const,
      status: "OPEN" as const,
      tags: ["legal"],
    },
    {
      id: "seed-task-hurghada-loom",
      projectId: hurghadaTours.id,
      title: "Loom an Amo Magdy zur Content-Approval",
      ownerTag: "GENT" as const,
      priority: "NORMAL" as const,
      status: "OPEN" as const,
      tags: ["client"],
    },
    // Vasko
    {
      id: "seed-task-vasko-scope",
      projectId: vaskoWebsite.id,
      clientId: vasko.id,
      title: "Scope klaeren: Landing Page / Brand-Seite / Shop?",
      ownerTag: "GENT" as const,
      priority: "NORMAL" as const,
      status: "OPEN" as const,
      tags: ["scope"],
    },
    // Eid / LUMINAR
    {
      id: "seed-task-eid-design",
      projectId: eidWebsite.id,
      clientId: eid.id,
      title: "Design Foundation erstellen",
      ownerTag: "GENT" as const,
      priority: "NORMAL" as const,
      status: "OPEN" as const,
      tags: ["design"],
    },
    // Tigon Website
    {
      id: "seed-task-tigon-maintenance",
      projectId: tigonWebsite.id,
      title: "Website Maintenance — Live auf tigonautomation.de",
      ownerTag: "BEIDE" as const,
      priority: "LOW" as const,
      status: "DONE" as const,
      tags: ["maintenance"],
    },
  ];

  for (const t of tasks) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: {},
      create: t,
    });
  }
  console.log(`  Tasks: ${tasks.length} created`);

  // ═══════════════════════════════════════════════════════════════════
  // LEADS (warm pipeline)
  // ═══════════════════════════════════════════════════════════════════

  const leads = [
    {
      id: "seed-lead-bestattungen-schmid",
      workspaceId: WORKSPACE_ID,
      companyName: "Bestattungen Schmid",
      industry: "Bestattungsunternehmen",
      location: "Rosenheim",
      status: "NEW" as const,
      tier: "TIER_2" as const,
      source: "MANUAL" as const,
      notes: "Research abgeschlossen, kein direkter Kontakt",
    },
    {
      id: "seed-lead-eid",
      workspaceId: WORKSPACE_ID,
      companyName: "LUMINAR Hotelservice",
      industry: "Hotelservice / Einzelunternehmen",
      location: "Baden-Wuerttemberg",
      status: "NEW" as const,
      tier: "TIER_2" as const,
      source: "MANUAL" as const,
      sourceNote: "Kontakt: Herr Eid",
    },
    {
      id: "seed-lead-finsense",
      workspaceId: WORKSPACE_ID,
      companyName: "FinSense GmbH & Co. KG",
      website: "https://finsense.de",
      industry: "Kreditvermittlung / Loan Broker",
      status: "QUALIFIED" as const,
      tier: "TIER_1" as const,
      source: "MANUAL" as const,
      notes: "Recherche abgeschlossen, Prototyp gebaut, noch nicht gezeigt",
    },
    {
      id: "seed-lead-montenegro",
      workspaceId: WORKSPACE_ID,
      companyName: "Montenegro Hotels",
      industry: "Hotellerie",
      location: "Ulcinj, Montenegro",
      status: "NEW" as const,
      tier: "TIER_3" as const,
      source: "REFERRAL" as const,
      sourceNote: "Onkel (Hotelbesitzer)",
      notes: "Recherche abgeschlossen, Prototyp-Build pending",
    },
    {
      id: "seed-lead-vw-rosenheim",
      workspaceId: WORKSPACE_ID,
      companyName: "VW Rosenheim",
      industry: "Autohaus",
      location: "Rosenheim",
      status: "QUALIFIED" as const,
      tier: "TIER_1" as const,
      source: "MANUAL" as const,
      notes: "Prototyp gebaut (Edon), noch nicht gezeigt",
    },
    {
      id: "seed-lead-wmk",
      workspaceId: WORKSPACE_ID,
      companyName: "WMK Architekten",
      industry: "Architektur",
      status: "NEW" as const,
      tier: "TIER_2" as const,
      source: "REFERRAL" as const,
      sourceNote: "Gents Vater (Subunternehmer-Beziehung)",
      notes: "Kontakt gespeichert, Ansatz nach Nachtrag-App-Validierung",
    },
    {
      id: "seed-lead-paricon",
      workspaceId: WORKSPACE_ID,
      companyName: "paricon AG",
      industry: "IT-Dienstleistung",
      status: "NEW" as const,
      tier: "TIER_3" as const,
      source: "REFERRAL" as const,
      sourceNote: "Freund (Angestellter)",
      notes: "Networking Node — kein direkter Business Case",
    },
  ];

  for (const l of leads) {
    await prisma.lead.upsert({
      where: { id: l.id },
      update: {},
      create: l,
    });
  }
  console.log(`  Leads: ${leads.length} created`);

  // ═══════════════════════════════════════════════════════════════════
  // LEAD CONTACTS
  // ═══════════════════════════════════════════════════════════════════

  await prisma.contactPerson.upsert({
    where: { id: "seed-contact-eid" },
    update: {},
    create: {
      id: "seed-contact-eid",
      workspaceId: WORKSPACE_ID,
      leadId: "seed-lead-eid",
      name: "Herr Eid",
      role: "Inhaber",
      isPrimary: true,
    },
  });

  // ═══════════════════════════════════════════════════════════════════
  // KNOWLEDGE ENTRIES
  // ═══════════════════════════════════════════════════════════════════

  const entries = [
    {
      id: "seed-entry-odoo-decision",
      workspaceId: WORKSPACE_ID,
      projectId: crmMigration.id,
      clientId: fachwelt.id,
      authorId: GENT_ID,
      title: "Odoo Cloud statt On-Premise",
      content: "Entscheidung 2026-04-10: Odoo Cloud (Standard, 15 EUR/User/Monat). API-Zugang (XML-RPC) bestaetigt im Standard-Plan. Module: CRM + Kontakte.",
      category: "IDEA" as const,
      tags: ["decision", "odoo"],
    },
    {
      id: "seed-entry-historische-daten",
      workspaceId: WORKSPACE_ID,
      projectId: crmMigration.id,
      clientId: fachwelt.id,
      authorId: GENT_ID,
      title: "Historische Daten ignorieren",
      content: "Entscheidung 2026-04-08: Historische Transaktionsdaten aus Access NICHT migrieren. Ab sofort neu in Odoo erfassen. Nur Stammdaten (Firmen + Kontakte) uebernehmen.",
      category: "IDEA" as const,
      tags: ["decision", "migration"],
    },
    {
      id: "seed-entry-marketplace-feedback",
      workspaceId: WORKSPACE_ID,
      projectId: marketplace.id,
      clientId: fachwelt.id,
      authorId: GENT_ID,
      title: "Meeting-Feedback 2026-04-08",
      content: "Bilddarstellung Fehler beheben. Design modern/schlicht. 'Industry Business' Branding prominent. Filter wie mobile.de. 'Leute kauften auch' Feature. KI-Assistent fuer Kompatibilitaetspruefung. Inspirationen: Thomas for Industry (US), Alibaba (Bildsuche). Logos von Daniel noetig.",
      category: "MEETING_NOTE" as const,
      meetingAt: new Date("2026-04-08"),
      tags: ["feedback", "design"],
    },
    {
      id: "seed-entry-horbach-revenue",
      workspaceId: WORKSPACE_ID,
      projectId: horbachAutomation.id,
      clientId: horbach.id,
      authorId: GENT_ID,
      title: "Revenue-Modell Horbach",
      content: "Solo: 39 EUR/Monat. Team: 199 EUR/Monat. Max: 350 Berater x 39 EUR = 13.650 EUR MRR aus einem Buero. Strategie: PoC fuer Marlons Team (5-10 Leute) → 2 Wochen Testlauf → Management-Pitch → Office-Rollout.",
      category: "INSIGHT" as const,
      tags: ["revenue", "strategy"],
    },
  ];

  for (const e of entries) {
    await prisma.knowledgeEntry.upsert({
      where: { id: e.id },
      update: {},
      create: e,
    });
  }
  console.log(`  Knowledge Entries: ${entries.length} created`);

  // ═══════════════════════════════════════════════════════════════════
  // IMPULSES (from client user)
  // ═══════════════════════════════════════════════════════════════════

  const impulses = [
    {
      id: "seed-impulse-bilder",
      projectId: marketplace.id,
      authorId: alijaUser.id,
      type: "FEEDBACK" as const,
      title: "Bilder werden nicht richtig angezeigt",
      content: "Die Produktbilder auf der Startseite werden abgeschnitten und sind nicht zentriert. Bitte fixen.",
      status: "SEEN" as const,
      priority: "HIGH" as const,
    },
    {
      id: "seed-impulse-filter",
      projectId: marketplace.id,
      authorId: alijaUser.id,
      type: "IDEA" as const,
      title: "Filter wie bei mobile.de",
      content: "Koennt ihr die Filter so machen wie bei mobile.de? Seitenleiste mit Kategorien, Preisrange, Hersteller. Das ist fuer unsere Kunden am intuitivsten.",
      status: "ACCEPTED" as const,
      priority: "NORMAL" as const,
    },
    {
      id: "seed-impulse-ki-assistent",
      projectId: marketplace.id,
      authorId: alijaUser.id,
      type: "IDEA" as const,
      title: "KI-Kompatibilitaetspruefung",
      content: "Waere es moeglich einen KI-Assistenten einzubauen der pruefen kann ob z.B. ein Motor zu einer bestimmten Steuerung passt? Das waere ein echtes Alleinstellungsmerkmal.",
      status: "NEW" as const,
      priority: "LOW" as const,
    },
  ];

  for (const imp of impulses) {
    await prisma.impulse.upsert({
      where: { id: imp.id },
      update: {},
      create: imp,
    });
  }
  console.log(`  Impulses: ${impulses.length} created`);

  // ═══════════════════════════════════════════════════════════════════
  // SERVERS
  // ═══════════════════════════════════════════════════════════════════

  const servers = [
    {
      id: "seed-server-hetzner",
      workspaceId: WORKSPACE_ID,
      name: "Hetzner VPS (Coolify)",
      provider: "Hetzner",
      status: "ONLINE" as const,
      monthlyCostCents: 2000,
      statusNote: "Coolify Host — alle Self-Hosted Projekte",
    },
    {
      id: "seed-server-habit",
      workspaceId: WORKSPACE_ID,
      name: "HABIT Server",
      provider: "HP Pavilion (Self-Hosted)",
      ip: "100.64.0.1",
      status: "ONLINE" as const,
      statusNote: "Dev Server, Tailscale: habit. Ubuntu 24.04 LTS, Intel Ultra 7 155H, 32GB RAM, 475GB SSD",
    },
    {
      id: "seed-server-minio",
      workspaceId: WORKSPACE_ID,
      name: "MinIO Object Storage",
      provider: "Coolify (Hetzner)",
      url: "https://minio.surfingtigon.com",
      status: "ONLINE" as const,
      statusNote: "Buckets: baubeleg-fotos, baubeleg-dokumente",
      projectId: baubeleg.id,
    },
  ];

  for (const s of servers) {
    await prisma.server.upsert({
      where: { id: s.id },
      update: {},
      create: s,
    });
  }
  console.log(`  Servers: ${servers.length} created`);

  // ═══════════════════════════════════════════════════════════════════
  // EXPENSES (recurring costs)
  // ═══════════════════════════════════════════════════════════════════

  const expenses = [
    {
      id: "seed-expense-hetzner",
      workspaceId: WORKSPACE_ID,
      name: "Hetzner VPS",
      category: "HOSTING" as const,
      vendor: "Hetzner",
      amountCents: 2000,
      frequency: "MONTHLY" as const,
      startedAt: new Date("2026-03-01"),
    },
    {
      id: "seed-expense-anthropic",
      workspaceId: WORKSPACE_ID,
      name: "Anthropic API (Claude)",
      category: "AI_TOOLING" as const,
      vendor: "Anthropic",
      amountCents: 10000,
      frequency: "MONTHLY" as const,
      startedAt: new Date("2026-01-01"),
      notes: "Claude Code + API usage",
    },
    {
      id: "seed-expense-n8n",
      workspaceId: WORKSPACE_ID,
      name: "n8n Cloud",
      category: "SAAS" as const,
      vendor: "n8n GmbH",
      amountCents: 2400,
      frequency: "MONTHLY" as const,
      startedAt: new Date("2026-02-01"),
    },
    {
      id: "seed-expense-vercel",
      workspaceId: WORKSPACE_ID,
      name: "Vercel Pro",
      category: "HOSTING" as const,
      vendor: "Vercel",
      amountCents: 2000,
      frequency: "MONTHLY" as const,
      startedAt: new Date("2026-03-01"),
      notes: "Fachwelt Projekte",
    },
    {
      id: "seed-expense-supabase",
      workspaceId: WORKSPACE_ID,
      name: "Supabase Pro",
      category: "HOSTING" as const,
      vendor: "Supabase",
      amountCents: 2500,
      frequency: "MONTHLY" as const,
      startedAt: new Date("2026-02-01"),
      notes: "Fachwelt Redaktion + Marketplace",
    },
    {
      id: "seed-expense-domains",
      workspaceId: WORKSPACE_ID,
      name: "Domains (tigonautomation.de, baubeleg.de, surfingtigon.com)",
      category: "DOMAIN" as const,
      vendor: "Diverse",
      amountCents: 5000,
      frequency: "YEARLY" as const,
      startedAt: new Date("2026-01-01"),
    },
    {
      id: "seed-expense-github",
      workspaceId: WORKSPACE_ID,
      name: "GitHub Pro",
      category: "SAAS" as const,
      vendor: "GitHub",
      amountCents: 400,
      frequency: "MONTHLY" as const,
      startedAt: new Date("2026-01-01"),
    },
    {
      id: "seed-expense-minio",
      workspaceId: WORKSPACE_ID,
      name: "MinIO (Self-Hosted auf Coolify)",
      category: "INFRASTRUCTURE" as const,
      vendor: "Self-Hosted",
      amountCents: 0,
      frequency: "MONTHLY" as const,
      startedAt: new Date("2026-04-01"),
      notes: "Laeuft auf Hetzner VPS — minio.surfingtigon.com. Buckets: baubeleg-fotos, baubeleg-dokumente",
    },
  ];

  for (const ex of expenses) {
    await prisma.expense.upsert({
      where: { id: ex.id },
      update: {},
      create: ex,
    });
  }
  console.log(`  Expenses: ${expenses.length} created`);

  // ═══════════════════════════════════════════════════════════════════
  // PIPELINE ESTIMATES
  // ═══════════════════════════════════════════════════════════════════

  const estimates = [
    {
      id: "seed-est-horbach-poc",
      workspaceId: WORKSPACE_ID,
      clientId: horbach.id,
      projectId: horbachAutomation.id,
      title: "Horbach PoC → Office-Rollout",
      estimateMinCents: 500000,
      estimateMaxCents: 1500000,
      probabilityPct: 40,
      stage: "IN_CONVERSATION" as const,
      notes: "PoC erst, dann 350 Berater x 39 EUR/Monat MRR Potential",
    },
    {
      id: "seed-est-finsense",
      workspaceId: WORKSPACE_ID,
      leadId: "seed-lead-finsense",
      title: "FinSense Automation",
      estimateMinCents: 300000,
      estimateMaxCents: 800000,
      probabilityPct: 25,
      stage: "QUALIFIED" as const,
      notes: "Prototyp gebaut, noch nicht gezeigt",
    },
    {
      id: "seed-est-vw",
      workspaceId: WORKSPACE_ID,
      leadId: "seed-lead-vw-rosenheim",
      title: "VW Rosenheim Digitalisierung",
      estimateMinCents: 200000,
      estimateMaxCents: 500000,
      probabilityPct: 20,
      stage: "QUALIFIED" as const,
      notes: "Prototyp gebaut (Edon), noch nicht gezeigt",
    },
  ];

  for (const est of estimates) {
    await prisma.pipelineEstimate.upsert({
      where: { id: est.id },
      update: {},
      create: est,
    });
  }
  console.log(`  Pipeline Estimates: ${estimates.length} created`);

  // ═══════════════════════════════════════════════════════════════════
  // ACTIVITIES (recent timeline)
  // ═══════════════════════════════════════════════════════════════════

  const activities = [
    {
      id: "seed-act-fachwelt-meeting",
      workspaceId: WORKSPACE_ID,
      actorId: GENT_ID,
      kind: "MEETING" as const,
      channel: "MEETING_ONLINE" as const,
      direction: "OUTBOUND" as const,
      clientId: fachwelt.id,
      contactId: alija.id,
      subject: "Marketplace Feedback + CRM-Migration Kickoff",
      summary: "Bilddarstellung fixen, Filter wie mobile.de, Design-Brainstorming planen. CRM: Access → CSV → Odoo. Historische Daten ignorieren.",
      occurredAt: new Date("2026-04-08T11:00:00"),
      durationMinutes: 60,
    },
    {
      id: "seed-act-horbach-meeting",
      workspaceId: WORKSPACE_ID,
      actorId: GENT_ID,
      kind: "MEETING" as const,
      channel: "MEETING_OFFLINE" as const,
      direction: "OUTBOUND" as const,
      clientId: horbach.id,
      contactId: marlon.id,
      subject: "Erstgespraech Automation-Suite",
      summary: "HubSpot ↔ Outlook Kernfluss besprochen. PoC fuer 5-10 Leute, dann Office-Rollout. Warte auf API-Zugang.",
      occurredAt: new Date("2026-04-08T14:00:00"),
      durationMinutes: 45,
    },
    {
      id: "seed-act-portal-tests",
      workspaceId: WORKSPACE_ID,
      actorId: GENT_ID,
      kind: "MILESTONE_REACHED" as const,
      projectId: clientPortal.id,
      subject: "Tenant-Isolation Tests bestanden",
      summary: "58 Integration-Tests beweisen korrekte Workspace-Isolation aller API-Endpoints. PR #10 gemergt.",
      occurredAt: new Date("2026-04-16T10:00:00"),
    },
    {
      id: "seed-act-crm-decision",
      workspaceId: WORKSPACE_ID,
      actorId: GENT_ID,
      kind: "NOTE" as const,
      clientId: fachwelt.id,
      projectId: crmMigration.id,
      subject: "Odoo Cloud entschieden",
      summary: "Standard-Plan (15 EUR/User/Monat), XML-RPC API verfuegbar. Keine historischen Daten migrieren.",
      occurredAt: new Date("2026-04-10T11:00:00"),
    },
  ];

  for (const act of activities) {
    await prisma.activity.upsert({
      where: { id: act.id },
      update: {},
      create: act,
    });
  }
  console.log(`  Activities: ${activities.length} created`);

  // ═══════════════════════════════════════════════════════════════════
  // DECISIONS
  // ═══════════════════════════════════════════════════════════════════

  const decisions = [
    {
      id: "seed-decision-odoo",
      workspaceId: WORKSPACE_ID,
      projectId: crmMigration.id,
      authorId: GENT_ID,
      title: "CRM: Odoo Cloud statt On-Premise oder anderes Tool",
      context: "Fachwelt braucht CRM fuer Firmen + Kontakte. Access (lokal, keine API) muss abgeloest werden.",
      decision: "Odoo Cloud Standard (15 EUR/User/Monat). XML-RPC API im Standard-Plan.",
      alternatives: "HubSpot Free (zu limitiert), Pipedrive (zu teuer fuer den Scope), Self-hosted Odoo (Wartungsaufwand)",
      consequences: "Monatliche Kosten, aber API-Zugang und sofortige Verfuegbarkeit. Kein Self-Hosting-Overhead.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-04-10"),
      tags: ["crm", "fachwelt"],
    },
    {
      id: "seed-decision-no-history",
      workspaceId: WORKSPACE_ID,
      projectId: crmMigration.id,
      authorId: GENT_ID,
      title: "Historische Daten nicht migrieren",
      context: "Access-DB enthaelt Firmen, Kontakte, Rechnungen, Korrespondenz. Migration komplett waere komplex.",
      decision: "Nur Stammdaten (Firmen + Kontakte) migrieren. Ab sofort neu in Odoo erfassen.",
      alternatives: "Alles migrieren (zu aufwaendig, Datenqualitaet fragwuerdig)",
      consequences: "Historische Rechnungen/Korrespondenz nur noch in Access nachschlagbar. Sauberer Neustart in Odoo.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-04-08"),
      tags: ["migration", "fachwelt"],
    },
  ];

  for (const d of decisions) {
    await prisma.decision.upsert({
      where: { id: d.id },
      update: {},
      create: d,
    });
  }
  console.log(`  Decisions: ${decisions.length} created`);

  // ═══════════════════════════════════════════════════════════════════
  // WORKSPACE UPDATE (description, objective, techStack, MRR, burn)
  // ═══════════════════════════════════════════════════════════════════

  await prisma.workspace.update({
    where: { id: WORKSPACE_ID },
    data: {
      description: "AI-gestützte Softwareentwicklung und Automatisierung für deutsche KMUs. Produktionsreife Software in 72 Stunden. Festpreis €3.000–10.000. DSGVO-konform. Förderfähig.",
      objective: "€50.000 Umsatz bis Ende Juni 2026. Fachweltverlag als Anker-Kunde ausbauen (3 Projekte), parallel neue Vertikalen erschliessen. Milestone: €20.000 → UG/GmbH Transition.",
      techStack: ["Next.js", "TypeScript", "Tailwind CSS", "PostgreSQL", "Prisma", "n8n", "Coolify", "Hetzner VPS", "Claude", "Anthropic API", "MinIO"],
      mrrCents: 0,
      burnRateCents: 19000,
    },
  });
  console.log("  Workspace: updated (description, objective, techStack, MRR, burn)");

  // ═══════════════════════════════════════════════════════════════════
  // TIGON OPERATIONS — Container project for business-level tasks
  // ═══════════════════════════════════════════════════════════════════

  const tigonOps = await prisma.project.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "tigon-operations" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      name: "Tigon Operations",
      slug: "tigon-operations",
      description: "Container-Projekt fuer firmenuebergreifende Tasks, Journal-Eintraege und Initiativen die keinem spezifischen Kundenprojekt zugeordnet sind.",
      status: "ACTIVE",
      type: "INTERNAL",
      health: "GREEN",
      phase: "Ongoing",
      areas: ["Business", "Outreach", "Infrastruktur", "Legal", "Zertifikate"],
    },
  });
  console.log(`  Project: ${tigonOps.name} (container for business tasks)`);

  // ═══════════════════════════════════════════════════════════════════
  // NETWORK CONTACTS (no clientId/leadId)
  // ═══════════════════════════════════════════════════════════════════

  const networkContacts = [
    {
      id: "seed-contact-edon-bruder",
      workspaceId: WORKSPACE_ID,
      name: "Edon's Bruder",
      role: "Heizungs- und Wasserinstallateur (SHK)",
      notes: "Angestellt. Viele Freunde im selben Gewerk. Einstiegspunkt fuer SHK-Vertikale. Verknuepfung: Nachtrag-App Multi-Trade.",
    },
    {
      id: "seed-contact-gent-vater",
      workspaceId: WORKSPACE_ID,
      name: "Gent's Vater",
      role: "Firmenchef — Bodenbelagsarbeiten (Grossprojekte mit GUs/Architekten)",
      notes: "Erster Design-Partner + Testnutzer fuer BauBeleg/Nachtrag-App. Albanisches Contractor-Netzwerk (~700-800K). Arbeitet als Sub fuer WMK Architekten.",
    },
    {
      id: "seed-contact-alb-network",
      workspaceId: WORKSPACE_ID,
      name: "Albanisches Contractor-Netzwerk",
      role: "Community / Distribution Channel",
      notes: "~740K ethnische Albaner in DE, Bau = #1. WhatsApp-Gruppen, Trust-basiertes Referral. 20-30 albanische Bodenleger die adoptieren = kostenlose Referral-Engine. Struktureller Vertriebsvorteil.",
    },
    {
      id: "seed-contact-clemens",
      workspaceId: WORKSPACE_ID,
      name: "Clemens",
      role: "Ehemaliger Steuerberater / Investmentbanker",
      notes: "Strategischer Kontakt von Edon. Einblick in StB-Prozesse, Kontakte zu Kanzleien, Partnership-Potenzial (Revenue-Split). Demo geschickt.",
    },
    {
      id: "seed-contact-kujtim",
      workspaceId: WORKSPACE_ID,
      name: "Kujtim",
      role: "SAP-Berater bei paricon AG, Rosenheim",
      notes: "Bekannter von Edon. SAP-Kunden = Mittelstand mit Budget. Partnership-Potenzial. Nachricht noch nicht raus (Stand 2026-03-29).",
    },
    {
      id: "seed-contact-umut",
      workspaceId: WORKSPACE_ID,
      name: "Umut",
      role: "Mitarbeiter bei DU Diederichs & Partner GmbH, Puchheim",
      notes: "Freund von Edon. Firma: Projektmanagement Bau/Anlagenbau, 20+ MA. Notable: Terminal 2 Muenchen. Website-Prototyp geschickt, extrem positives Feedback. Pipeline 40%.",
    },
    {
      id: "seed-contact-alex-zoll",
      workspaceId: WORKSPACE_ID,
      name: "Alex",
      role: "Zollbeamter, Hauptzollamt Rosenheim",
      notes: "GEPARKT. Freund von Edon. Bundesbehoerde, IT zentral (ITZBund), formale Vergabe. Reaktivieren bei 3+ Case Studies + IT-Haftpflicht.",
    },
    {
      id: "seed-contact-david-vater",
      workspaceId: WORKSPACE_ID,
      name: "David Vater",
      role: "Firmenchef — Wohnungssanierung (Baeder, Fliesen, Renovierung)",
      notes: "Ueber Davids Sohn (Freund von Edon). Russischsprachig. Design-Partner fuer BauBeleg. Pain Points: Mitarbeiter-Tracking, Material-Doku, Sprachbarriere. Testcase fuer i18n + Voice.",
    },
    {
      id: "seed-contact-th-rosenheim",
      workspaceId: WORKSPACE_ID,
      name: "TH Rosenheim",
      role: "Hochschule",
      notes: "GEPARKT. Edon ist Student. TYPO3, HISinOne, Moodle 4.x, 6+ Portale. Einziger Einstieg: Innovation Lab oder KI-Chatbot (€5-10K). Oeffentliche Vergabe, 3-6 Mo Sales Cycle.",
    },
  ];

  for (const nc of networkContacts) {
    await prisma.contactPerson.upsert({
      where: { id: nc.id },
      update: {},
      create: nc,
    });
  }
  console.log(`  Network Contacts: ${networkContacts.length} created`);

  // ═══════════════════════════════════════════════════════════════════
  // ALL DECISIONS from ~/tigon/decisions.md (27 decisions)
  // ═══════════════════════════════════════════════════════════════════

  const allDecisions = [
    {
      id: "seed-dec-supabase-raus",
      workspaceId: WORKSPACE_ID,
      authorId: GENT_ID,
      title: "Supabase raus — Self-Hosted Native Stack als Standard",
      context: "Supabase nimmt mehr als es gibt bei Custom-Projekten. Multi-Tenant, Custom Auth, DSGVO — alles einfacher ohne BaaS.",
      decision: "Neuer Default: Auth bcryptjs+jose, PostgreSQL 17 auf Coolify, Prisma/Drizzle, MinIO, Resend/Nodemailer. Alles self-hosted auf Hetzner VPS. Eine PG+MinIO Instanz fuer alle Projekte.",
      alternatives: "Auth.js (Blackbox bei Custom), jsonwebtoken (nicht Edge-kompatibel), Drizzle als Pflicht (unnoetige Migration bestehender Projekte)",
      consequences: "0€ extra, volle Datenkontrolle, EU-konform. Spart ~1.5GB RAM pro Projekt vs. separate Supabase-Instanzen.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-04-06"),
      tags: ["stack", "infrastructure"],
    },
    {
      id: "seed-dec-baubeleg-content",
      workspaceId: WORKSPACE_ID,
      projectId: baubeleg.id,
      authorId: GENT_ID,
      title: "BauBeleg Content Strategy — BauBeleg Only, Tigon Outreach Only",
      context: "Kein deutsches Bau-SaaS macht Content Marketing auf Social. First-Mover-Gap.",
      decision: "Content NUR fuer BauBeleg: Facebook Groups (PRIMARY, 57% Handwerker), Instagram (3 Posts/Woche), TikTok (Cross-Post). KI-Avatare fuer Tigon KILLED. Tigon = Outreach only bis €10-15K MRR.",
      alternatives: "KI-Avatare fuer Tigon (erkennbar, schadet Vertrauen), persoenlicher Content sofort (keine Credibility)",
      consequences: "First-Mover-Advantage in Bau-SaaS Social. Kein Tigon-Content bis MRR-Target.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-04-04"),
      tags: ["content", "baubeleg", "marketing"],
    },
    {
      id: "seed-dec-dev-skill-hardening",
      workspaceId: WORKSPACE_ID,
      authorId: GENT_ID,
      title: "/dev Skill Security Hardening + Staging-Modell",
      context: "GbR-Haftung macht Security-Gaps in Kundenprojekten inakzeptabel.",
      decision: "6 Security-Fixes: kein blindes git add -A, dotenv-cli, prisma migrate deploy statt db push, Quality Gate vor Commit, Schema-Detection gegen Branch, CI-Checks als hartes Gate. Eine Staging-Instanz pro Projekt.",
      alternatives: "Staging-Branch (zu viel Overhead), Coolify Preview als Default (unnoetige Komplexitaet)",
      consequences: "Industrie-Standard Security. Kein Secret-Leak-Risiko durch git add -A.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-04-03"),
      tags: ["security", "dev-workflow"],
    },
    {
      id: "seed-dec-drei-zonen",
      workspaceId: WORKSPACE_ID,
      authorId: GENT_ID,
      title: "Architektur-Konsolidierung v3 — Finale Drei-Zonen-Architektur",
      context: "Vorherige Migrationen (v1, v2) liessen Inkonsistenzen: ~/tigon/projects/ mit Duplikaten, Git-Ops auf Syncthing-Ordner.",
      decision: "~/vault/ (persoenlich), ~/tigon/ (shared Business, Syncthing), ~/projects/ (Code + Doku, Git). ~/tigon/projects/ eliminiert. docs/ideas.md Pflicht in jedem Repo.",
      alternatives: "CONTEXT.md + HANDOFF.md pro Projekt in ~/tigon/projects/ (trennt Doku vom Code, drittes Modell)",
      consequences: "Clean-Sheet. Keine Ambiguitaeten mehr zwischen Sync-Methoden.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-03-30"),
      tags: ["architecture", "infrastructure"],
    },
    {
      id: "seed-dec-ai-autonomy",
      workspaceId: WORKSPACE_ID,
      authorId: GENT_ID,
      title: "AI Autonomy Compass for Client Work",
      context: "GbR = unlimited personal liability. Efficiency gain real for dev, but production risk unacceptable.",
      decision: "Dev/Staging = full autonomy. Production = human-in-the-loop ALWAYS. Claude proposes, human confirms. DSGVO: DPA chain required (Client→Tigon AVV→Anthropic DPA).",
      alternatives: "Full autonomy everywhere (too risky), full human-in-the-loop everywhere (too slow)",
      consequences: "Speed in dev, safety in prod. Per-client DSGVO chain before starting work.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-03-18"),
      tags: ["governance", "dsgvo", "security"],
    },
    {
      id: "seed-dec-jarvis-to-jarvis",
      workspaceId: WORKSPACE_ID,
      authorId: GENT_ID,
      title: "Jarvis-to-Jarvis Communication Model",
      context: "Two Claude instances for two co-founders need structured communication.",
      decision: "Shared ~/tigon/ folder via Syncthing + passive shared-insights drop folder. No autonomous cross-pollination. Brain dump routing auto-detects Tigon-relevant items.",
      alternatives: "Autonomous push between instances (too risky, no context)",
      consequences: "Structured async communication. No surprise overwrites.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-03-18"),
      tags: ["collaboration", "infrastructure"],
    },
    {
      id: "seed-dec-dsgvo-two-tier",
      workspaceId: WORKSPACE_ID,
      authorId: GENT_ID,
      title: "Two-Tier DSGVO Architecture",
      context: "Claude Max = consumer tier = no DPA. But most dev work has zero PII.",
      decision: "Claude Max for dev (no PII). PII via n8n Cloud (Anthropic API node, DPA) or Claude Code with API key (commercial tier). Three compliant paths for PII.",
      alternatives: "Always use API key (expensive), always use Ollama (slow)",
      consequences: "Clean separation. Most work stays on Max, PII work goes through DPA-covered channels.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-03-18"),
      tags: ["dsgvo", "compliance"],
    },
    {
      id: "seed-dec-security-incident-public-repo",
      workspaceId: WORKSPACE_ID,
      authorId: GENT_ID,
      title: "Security Incident — fachwelt-marketplace als Public Repo erstellt",
      context: "edonmurati/fachwelt-marketplace war public. Source code, Schema, Admin-Routes sichtbar. Keine Credentials exponiert.",
      decision: "Repo auf private gesetzt. Prevention: GitHub default → Private, alle Tigon-Repos MUST be private, --private Flag Pflicht bei gh repo create.",
      alternatives: "N/A — Incident Response",
      consequences: "Kein Schaden (0 forks/clones, same-day catch). Neue Pflicht-Checks.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-03-18"),
      tags: ["security", "incident"],
    },
    {
      id: "seed-dec-infra-docs",
      workspaceId: WORKSPACE_ID,
      authorId: GENT_ID,
      title: "Infrastructure Documentation in tigon/infra/",
      context: "Technische Infra-Details (VPS-Specs, was laeuft wo, Domain-Routing) waren nirgends dokumentiert.",
      decision: "Neuer Ordner tigon/infra/: stack.md, services.md, domains.md, access.md. Credentials bleiben in Projekt-Ordnern.",
      alternatives: "Alles in einem File (zu lang), in CLAUDE.md (zu technisch)",
      consequences: "Zentrale Referenz fuer beide Partner. Getrennt von Business-Docs.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-03-23"),
      tags: ["infrastructure", "documentation"],
    },
    {
      id: "seed-dec-git-workflow-vps",
      workspaceId: WORKSPACE_ID,
      authorId: GENT_ID,
      title: "Git-Workflow auf geteiltem VPS",
      context: "Beide Partner arbeiten auf dem gleichen VPS. Globale Git-Config wuerde ueberschreiben.",
      decision: "Per-Repo lokale Git-Config statt globaler Config. Gent: gent.cungu@tigonautomation.de.",
      alternatives: "Globale Config (wuerde letzten ueberschreiben)",
      consequences: "Commits korrekt zugeordnet. Muss auf per-Repo umgestellt werden wenn Edon vom VPS committed.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-03-23"),
      tags: ["git", "collaboration"],
    },
    {
      id: "seed-dec-syncthing-tigon",
      workspaceId: WORKSPACE_ID,
      authorId: GENT_ID,
      title: "Git-Remote entfernt, Syncthing als Sync fuer ~/tigon/",
      context: "Git-Sync fuer Doku-Repo zwischen 2 Leuten war Overkill.",
      decision: "Git komplett entfernt (.git/ geloescht). Syncthing fuer Echtzeit-Sync. ~/projects/ bleibt Git-basiert.",
      alternatives: "Git weiter nutzen (Commits, Merge-Konflikte, Hooks = Overhead)",
      consequences: "Bidirektional, sofort, ohne manuelle Schritte.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-03-30"),
      tags: ["infrastructure", "sync"],
    },
    {
      id: "seed-dec-crm-ordner",
      workspaceId: WORKSPACE_ID,
      authorId: GENT_ID,
      title: "CRM-Ordnerstruktur in kunden/",
      context: "Kontakt-Infos ueber 3 Dateien verstreut. Suche nach 'was wissen wir ueber X' erforderte 3 Files.",
      decision: "kunden/ als Ordner-CRM: cold/ → warm/ → active/ → pro-bono/. Pro Kunde: overview.md, ideas.md, credentials.md. Stage-Wechsel = mv. Netzwerk-Kontakte → netzwerk.md.",
      alternatives: "CRM-Tool (Overkill bei <10 Leads)",
      consequences: "Pipeline-Status sofort sichtbar. Alles zu einem Kunden in einem Ordner.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-03-28"),
      tags: ["crm", "organization"],
    },
    {
      id: "seed-dec-architecture-governance",
      workspaceId: WORKSPACE_ID,
      authorId: GENT_ID,
      title: "Architecture Governance — Strukturaenderungen nur durch Gent",
      context: "Zwei Claude-Instanzen die unabhaengig Strukturaenderungen vornehmen = Drift + kaputte Pfade.",
      decision: "~/tigon/ Ordnerstruktur nur von Gent aenderbar. Edon: Inhalte bearbeiten, Dateien innerhalb bestehender Ordner, shared-insights droppen, Stage-Wechsel, decisions.md appenden — ja. Ordner/Skills/CLAUDE.md-Struktur — nein.",
      alternatives: "Beide duerfen alles (Drift-Risiko), strikte Review (zu langsam)",
      consequences: "Einer fuehrt Architektur, einer kann Inhalte frei bearbeiten.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-03-28"),
      tags: ["governance", "collaboration"],
    },
    {
      id: "seed-dec-skills-architecture",
      workspaceId: WORKSPACE_ID,
      authorId: GENT_ID,
      title: "Skills-Architektur — Single Source of Truth",
      context: "Skills waren an 2 Orten identisch (28 Duplikate). 3 abweichende Namen, 4 inhaltliche Divergenzen.",
      decision: "Business/Web-Skills NUR in ~/tigon/.claude/skills/. Persoenliche Skills NUR in ~/.claude/skills/. 28 Duplikate geloescht, 3 Namen vereinheitlicht, 4 divergierte Skills gemerged.",
      alternatives: "Beide Orte beibehalten (Drift garantiert)",
      consequences: "Eine Kopie pro Skill. Keine manuelle Synchronisation noetig.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-03-28"),
      tags: ["skills", "architecture"],
    },
    {
      id: "seed-dec-tigon-status-parked",
      workspaceId: WORKSPACE_ID,
      authorId: GENT_ID,
      title: "Tigon Status Correction — PARKED (not KILLED)",
      context: "Previous 'kill' decision was premature. Business model may have legs once primary revenue established.",
      decision: "Tigon corrected from KILLED to PARKED. Blocked from active work but not dead. Reactivation at MRR target.",
      alternatives: "Keep as KILLED (too permanent for uncertain situation)",
      consequences: "Tigon remains available for reactivation.",
      status: "SUPERSEDED" as const,
      decidedAt: new Date("2026-03-17"),
      tags: ["strategy", "status"],
    },
    {
      id: "seed-dec-tigon-reactivated",
      workspaceId: WORKSPACE_ID,
      authorId: GENT_ID,
      title: "Tigon Reactivated — Fachwelt Deal = Fast Revenue",
      context: "Fachwelt Verlag fixed-price deal is contracted revenue ready to execute.",
      decision: "Tigon fully reactivated as active project #2. Fachwelt B2B marketplace + WebMag replacement. 2 of 3 project slots used.",
      alternatives: "Stay parked (would miss contracted revenue)",
      consequences: "Fastest path to revenue vs. building content engines from scratch.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-03-17"),
      tags: ["strategy", "activation"],
    },
    {
      id: "seed-dec-show-first",
      workspaceId: WORKSPACE_ID,
      authorId: GENT_ID,
      title: "Tigon Client Acquisition — Show-First Strategy",
      context: "Proved with Fachwelt that a full app can be built in a day. Network has zero technical sophistication.",
      decision: "Research contact's market → build prototype → walk in and show. Personal connections = potential clients. Montenegro, FinSense, Paricon, Construction network.",
      alternatives: "Traditional outreach first (slower, less trust)",
      consequences: "Immediate revenue potential. No audience building needed.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-03-18"),
      tags: ["strategy", "sales"],
    },
    {
      id: "seed-dec-team-plan-upgrade",
      workspaceId: WORKSPACE_ID,
      authorId: GENT_ID,
      title: "Team Plan Upgrade — Trigger on First Client Revenue",
      context: "Max plan = consumer tier = no DPA = DSGVO violation for client PII.",
      decision: "Upgrade to Claude Team plan (2 Premium + 3 Standard, ~€286/Mo) on first client revenue. Team plan includes DPA.",
      alternatives: "Upgrade now (cost before revenue), stay on Max (DSGVO violation with PII)",
      consequences: "+~€100/Mo delta. Unlocks all client PII work in Claude Code.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-03-18"),
      tags: ["infrastructure", "dsgvo", "costs"],
    },
    {
      id: "seed-dec-nachtrag-saas",
      workspaceId: WORKSPACE_ID,
      projectId: baubeleg.id,
      authorId: GENT_ID,
      title: "Nachtrag-App als SaaS-Produkt, nicht Kundenprojekt",
      context: "9 Branchen gescannt, 5 Subagenten. Score 8.25/10 — hoechster aller Kandidaten.",
      decision: "SaaS fuer 70.000-120.000 deutsche Subunternehmer. E-Rechnung als kostenlosen Hook, Nachtrag-Doku als Kern (€29-49/Mo). Albanische WhatsApp-Netzwerke als Distribution.",
      alternatives: "Pflegedienste (6.75/10), AI Ecosystem (4.80/10 — getoetet)",
      consequences: "Marktluecke komplett unbesetzt. Ein geretteter Nachtrag (€3K) = 5+ Jahre ROI.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-03-19"),
      tags: ["product", "baubeleg", "strategy"],
    },
    {
      id: "seed-dec-website-relaunch",
      workspaceId: WORKSPACE_ID,
      projectId: tigonWebsite.id,
      authorId: GENT_ID,
      title: "Tigon Website Relaunch — New Positioning + Next.js",
      context: "CEO Brief confirmed €3-10K fixed-price slot empty in Germany. Lovable had SEO issues.",
      decision: "Migrated Lovable → Next.js SSR. Positioning: '72h, Festpreis €3K-10K, DSGVO, Foerderfaehig'. Comparison table, BAFA section.",
      alternatives: "Keep Lovable (no SSR, branding issues, 404 Impressum)",
      consequences: "Data-backed positioning. SEO-ready. Deployed on Vercel (later migrated to Coolify).",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-03-19"),
      tags: ["website", "positioning"],
    },
    {
      id: "seed-dec-stb-vertikale",
      workspaceId: WORKSPACE_ID,
      authorId: GENT_ID,
      title: "Steuerberater als erste Cold-Outreach-Vertikale",
      context: "CEO-Analyse: 7 Vertikalen, 6 Kriterien. Bestatter 25/60, Steuerberater 53/60.",
      decision: "53.000 Kanzleien, 70% ohne brauchbare Website, €220K+ Umsatz, Inhaber entscheidet allein. Barrierefreiheitspflicht als Forcing Function.",
      alternatives: "Bestatter (25/60 — kein Schmerz), Handwerk (26/60)",
      consequences: "Template skaliert 1:1 auf alle 53.000. Kill trigger: 50 Emails <2 Antworten.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-03-20"),
      tags: ["outreach", "vertikale", "steuerberater"],
    },
    {
      id: "seed-dec-fachwelt-whitelabel-defer",
      workspaceId: WORKSPACE_ID,
      authorId: GENT_ID,
      title: "Fachwelt White-Label DEFER",
      context: "Recherche: kleine Fachverlage haben kein Budget, kein Digital-Personal. Sales-Cycle 6-12 Mo.",
      decision: "Kein Multi-Tenant-Refactor jetzt. B2B Media Days (21. Mai) als Forschungsmission — 10 Gespraeche, NICHT als Verkaeufer.",
      alternatives: "Sofort White-Label bauen (negative Unit Economics)",
      consequences: "Fachwelt als Testimonial + Portfolio nutzen. Kill trigger: <3 von 10 Verlagsleitern interessiert.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-03-20"),
      tags: ["fachwelt", "strategy"],
    },
    {
      id: "seed-dec-website-entry-point",
      workspaceId: WORKSPACE_ID,
      projectId: tigonWebsite.id,
      authorId: GENT_ID,
      title: "Website-Erstellung als Entry Point + Vertikale Skalierung",
      context: "Website = breitester Top-of-Funnel. Jeder KMU versteht 'Website'.",
      decision: "Website als primaerer Einstiegspunkt. 3-Tier: Tier 1 voller Prototyp (warm), Tier 2 Template (kalt), Tier 3 Screenshot (Massen). BAFA/go-digital Claims entfernt, Digitalbonus Bayern + MID NRW.",
      alternatives: "Nur Web-Apps pitchen (zu eng fuer Cold)",
      consequences: "Zero Marginal Cost bei Vertikale: erster Build 2-4h, jeder weitere 30-60 Min.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-03-20"),
      tags: ["strategy", "website", "sales"],
    },
    {
      id: "seed-dec-nachtrag-pwa",
      workspaceId: WORKSPACE_ID,
      projectId: baubeleg.id,
      authorId: GENT_ID,
      title: "Nachtrag-App — PWA-first, Gent baut MVP",
      context: "Gesamter Stack Next.js, kein React Native Setup. Gent wohnt mit Vater (Feedback-Loop).",
      decision: "PWA-first (Next.js + next-pwa). App Store via Capacitor NACH Validierung. Gent baut MVP. Tag 1 = Nachtrag (5 Screens), Tag 2 = Behinderungsanzeige + Dashboard.",
      alternatives: "React Native (Stackwechsel fuer Validierung = Over-Engineering)",
      consequences: "Kein zusaetzlicher Stack. Physische Naehe zum Testnutzer.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-03-21"),
      tags: ["baubeleg", "tech", "mvp"],
    },
    {
      id: "seed-dec-nachtrag-validiert",
      workspaceId: WORKSPACE_ID,
      projectId: baubeleg.id,
      authorId: GENT_ID,
      title: "Nachtrag-App — Validierung POSITIV",
      context: "Gent's Vater: Problem existiert, nutzt ChatGPT manuell, kein dediziertes Tool.",
      decision: "GO fuer MVP. Problem bestaetigt aus erster Hand. ChatGPT-Nutzung = Willingness to use digital tools. Kein Wettbewerber mit dedizierter Sub-Loesung.",
      alternatives: "App toeten (nicht gerechtfertigt nach positivem Feedback)",
      consequences: "HIGH confidence. MVP-Scope: nur Nachtrag-PDF, kein Feature-Creep.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-03-21"),
      tags: ["baubeleg", "validation"],
    },
    {
      id: "seed-dec-vercel-pro",
      workspaceId: WORKSPACE_ID,
      authorId: GENT_ID,
      title: "Vercel Pro Upgrade noetig — Hobby hat kein DPA",
      context: "DSGVO-Audit: Hobby Plan hat kein DPA, nur fuer personal/non-commercial use.",
      decision: "Vercel Hobby → Pro ($20/Mo) vor Outreach. Alternative: Cloudflare Pages oder eigener VPS.",
      alternatives: "Auf Hobby bleiben (DSGVO-Verstoss + ToS-Verletzung)",
      consequences: "$20/Mo = guenstigste Absicherung. KW14 Server-Migration macht Vercel Pro temporaer.",
      status: "SUPERSEDED" as const,
      decidedAt: new Date("2026-03-28"),
      tags: ["dsgvo", "hosting", "costs"],
    },
    {
      id: "seed-dec-horbach-aktiv",
      workspaceId: WORKSPACE_ID,
      projectId: horbachAutomation.id,
      authorId: GENT_ID,
      title: "Horbach → AKTIV",
      context: "Meeting 2026-04-07 war HOT. Konkreter Scope, Arbeitsteilung, PoC ohne Vorabkosten.",
      decision: "Horbach von warm/ nach active/ verschoben. Revenue-Potenzial bis €13.650 MRR. Blocker: HubSpot API-Zugang.",
      alternatives: "In warm lassen (wuerde Momentum verlieren)",
      consequences: "Pflichtstruktur erstellt. Build startet sobald API-Zugang da.",
      status: "ACTIVE" as const,
      decidedAt: new Date("2026-04-08"),
      tags: ["horbach", "client", "activation"],
    },
  ];

  for (const d of allDecisions) {
    await prisma.decision.upsert({
      where: { id: d.id },
      update: {},
      create: d,
    });
  }
  console.log(`  All Decisions: ${allDecisions.length} created (from decisions.md)`);

  // ═══════════════════════════════════════════════════════════════════
  // TASKS from todos.md (kind=TODO) — business-level tasks
  // ═══════════════════════════════════════════════════════════════════

  const businessTasks = [
    // Fachwelt tasks (use existing project refs)
    { id: "seed-task-fw-warten-alia", projectId: redaktionsassistent.id, clientId: fachwelt.id, title: "Warten auf Alia — meldet sich fuer Termin", ownerTag: "GENT" as const, priority: "HIGH" as const, status: "BLOCKED" as const, blockedReason: "Alia meldet sich fuer Termin. Blocker fuer CRM-Migration.", tags: ["fachwelt", "client"] },
    { id: "seed-task-fw-webmag-creds", projectId: redaktionsassistent.id, clientId: fachwelt.id, title: "WebMag Login Credentials vom Kunden holen", ownerTag: "GENT" as const, priority: "NORMAL" as const, status: "OPEN" as const, tags: ["fachwelt", "credentials"] },
    { id: "seed-task-fw-staging-email", projectId: marketplace.id, clientId: fachwelt.id, title: "Staging-URL an Kunden schicken (marketplace.surfingtigon.com)", ownerTag: "GENT" as const, priority: "HIGH" as const, status: "OPEN" as const, tags: ["fachwelt", "deployment"] },
    { id: "seed-task-fw-approval-workflow", projectId: marketplace.id, clientId: fachwelt.id, title: "Approval-Workflow testen + Public-Facing Produktseiten bauen", ownerTag: "EDON" as const, priority: "NORMAL" as const, status: "OPEN" as const, tags: ["fachwelt", "marketplace"] },
    { id: "seed-task-fw-agent-envvars", projectId: redaktionsassistent.id, clientId: fachwelt.id, title: "Fachwelt Redaktionsagent: Env Vars in Vercel setzen + Live-Test", ownerTag: "GENT" as const, priority: "NORMAL" as const, status: "OPEN" as const, tags: ["fachwelt", "deployment"] },
    { id: "seed-task-fw-agent-roadmap", projectId: redaktionsassistent.id, clientId: fachwelt.id, title: "Fachwelt Redaktionsagent: Phasen-Roadmap reviewen", ownerTag: "GENT" as const, priority: "NORMAL" as const, status: "OPEN" as const, tags: ["fachwelt", "planning"] },
    { id: "seed-task-fw-editor-e2e", projectId: articleEditorSaas.id, clientId: fachwelt.id, title: "Article-Editor-SaaS: E2E Test (Frontend → API → n8n → DB)", ownerTag: "GENT" as const, priority: "HIGH" as const, status: "OPEN" as const, tags: ["fachwelt", "testing"] },
    { id: "seed-task-fw-editor-imap", projectId: articleEditorSaas.id, clientId: fachwelt.id, title: "Article-Editor-SaaS: IMAP-Poller von WSL nach Coolify Docker migrieren", ownerTag: "GENT" as const, priority: "NORMAL" as const, status: "OPEN" as const, tags: ["fachwelt", "migration"] },
    { id: "seed-task-fw-editor-freigeben", projectId: articleEditorSaas.id, clientId: fachwelt.id, title: "Article-Editor-SaaS: freigeben Workflow (WordPress Publishing)", ownerTag: "GENT" as const, priority: "NORMAL" as const, status: "OPEN" as const, tags: ["fachwelt", "feature"] },
    { id: "seed-task-fw-editor-edge", projectId: articleEditorSaas.id, clientId: fachwelt.id, title: "Article-Editor-SaaS: Edge Function Deploy via supabase CLI", ownerTag: "GENT" as const, priority: "NORMAL" as const, status: "OPEN" as const, tags: ["fachwelt", "deployment"] },
    // Horbach tasks
    { id: "seed-task-hb-marlon-whatsapp", projectId: horbachAutomation.id, clientId: horbach.id, title: "Marlon per WhatsApp kontaktieren: HubSpot API-Zugang + 3 Muster-Mails anfordern", ownerTag: "GENT" as const, priority: "URGENT" as const, status: "OPEN" as const, tags: ["horbach", "client"] },
    { id: "seed-task-hb-hubspot-outlook", projectId: horbachAutomation.id, clientId: horbach.id, title: "HubSpot → Outlook + personalisierte Mail bauen (n8n) — Prio 1", ownerTag: "GENT" as const, priority: "URGENT" as const, status: "OPEN" as const, tags: ["horbach", "integration"] },
    { id: "seed-task-hb-reminder", projectId: horbachAutomation.id, clientId: horbach.id, title: "Automatische Reminder (1 Tag + 10 Min vorher) — n8n", ownerTag: "GENT" as const, priority: "HIGH" as const, status: "OPEN" as const, tags: ["horbach", "automation"] },
    { id: "seed-task-hb-rebooking", projectId: horbachAutomation.id, clientId: horbach.id, title: "Re-Booking bei Absage → Mail mit Buchungslink — n8n", ownerTag: "GENT" as const, priority: "HIGH" as const, status: "OPEN" as const, tags: ["horbach", "automation"] },
    { id: "seed-task-hb-lead-routing", projectId: horbachAutomation.id, clientId: horbach.id, title: "Lead-Routing (Low/Mid/High → richtiger Berater) — n8n + HubSpot", ownerTag: "EDON" as const, priority: "NORMAL" as const, status: "OPEN" as const, tags: ["horbach", "routing"] },
    { id: "seed-task-hb-rackagent", projectId: horbachAutomation.id, clientId: horbach.id, title: "WhatsApp-KI 'Rackagent' — Termine/Raeume per Chat", ownerTag: "EDON" as const, priority: "NORMAL" as const, status: "OPEN" as const, tags: ["horbach", "whatsapp", "ai"] },
    { id: "seed-task-hb-vergleich", projectId: horbachAutomation.id, clientId: horbach.id, title: "Versicherungsvergleich-Script (Effektivkostenquoten)", ownerTag: "EDON" as const, priority: "LOW" as const, status: "OPEN" as const, tags: ["horbach", "tool"] },
    { id: "seed-task-hb-demo-call", projectId: horbachAutomation.id, clientId: horbach.id, title: "Demo-Call mit Marlon buchen sobald PoC steht", ownerTag: "BEIDE" as const, priority: "NORMAL" as const, status: "OPEN" as const, tags: ["horbach", "sales"] },
    // Business & Infrastruktur (use tigonOps as container)
    { id: "seed-task-biz-silicon-ig", projectId: tigonOps.id, title: "Silicon Rosenheim Instagram DM rausschicken — Werkstudent-Opportunity", ownerTag: "EDON" as const, priority: "NORMAL" as const, status: "OPEN" as const, tags: ["outreach", "opportunity"] },
    { id: "seed-task-biz-ip-clause", projectId: tigonOps.id, title: "IP-Clause in jedes neue Kundenangebot einbauen (Blueprints bleiben bei Tigon)", ownerTag: "EDON" as const, priority: "HIGH" as const, status: "OPEN" as const, tags: ["legal", "contracts"] },
    { id: "seed-task-biz-prod-gate", projectId: tigonOps.id, title: "Production-Gate Meta-Skill planen (coolify-deploy + lawyer + dsgvo + monitor + test + ui-audit)", ownerTag: "EDON" as const, priority: "NORMAL" as const, status: "OPEN" as const, tags: ["skill", "production"] },
    { id: "seed-task-biz-expert-review", projectId: tigonOps.id, title: "Expert-Review Senior DevOps einholen (€200-400, 1-2h) — Production-Readiness Gaps", ownerTag: "EDON" as const, priority: "HIGH" as const, status: "OPEN" as const, tags: ["infrastructure", "review"] },
    { id: "seed-task-biz-cold-email", projectId: tigonOps.id, title: "StB Cold Email Campaign STARTEN — 413 Leads seit Wochen ungesendet", ownerTag: "EDON" as const, priority: "URGENT" as const, status: "OPEN" as const, tags: ["outreach", "email", "top-prio"] },
    { id: "seed-task-biz-api-key", projectId: tigonOps.id, title: "Anthropic API Key erstellen + Billing — Blocker fuer Outreach + tigon-Alias", ownerTag: "GENT" as const, priority: "URGENT" as const, status: "OPEN" as const, tags: ["infrastructure", "blocker"] },
    { id: "seed-task-biz-credentials", projectId: tigonOps.id, title: "Credential Files lokal einrichten (Fachwelt Supabase, gitignored)", ownerTag: "GENT" as const, priority: "NORMAL" as const, status: "OPEN" as const, tags: ["infrastructure", "credentials"] },
    { id: "seed-task-biz-dsgvo-dpa", projectId: tigonOps.id, title: "DSGVO DPA-Kette (Client AVV + Anthropic DPA) — vor Prod-Daten", ownerTag: "BEIDE" as const, priority: "HIGH" as const, status: "OPEN" as const, tags: ["dsgvo", "legal"] },
    { id: "seed-task-biz-outreach-n8n", projectId: tigonOps.id, title: "Outreach-Engine in n8n bauen (Lead Scraping + Email + Follow-up)", ownerTag: "GENT" as const, priority: "NORMAL" as const, status: "OPEN" as const, tags: ["outreach", "n8n"] },
    { id: "seed-task-biz-finsense-link", projectId: tigonOps.id, title: "Finsense Link an Tuna schicken (10 Min Task)", ownerTag: "GENT" as const, priority: "LOW" as const, status: "OPEN" as const, tags: ["sales"] },
    { id: "seed-task-biz-haftpflicht", projectId: tigonOps.id, title: "IT-Berufshaftpflicht abschliessen (Hiscox/exali, min. €1M Deckung)", ownerTag: "BEIDE" as const, priority: "HIGH" as const, status: "OPEN" as const, tags: ["legal", "insurance"] },
    { id: "seed-task-biz-gbr-vertrag", projectId: tigonOps.id, title: "GbR-Vertrag pruefen + finalisieren", ownerTag: "BEIDE" as const, priority: "HIGH" as const, status: "OPEN" as const, tags: ["legal"] },
    { id: "seed-task-biz-gewerbe-vault", projectId: tigonOps.id, title: "Gewerbeanmeldung im Vault ablegen", ownerTag: "GENT" as const, priority: "LOW" as const, status: "OPEN" as const, tags: ["admin"] },
    { id: "seed-task-biz-tigon-deploy", projectId: tigonWebsite.id, title: "Tigon Website deployen (Website-Entry-Point + Foerderfaehigkeit — Code fertig)", ownerTag: "GENT" as const, priority: "HIGH" as const, status: "OPEN" as const, tags: ["deployment", "website"] },
    // Tools & Research
    { id: "seed-task-biz-paperclip", projectId: tigonOps.id, title: "Paperclip anschauen — Multi-Agent Orchestration Framework (~33K Stars)", ownerTag: "GENT" as const, priority: "LOW" as const, status: "OPEN" as const, tags: ["research", "tools"] },
    // Collab
    { id: "seed-task-biz-sheet-header", projectId: tigonOps.id, title: "Google Sheet Header updaten (19 neue Spalten)", ownerTag: "GENT" as const, priority: "LOW" as const, status: "OPEN" as const, tags: ["collab"] },
    { id: "seed-task-biz-project-builder", projectId: tigonOps.id, title: "/project-builder Skill testen mit echten Intake-Daten", ownerTag: "GENT" as const, priority: "LOW" as const, status: "OPEN" as const, tags: ["skill", "testing"] },
    { id: "seed-task-biz-social-proof", projectId: tigonOps.id, title: "Social Proof hinzufuegen (Fachwelt Case Study)", ownerTag: "GENT" as const, priority: "NORMAL" as const, status: "OPEN" as const, tags: ["marketing"] },
    { id: "seed-task-biz-finsense-foto", projectId: finsenseWebsite.id, title: "Finsense: Echtes Foto von Tuna einbauen", ownerTag: "GENT" as const, priority: "LOW" as const, status: "OPEN" as const, tags: ["design"] },
    // Zertifikate
    { id: "seed-task-cert-partner", projectId: tigonOps.id, title: "Claude Partner Network beitreten (kostenlos, 5 Min)", ownerTag: "BEIDE" as const, priority: "NORMAL" as const, status: "OPEN" as const, tags: ["certification"] },
    { id: "seed-task-cert-academy", projectId: tigonOps.id, title: "Anthropic Academy Kurse starten (13 Kurse, self-paced, kostenlos)", ownerTag: "BEIDE" as const, priority: "NORMAL" as const, status: "OPEN" as const, tags: ["certification", "learning"] },
    { id: "seed-task-cert-cca", projectId: tigonOps.id, title: "CCA-Pruefung ablegen (60 Fragen, proctored)", ownerTag: "BEIDE" as const, priority: "LOW" as const, status: "OPEN" as const, tags: ["certification"] },
    { id: "seed-task-cert-badge", projectId: tigonWebsite.id, title: "Badge auf tigonautomation.de einbauen (Partner-Badge + CCA-Badge)", ownerTag: "EDON" as const, priority: "LOW" as const, status: "OPEN" as const, tags: ["certification", "website"] },
    { id: "seed-task-cert-linkedin", projectId: tigonOps.id, title: "LinkedIn-Profile updaten mit 'Claude Certified Architect'", ownerTag: "BEIDE" as const, priority: "LOW" as const, status: "OPEN" as const, tags: ["certification", "linkedin"] },
    { id: "seed-task-cert-startup-program", projectId: tigonOps.id, title: "Anthropic Startup Program Bewerbung (bis $25K API-Credits)", ownerTag: "BEIDE" as const, priority: "NORMAL" as const, status: "OPEN" as const, tags: ["certification", "funding"] },
    // ImmoAI
    { id: "seed-task-immo-excel", projectId: tigonOps.id, title: "Leon: Excel-Tabelle Sachwertverfahren anfordern", ownerTag: "GENT" as const, priority: "LOW" as const, status: "OPEN" as const, tags: ["immoai"] },
    { id: "seed-task-immo-flurstueck", projectId: tigonOps.id, title: "Leon: Flurstuecksnummer-Format klaeren", ownerTag: "GENT" as const, priority: "LOW" as const, status: "OPEN" as const, tags: ["immoai"] },
    { id: "seed-task-immo-boris", projectId: tigonOps.id, title: "BORIS BW: Kein oeffentliches WFS API → Alternativen pruefen", ownerTag: "GENT" as const, priority: "LOW" as const, status: "OPEN" as const, tags: ["immoai", "research"] },
    { id: "seed-task-immo-konzept", projectId: tigonOps.id, title: "ImmoAI Konzept finalisieren nach Markt-Recherche", ownerTag: "GENT" as const, priority: "LOW" as const, status: "OPEN" as const, tags: ["immoai"] },
    { id: "seed-task-immo-tech", projectId: tigonOps.id, title: "ImmoAI: n8n-Workflow-Prototyp oder Next.js zuerst?", ownerTag: "GENT" as const, priority: "LOW" as const, status: "OPEN" as const, tags: ["immoai", "tech"] },
  ];

  for (const t of businessTasks) {
    await prisma.task.upsert({
      where: { id: t.id },
      update: {},
      create: t,
    });
  }
  console.log(`  Business Tasks: ${businessTasks.length} created (from todos.md)`);

  // ═══════════════════════════════════════════════════════════════════
  // TASKS from backlog.md (kind=INITIATIVE) — strategic initiatives
  // ═══════════════════════════════════════════════════════════════════

  const initiatives = [
    { id: "seed-init-email-outreach", projectId: tigonOps.id, kind: "INITIATIVE" as const, title: "Email Outreach System — personalisierte Kalt-Emails an KMUs", description: "Lead Sourcing → Audit → Email → optional Prototyp. Apify + PageSpeed + Claude API. Abhaengigkeiten: Anthropic API Key, IT-Haftpflicht, DSGVO-Audit.", ownerTag: "BEIDE" as const, priority: "URGENT" as const, status: "BLOCKED" as const, blockedReason: "Anthropic API Key + IT-Haftpflicht", tags: ["outreach", "P1"] },
    { id: "seed-init-cold-email-tier", projectId: tigonOps.id, kind: "INITIATIVE" as const, title: "Cold Email Tier-System (3-stufig)", description: "Tier 1 warm: Voller Prototyp 2-4h. Tier 2 kalt: Template 30-60 Min. Tier 3 Massen: Screenshot + Portfolio, automatisierbar.", ownerTag: "BEIDE" as const, priority: "HIGH" as const, status: "OPEN" as const, tags: ["outreach", "P1"] },
    { id: "seed-init-website-entry", projectId: tigonWebsite.id, kind: "INITIATIVE" as const, title: "Website-Erstellung als Entry Point bei Neukunden", description: "Breitester Top-of-Funnel. Code fertig (Hero-Text, Grid, Services). Deployment pending.", ownerTag: "GENT" as const, priority: "HIGH" as const, status: "OPEN" as const, tags: ["strategy", "P1"] },
    { id: "seed-init-foerderfaehigkeit", projectId: tigonWebsite.id, kind: "INITIATIVE" as const, title: "Foerderfaehigkeit belegen — Digitalbonus Bayern + MID NRW", description: "Hero-Text entschaerft zu 'potenziell foerderfaehig'. Digitalbonus Bayern AKTIV bis 31.12.2027. MID NRW AKTIV ab Jan 2026.", ownerTag: "GENT" as const, priority: "HIGH" as const, status: "OPEN" as const, tags: ["marketing", "P1"] },
    { id: "seed-init-gbr-haftpflicht", projectId: tigonOps.id, kind: "INITIATIVE" as const, title: "GbR-Gruendung + IT-Berufshaftpflicht", description: "Gewerbeanmeldung, GbR-Vertrag, Hiscox ~€12/Mo oder exali, min. €1M Deckung. MUSS vor Kalt-Akquise stehen.", ownerTag: "BEIDE" as const, priority: "URGENT" as const, status: "IN_PROGRESS" as const, tags: ["legal", "P1"] },
    { id: "seed-init-delivery-modell", projectId: tigonOps.id, kind: "INITIATIVE" as const, title: "Delivery-Modell definieren (Code-only vs. Full-Service)", description: "Hosting-Strategie, Betreuungspauschale, Standard-Paket. Muss vor erstem Nicht-Fachwelt-Abschluss klar sein.", ownerTag: "BEIDE" as const, priority: "NORMAL" as const, status: "OPEN" as const, tags: ["strategy", "P2"] },
    { id: "seed-init-vertrags-templates", projectId: tigonOps.id, kind: "INITIATIVE" as const, title: "Vertrags-Templates (Werkvertrag, AVV, AGB)", description: "Standard-Klauseln IT-Dienstleistungsvertraege DE. Brauchen wir vor neuem Kundenabschluss.", ownerTag: "BEIDE" as const, priority: "NORMAL" as const, status: "OPEN" as const, tags: ["legal", "P2"] },
    { id: "seed-init-kompetenz-artikulation", projectId: tigonOps.id, kind: "INITIATIVE" as const, title: "Kompetenz-Artikulation / Sales-Readiness", description: "Edon-Briefing fuer Discovery Calls. FAQ (20 Fragen), Delivery-Flowchart, Technik-Glossar in Kundensprache.", ownerTag: "BEIDE" as const, priority: "NORMAL" as const, status: "OPEN" as const, tags: ["sales", "P2"] },
    { id: "seed-init-dsgvo-audit", projectId: tigonWebsite.id, kind: "INITIATIVE" as const, title: "DSGVO-Audit Tigon Website", description: "Impressum, DSE, Cookie-Consent, Kontaktformular pruefen. Eigene Website muss sauber sein vor Outreach.", ownerTag: "BEIDE" as const, priority: "NORMAL" as const, status: "OPEN" as const, tags: ["dsgvo", "P2"] },
    { id: "seed-init-referral", projectId: tigonOps.id, kind: "INITIATIVE" as const, title: "Referral-Programm (20% Provision)", description: "Ein Satz in der Dankes-Email nach Projektabschluss. Trigger: nach erstem abgeschlossenem Projekt.", ownerTag: "BEIDE" as const, priority: "LOW" as const, status: "PARKED" as const, tags: ["sales", "P2"] },
    { id: "seed-init-daytime-sentinel", projectId: tigonOps.id, kind: "INITIATIVE" as const, title: "Proaktiver Tages-Agent (Daytime Sentinel)", description: "Cron-Job 2-3x/Tag, Vault checken, Erinnerungen. Alternative: /startup liest Todo-Files gruendlicher.", ownerTag: "GENT" as const, priority: "LOW" as const, status: "PARKED" as const, tags: ["automation", "P3"] },
    { id: "seed-init-crm-tool", projectId: tigonOps.id, kind: "INITIATIVE" as const, title: "CRM-Tool evaluieren (HubSpot Free / Pipedrive / Eigen)", description: "Trigger: 10+ aktive Leads. Bis dahin: kunden/ Ordnerstruktur reicht.", ownerTag: "BEIDE" as const, priority: "LOW" as const, status: "PARKED" as const, tags: ["crm", "P3"] },
    { id: "seed-init-tools-test", projectId: tigonOps.id, kind: "INITIATIVE" as const, title: "Tools testen: 21st.dev Magic MCP, Stitch 2.0, NanoBanana Pro", description: "Empfohlener Workflow: Stitch → visueller Entwurf → 21st.dev Magic → Code → Claude Code.", ownerTag: "GENT" as const, priority: "LOW" as const, status: "PARKED" as const, tags: ["tools", "P3"] },
    { id: "seed-init-foerdermittel-integration", projectId: tigonOps.id, kind: "INITIATIVE" as const, title: "Foerdermittel-Integration als aktiven Service", description: "Kontaktformular mit Bundesland-Abfrage → automatische Programmzuordnung. Trigger: nach Foerderfaehigkeits-Grundlagen.", ownerTag: "BEIDE" as const, priority: "LOW" as const, status: "PARKED" as const, tags: ["service", "P3"] },
  ];

  for (const init of initiatives) {
    await prisma.task.upsert({
      where: { id: init.id },
      update: {},
      create: init,
    });
  }
  console.log(`  Initiatives: ${initiatives.length} created (from backlog.md)`);

  // ═══════════════════════════════════════════════════════════════════
  // JOURNAL ENTRIES from journal.md (kind=NOTE)
  // ═══════════════════════════════════════════════════════════════════

  const journalEntries = [
    { id: "seed-journal-2026-04-14-portal", kind: "NOTE" as const, projectId: clientPortal.id, authorId: GENT_ID, title: "Portal Multi-Tenancy Hardening + Multi-Assign Verify", occurredAt: new Date("2026-04-14"), content: "Test-Agent fand 4 P0 Tenant-Leaks (GETs auf Server/Document/KnowledgeEntry/Impulse ohne workspaceId) + 2 P1. Alle 6 gefixt. 11/11 Test-Cases bestanden.", tags: ["session", "security"] },
    { id: "seed-journal-2026-04-14-baubeleg", kind: "NOTE" as const, projectId: baubeleg.id, authorId: GENT_ID, title: "BauBeleg /dev start+stop", occurredAt: new Date("2026-04-14"), content: "Explore-Branch gent/explore-2026-04-13 von dev erstellt, 10 commits gepullt, Dev Server hochgezogen und wieder gestoppt. Kein Code-Change.", tags: ["session"] },
    { id: "seed-journal-2026-04-13-portal", kind: "NOTE" as const, projectId: clientPortal.id, authorId: GENT_ID, title: "Portal Dev-Workflow-Setup + Task-Detail", occurredAt: new Date("2026-04-13"), content: "Task-Detail/Edit-Page gebaut. Dev-Workflow: .env.local Symlink, .env.staging mit Coolify-Secrets, Staging auf dev Branch, docker-entrypoint auf migrate deploy, Backup-Script.", tags: ["session"] },
    { id: "seed-journal-2026-04-11-baubeleg", kind: "NOTE" as const, projectId: baubeleg.id, authorId: GENT_ID, title: "BauBeleg GF Stunden-Umstellung auf Staging", occurredAt: new Date("2026-04-11"), content: "Runtime-Error auf Login (Cannot find module ./1331.js) = kaputter .next/ Cache nach Branch-Switch. Permission-Bug: /api/baubeleg/entwuerfe blockierte nur Role statt Permission. Fix: hasPermission(). 5 weitere role-Checks normalisiert.", tags: ["session", "bug", "security"] },
    { id: "seed-journal-2026-04-11-hurghada", kind: "NOTE" as const, projectId: hurghadaTours.id, authorId: GENT_ID, title: "Hurghada Tours Real-Catalog live + dev-Branch versehentlich geloescht", occurredAt: new Date("2026-04-11"), content: "17 echte Touren von Amo Magdy integriert. PR #1 gemerged. Fehler: --delete-branch loeschte dev Branch. Sofort wiederhergestellt. Lesson: Bei dev→main PRs NIE --delete-branch.", tags: ["session", "error", "deployment"] },
    { id: "seed-journal-2026-04-09-dev", kind: "NOTE" as const, projectId: tigonOps.id, authorId: GENT_ID, title: "/dev Skill Umbau: dev-Branch als permanenter Staging-Gate", occurredAt: new Date("2026-04-09"), content: "Feature-Branch → dev (Staging) → main (Production). /dev push merged in dev, /dev start erstellt von dev, /dev done macht PR dev→main. /dev join geloescht (redundant).", tags: ["session", "skill"] },
    { id: "seed-journal-2026-04-07-telegram", kind: "NOTE" as const, projectId: tigonOps.id, authorId: GENT_ID, title: "Telegram Permission-Fix (geloest)", occurredAt: new Date("2026-04-07"), content: "Root Cause: HABIT_TELEGRAM_SESSION=1 env var kam nicht an. Fix: Environment= direkt in systemd Unit. prod-guard.sh gehaertet (deny statt ask in Telegram).", tags: ["session", "fix"] },
    { id: "seed-journal-2026-04-06-dev-audit", kind: "NOTE" as const, projectId: tigonOps.id, authorId: GENT_ID, title: "/dev Skill Bulletproofing — 9 Breaking Issues gefixt", occurredAt: new Date("2026-04-06"), content: "Kompletter Audit aller 5 /dev Commands. 9 echte Issues: dotenv-cli Refs, fehlende allowed-tools, .env.local sourcing vor Existenz-Check, kein Rebase-Guard, Docker-Phase-Skip.", tags: ["session", "security", "skill"] },
    { id: "seed-journal-2026-04-06-minio", kind: "NOTE" as const, projectId: baubeleg.id, authorId: GENT_ID, title: "MinIO Deploy + Supabase Migration Finale + DB-Architektur", occurredAt: new Date("2026-04-06"), content: "MinIO als Docker Compose auf Coolify (minio.surfingtigon.com). 4 Ansaetze iteriert. Alte Supabase-Services gestoppt. DB-Architektur: 1 PG-Instanz mit 2 DBs = Standard.", tags: ["session", "infrastructure"] },
    { id: "seed-journal-2026-04-06-auth", kind: "NOTE" as const, projectId: tigonOps.id, authorId: GENT_ID, title: "Native Auth Stack Skill + Supabase/Vercel Purge aus allen Skills", occurredAt: new Date("2026-04-06"), content: "native-auth-stack Skill gebaut (bcryptjs+jose Templates). Supabase+Vercel systematisch aus ALLEN referenzierenden Skills entfernt. Final-Grep: 0 Hits.", tags: ["session", "skill"] },
    { id: "seed-journal-2026-04-05-portfolio", kind: "NOTE" as const, projectId: tigonWebsite.id, authorId: GENT_ID, title: "Tigon Website Portfolio entfernt + Branch-Drift entdeckt", occurredAt: new Date("2026-04-05"), content: "Portfolio-Section entfernt. Live-Site lief auf v2-redesign statt main. Handoff-Datei behauptete das Gegenteil. Pattern: Bei Deploy-Branch!=main IMMER erst curl+diff.", tags: ["session", "pattern"] },
    { id: "seed-journal-2026-04-04-marketplace", kind: "NOTE" as const, projectId: marketplace.id, authorId: GENT_ID, title: "Fachwelt Marketplace Coolify Deployment finalisiert", occurredAt: new Date("2026-04-04"), content: "Staging + Supabase auf Coolify. Probleme: Coolify cacht Docker Images per SHA, Prisma 7 deep deps, Server-Ueberlastung durch parallele Rebuilds. Prod+Staging 200 OK.", tags: ["session", "deployment"] },
    { id: "seed-journal-2026-04-01-rebranding", kind: "NOTE" as const, projectId: baubeleg.id, authorId: GENT_ID, title: "BauBeleg Rebranding (Nachtrag → Baubeleg)", occurredAt: new Date("2026-04-01"), content: "Komplettes Rename in 44+ Dateien: API-Routen, Page-Routen, Types, Store, Hook, Localization, Prisma Schema (@@map fuer DB-Compat), Docs. Repo umbenannt. Build erfolgreich.", tags: ["session", "refactor"] },
    { id: "seed-journal-2026-03-26-forge", kind: "NOTE" as const, projectId: tigonOps.id, authorId: GENT_ID, title: "forge Skill — SDLC Orchestrator", occurredAt: new Date("2026-03-26"), content: "/forge: 6 Phasen (Discover→Deploy), 27+ Sub-Skills, DSGVO First-Class, 100% Pass Rate (18/18 Assertions) vs. 39% ohne Skill.", tags: ["session", "skill"] },
  ];

  for (const j of journalEntries) {
    await prisma.journal.upsert({
      where: { id: j.id },
      update: {},
      create: j,
    });
  }
  console.log(`  Journal Entries: ${journalEntries.length} created (from journal.md)`);

  // ═══════════════════════════════════════════════════════════════════
  // KNOWLEDGE ENTRIES — Ideas from ideas.md
  // ═══════════════════════════════════════════════════════════════════

  const ideas = [
    { id: "seed-idea-blueprint-marketplace", workspaceId: WORKSPACE_ID, authorId: GENT_ID, title: "Tigon Blueprint Marketplace (Public)", content: "Jedes geshippte Produkt als wiederverwendbarer Code Blueprint. Intern: Builds beschleunigen. Extern: Marketplace an Devs/Agenturen. IP-Clause noetig: generische Patterns bleiben bei Tigon. Status: Geparkt bis €3-5K MRR + 5 shipped Produkte.", category: "IDEA" as const, tags: ["product", "revenue-stream", "geparkt"] },
    { id: "seed-idea-upwork-automation", workspaceId: WORKSPACE_ID, authorId: GENT_ID, title: "Upwork Notification → Workflow Trigger (API/IMAP)", content: "Upwork Emails via IMAP/Gmail-API → n8n Trigger → Job-URL → /upwork-scout Scoring → bei TIER A automatisch /upwork-proposal. Geparkt: 3 Proposals seit Tagen nicht submitted. Erst manuell shippen.", category: "IDEA" as const, tags: ["automation", "upwork", "geparkt"] },
    { id: "seed-idea-facebook-dm", workspaceId: WORKSPACE_ID, authorId: GENT_ID, title: "Facebook/Instagram DM Outreach mit Lead Scraper", content: "Business-Social-Accounts ohne Website finden → DM mit Prototyp. Geparkt: 3. Outbound-Kanal parallel zu Cold Calling + ungesendetem Cold Email = Channel-Stacking vor Validation.", category: "IDEA" as const, tags: ["outreach", "facebook", "geparkt"] },
    { id: "seed-idea-linkedin", workspaceId: WORKSPACE_ID, authorId: GENT_ID, title: "LinkedIn Profil + Content + Connection-Requests", content: "Edons LinkedIn mit Tigon + anonymisierte Case Studies. 20 Connection-Requests/Tag an KMU-GFs. Blocker: Fachwelt+BauBeleg nicht fertig, kein Proof. Geparkt bis >50 aktive User.", category: "IDEA" as const, tags: ["outreach", "linkedin", "geparkt"] },
    { id: "seed-idea-nachtrag-app", workspaceId: WORKSPACE_ID, projectId: baubeleg.id, authorId: GENT_ID, title: "Nachtrag-App fuer Subunternehmer (SaaS)", content: "Problem: Subs verlieren 30-40% Nachtraege. App: Foto+Sprache → PDF (VOB/B) → per Tap an GU. 45 Sekunden. Kostenlose E-Rechnung als Hook. €29-49/Mo. GTM: Gents Vater + albanische Community. Geparkt bis nach Klausurphase.", category: "IDEA" as const, tags: ["product", "baubeleg", "saas", "geparkt"] },
    { id: "seed-idea-telegram-group", workspaceId: WORKSPACE_ID, authorId: GENT_ID, title: "Telegram Gruppenchat: Gent + Edon + beide Claude-Bots", content: "4 Teilnehmer: Gent, Edon, HABIT-Bot, Edons Bot. Mention-basiertes Routing. Voraussetzung: Edon hat eigenen Claude-Bot. Geparkt.", category: "IDEA" as const, tags: ["infrastructure", "collaboration", "geparkt"] },
    { id: "seed-idea-lead-scraper", workspaceId: WORKSPACE_ID, authorId: GENT_ID, title: "Lead Scraper + Automated Email Outreach System", content: "Claude scrapes leads, personalizes emails, sends via API, logs replies. Full autonomous outreach pipeline. Geparkt bis GbR-Formalitaeten stehen.", category: "IDEA" as const, tags: ["outreach", "automation", "geparkt"] },
    { id: "seed-idea-feedback-chatbot", workspaceId: WORKSPACE_ID, authorId: GENT_ID, title: "Client-facing Feedback Chatbot fuer Delivered Apps", content: "Chatbot nach Delivery: Voice/Text Feedback → Claude transcribes → actionable items → routes to dev. Human-in-the-loop. Geparkt bis 3+ active clients.", category: "IDEA" as const, tags: ["product", "after-sales", "geparkt"] },
    { id: "seed-idea-claude-service", workspaceId: WORKSPACE_ID, authorId: GENT_ID, title: "Claude Code als Tigon Service Model", content: "Claude Code Ecosystems fuer deutsche SMBs: vault, MCP, slash commands, voice workflows. 2.5-2.9M SMEs not using AI. Aber: jeder Client braucht Custom Setup = doesn't scale. Geparkt.", category: "IDEA" as const, tags: ["service", "ai", "geparkt"] },
    { id: "seed-idea-support-portal", workspaceId: WORKSPACE_ID, authorId: GENT_ID, title: "Tigon Kundensupport-Portal", content: "App fuer Kunden: Login → sehen ihre App → strukturiertes Feedback → Claude Code verarbeitet aendern autonom. Monatliche Support-Pauschale. Geparkt bis 3+ zahlende Kunden.", category: "IDEA" as const, tags: ["product", "after-sales", "geparkt"] },
    { id: "seed-idea-positionierung", workspaceId: WORKSPACE_ID, authorId: GENT_ID, title: "Positionierung: Webapps > KI-Automatisierung", content: "Wenn Webapps genauso schnell gebaut sind wie n8n-Workflows, warum Workflows separat verkaufen? Webapp = Kernprodukt, Automatisierung = Feature. Geparkt bis Website-Update.", category: "IDEA" as const, tags: ["strategy", "positioning", "geparkt"] },
    { id: "seed-idea-portfolio", workspaceId: WORKSPACE_ID, authorId: GENT_ID, title: "Portfolio/Case Studies auf Website", content: "Nach erster Delivery: Case Study (Problem, Loesung, Ergebnis, Testimonial). Portfolio-Seite auf tigonautomation.de. Jede Webapp = potenzielle Produktvorlage. Geparkt bis erstes Testimonial.", category: "IDEA" as const, tags: ["marketing", "website", "geparkt"] },
    { id: "seed-idea-distribution", workspaceId: WORKSPACE_ID, authorId: GENT_ID, title: "Distribution Engine — Zero-Capital Scaling", content: "Phase 1: show-first → testimonials. Phase 2: automated outreach (n8n). Phase 3: AI-generated ads. Content: B2B timelapse builds. Albanian network = organic viral. First mover gets trust moat.", category: "IDEA" as const, tags: ["strategy", "growth", "geparkt"] },
    { id: "seed-idea-lizenzmodell", workspaceId: WORKSPACE_ID, authorId: GENT_ID, title: "Lizenzmodell: Exklusiv vs. Shared", content: "Exklusiv: Source Code + volle Rechte, €8-15K+. Shared: Tigon hostet, darf Template weiterverkaufen, €3-5K. Standard-SaaS-Unterscheidung. Geparkt bis zweiter Kunde will gleiche Loesung.", category: "IDEA" as const, tags: ["pricing", "business-model", "geparkt"] },
  ];

  for (const idea of ideas) {
    await prisma.knowledgeEntry.upsert({
      where: { id: idea.id },
      update: {},
      create: idea,
    });
  }
  console.log(`  Ideas: ${ideas.length} created (from ideas.md)`);

  // ═══════════════════════════════════════════════════════════════════
  // KNOWLEDGE ENTRIES — Shared Insights
  // ═══════════════════════════════════════════════════════════════════

  const sharedInsights = [
    { id: "seed-insight-show-first", workspaceId: WORKSPACE_ID, authorId: EDON_ID, title: "Show-First Strategy", content: "Research contact → build prototype → walk in and show. Tigon's edge: speed + quality + personal trust. Every connection = potential client.", category: "INSIGHT" as const, tags: ["strategy", "sales", "shared"] },
    { id: "seed-insight-bodenleger", workspaceId: WORKSPACE_ID, authorId: EDON_ID, title: "Bodenleger Opportunity — Gent's Vater", content: "B2B Bodenbelagsarbeiten mit GUs. Erster Design-Partner fuer Nachtrag-App. Albanisches Netzwerk als Distribution.", category: "INSIGHT" as const, tags: ["opportunity", "baubeleg", "shared"] },
    { id: "seed-insight-albanian-outreach", workspaceId: WORKSPACE_ID, authorId: EDON_ID, title: "Albanian Outreach Angle", content: "700-800K Albaner in DE, Bau = #1. WhatsApp Trust-Referral. Struktureller Vorteil den kein SaaS replizieren kann.", category: "INSIGHT" as const, tags: ["distribution", "baubeleg", "shared"] },
    { id: "seed-insight-nachtrag-mvp-plan", workspaceId: WORKSPACE_ID, authorId: EDON_ID, title: "Nachtrag MVP Plan fuer Gent", content: "PWA-first. Tag 1 = Nachtrag (5 Screens). Tag 2 = Behinderungsanzeige + Dashboard. Gent baut wegen Naehe zum Testnutzer.", category: "INSIGHT" as const, tags: ["baubeleg", "mvp", "shared"] },
    { id: "seed-insight-taxarena", workspaceId: WORKSPACE_ID, authorId: EDON_ID, title: "TaxArena Gent-Briefing — StB Vertikale", content: "Steuerberater als erste Outreach-Vertikale. 53.000 Kanzleien, 70% ohne Website. Demo: steuerberater-demo.vercel.app. Clemens als Multiplikator.", category: "INSIGHT" as const, tags: ["outreach", "steuerberater", "shared"] },
    { id: "seed-insight-nachtrag-marktforschung", workspaceId: WORKSPACE_ID, authorId: EDON_ID, title: "Nachtrag-App Marktforschung komplett", content: "22 Quellen, 10 Wettbewerber. Kein Wettbewerber hat Behinderungsanzeige/Bedenkenanmeldung. 123erfasst (50K+ Downloads) = echte Gefahr. Zeitfenster 9-15 Monate.", category: "INSIGHT" as const, tags: ["research", "baubeleg", "shared"] },
    { id: "seed-insight-supabase-migration", workspaceId: WORKSPACE_ID, authorId: EDON_ID, title: "Supabase → Coolify Migration Prompt", content: "BauBeleg von Supabase auf Self-Hosted: PostgreSQL 17, MinIO, bcryptjs+jose Auth. Migration-Prompt als Template fuer weitere Projekte.", category: "INSIGHT" as const, tags: ["infrastructure", "migration", "shared"] },
    { id: "seed-insight-architektur-cleanup", workspaceId: WORKSPACE_ID, authorId: EDON_ID, title: "Architektur-Cleanup v3 — Finale Drei-Zonen", content: "~/vault/ (persoenlich), ~/tigon/ (shared, Syncthing), ~/projects/ (Code, Git). ~/tigon/projects/ eliminiert. docs/ Pflicht in jedem Repo.", category: "INSIGHT" as const, tags: ["architecture", "infrastructure", "shared"] },
    { id: "seed-insight-projekt-tracker", workspaceId: WORKSPACE_ID, authorId: EDON_ID, title: "Projekt-Tracker Setup fuer Gent", content: "Google Sheet als Dashboard (revidiert zu Markdown). Ownership-Aufteilung: Gent=Fachwelt+BauBeleg, Edon=Outreach+Leads.", category: "INSIGHT" as const, tags: ["collaboration", "tracking", "shared"] },
    { id: "seed-insight-skills-bundle", workspaceId: WORKSPACE_ID, authorId: EDON_ID, title: "Skills-Bundle fuer Gent", content: "28 shared Skills von global nach tigon/.claude/skills/ migriert. Persoenliche vs. shared Skills getrennt. Single Source of Truth.", category: "INSIGHT" as const, tags: ["skills", "collaboration", "shared"] },
    { id: "seed-insight-build-specs", workspaceId: WORKSPACE_ID, authorId: EDON_ID, title: "Build Specs ready — Marketplace + Nachtrag", content: "Fachwelt Marketplace Spec + BauBeleg Build Spec fertig. /project-builder generiert produktionsreife Specs.", category: "INSIGHT" as const, tags: ["specs", "shared"] },
    { id: "seed-insight-bestatter-architektur", workspaceId: WORKSPACE_ID, authorId: EDON_ID, title: "Bestatter + Architektur Leads-Analyse", content: "Bestatter: 25/60 Score, kein Schmerz. Architektur-Leads via Gents Vater (WMK). Steuerberater 53/60 = beste Vertikale.", category: "INSIGHT" as const, tags: ["leads", "analysis", "shared"] },
  ];

  for (const si of sharedInsights) {
    await prisma.knowledgeEntry.upsert({
      where: { id: si.id },
      update: {},
      create: si,
    });
  }
  console.log(`  Shared Insights: ${sharedInsights.length} created`);

  // ═══════════════════════════════════════════════════════════════════
  // MISSING PROJECTS (needed for Phase 3 docs migration)
  // ═══════════════════════════════════════════════════════════════════

  const steuerberaterDemo = await prisma.project.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "steuerberater-demo" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      name: "Steuerberater Demo",
      slug: "steuerberater-demo",
      description: "Demo-Website fuer Steuerberater-Vertikale. Cold Outreach PARKED bis GbR steht.",
      status: "PAUSED",
      type: "INTERNAL",
      health: "GREEN",
      prodUrl: "https://steuerberater-demo.vercel.app",
      stack: ["Next.js", "Tailwind"],
      phase: "PARKED — Demo live, Outreach gestoppt",
    },
  });

  const articleEditorHub = await prisma.project.upsert({
    where: { workspaceId_slug: { workspaceId: WORKSPACE_ID, slug: "article-editor-hub" } },
    update: {},
    create: {
      workspaceId: WORKSPACE_ID,
      clientId: fachwelt.id,
      name: "Article Editor Hub",
      slug: "article-editor-hub",
      description: "Original Lovable-Version des Redaktionstools. Canonical Codebase, SaaS-Fork existiert.",
      status: "PAUSED",
      type: "CLIENT_PROJECT",
      health: "GREEN",
      stack: ["Vite", "React", "Supabase"],
      phase: "Eingefroren — aktive Entwicklung im SaaS-Fork",
    },
  });
  console.log(`  Missing Projects: ${steuerberaterDemo.name}, ${articleEditorHub.name}`);

  // ═══════════════════════════════════════════════════════════════════
  // PHASE 3: PROJECT-LEVEL DECISIONS from ~/projects/*/docs/decisions.md
  // ═══════════════════════════════════════════════════════════════════

  const projectDecisions = [
    // Article Editor Hub (1)
    { id: "seed-pdec-aeh-fork", workspaceId: WORKSPACE_ID, projectId: articleEditorHub.id, authorId: GENT_ID, title: "Fork als article-editor-saas fuer SaaS-Version mit n8n-Replacement", context: "n8n-Abhaengigkeit eliminieren fuer self-contained SaaS.", decision: "Fork erstellt. Hub bleibt als Original-Lovable-Projekt.", alternatives: "Im gleichen Repo entwickeln (zu riskant fuer Kundenprojekt)", consequences: "Zwei Repos, klare Trennung Original vs. SaaS.", status: "ACTIVE" as const, decidedAt: new Date("2026-03-31"), tags: ["fachwelt", "architecture"] },
    // Article Editor SaaS (10)
    { id: "seed-pdec-aes-fork", workspaceId: WORKSPACE_ID, projectId: articleEditorSaas.id, authorId: GENT_ID, title: "n8n-Logik 1:1 portieren, nicht verbessern", context: "SaaS-Fork soll n8n ersetzen.", decision: "1:1 Port, Verbesserungen nur nach Absprache.", alternatives: "Gleich verbessern (Risiko: Scope Creep)", consequences: "Schnellere Migration, weniger Bugs.", status: "ACTIVE" as const, decidedAt: new Date("2026-03-31"), tags: ["fachwelt", "migration"] },
    { id: "seed-pdec-aes-hono", workspaceId: WORKSPACE_ID, projectId: articleEditorSaas.id, authorId: GENT_ID, title: "Runtime = Hono API Service statt Supabase Edge Functions", context: "Edge Functions auf self-hosted Supabase gescheitert (Coolify Base64 Env, Docker Compose crashes, Entrypoint 504).", decision: "Eigener Hono API Service (Node.js Container auf Coolify).", alternatives: "Edge Functions reparieren (zu fragil)", consequences: "Industrie-Standard, keine Edge-Function-Hacks.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-01"), tags: ["fachwelt", "infrastructure"] },
    { id: "seed-pdec-aes-hybrid", workspaceId: WORKSPACE_ID, projectId: articleEditorSaas.id, authorId: GENT_ID, title: "Editor-Workflow Hybrid-Architektur: AI in n8n, DB-Ops im API Service", context: "18 AI-Calls sind kundenspezifisch, DB-Ops universell.", decision: "n8n liefert JSON mit AI-Ergebnissen, API Service macht INSERT/UPDATE.", alternatives: "Alles in Code (25 kundenspezifische Konfigpunkte)", consequences: "Kundenspezifisches bleibt konfigurierbar in n8n.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-01"), tags: ["fachwelt", "architecture"] },
    { id: "seed-pdec-aes-imap", workspaceId: WORKSPACE_ID, projectId: articleEditorSaas.id, authorId: GENT_ID, title: "Posteingang per IMAP, nicht Gmail API", context: "Gmail API erfordert OAuth, IMAP ist einfacher.", decision: "IMAP mit imapflow + mailparser.", alternatives: "Gmail API (OAuth-Setup, mehr Overhead)", consequences: "Einfachere Credentials, funktioniert mit jedem Mailprovider.", status: "ACTIVE" as const, decidedAt: new Date("2026-03-31"), tags: ["fachwelt", "integration"] },
    { id: "seed-pdec-aes-fire-forget", workspaceId: WORKSPACE_ID, projectId: articleEditorSaas.id, authorId: GENT_ID, title: "editor_freigeben = Fire-and-Forget", context: "n8n braucht Minuten fuer 18 AI-Calls.", decision: "API triggert nur Webhook und returned sofort. n8n macht AI + DB autonom.", alternatives: "Synchron warten (Timeouts, leere Responses)", consequences: "Kein Timeout-Risiko. Frontend pollt Status.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-01"), tags: ["fachwelt", "architecture"] },
    { id: "seed-pdec-aes-coolify-github", workspaceId: WORKSPACE_ID, projectId: articleEditorSaas.id, authorId: GENT_ID, title: "Coolify Apps via GitHub App, nicht Deploy Key", context: "GitHub App bietet bessere Integration als Deploy Keys.", decision: "Source ID 0 fuer gentdergent/ Repos, GitHub App UUID lwwkowk0wwskso4g4o88w8gk.", alternatives: "Deploy Key (weniger Funktionalitaet)", consequences: "Alle Repos ueber eine App verwaltbar.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-01"), tags: ["fachwelt", "deployment"] },
    { id: "seed-pdec-aes-multistage", workspaceId: WORKSPACE_ID, projectId: articleEditorSaas.id, authorId: GENT_ID, title: "API Dockerfile multi-stage: tsc compile, plain Node prod", context: "tsx darf nicht in Production-Image.", decision: "tsc compile in build stage, plain Node runtime in production.", alternatives: "tsx im Prod-Image (groesser, langsamer)", consequences: "Kleines Prod-Image, schnellerer Start.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-01"), tags: ["fachwelt", "docker"] },
    { id: "seed-pdec-aes-supabase-jwt", workspaceId: WORKSPACE_ID, projectId: articleEditorSaas.id, authorId: GENT_ID, title: "Frontend-Auth = Supabase JWT als Bearer Token an Hono API", context: "Frontend hat bereits Supabase Auth.", decision: "getSession() → Bearer Token → API verifiziert via getUser().", alternatives: "Eigenes Auth-System (unnoetig da Supabase Auth steht)", consequences: "Minimaler Aufwand, Supabase Auth bleibt Source of Truth.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-01"), tags: ["fachwelt", "auth"] },
    { id: "seed-pdec-aes-perplexity-skip", workspaceId: WORKSPACE_ID, projectId: articleEditorSaas.id, authorId: GENT_ID, title: "Perplexity-Credential uebersprungen — try/catch faengt ab", context: "Perplexity-Credential-Patch in n8n scheiterte.", decision: "Skip. Collect Results Code-Node hat try/catch.", alternatives: "Credential manuell setzen (nicht automatisierbar)", consequences: "Perplexity-Features inaktiv bis Credential gesetzt.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-01"), tags: ["fachwelt", "workaround"] },
    // BauBeleg (10)
    { id: "seed-pdec-bb-pwa", workspaceId: WORKSPACE_ID, projectId: baubeleg.id, authorId: GENT_ID, title: "PWA-first Approach fuer MVP", context: "Construction workers need quick access from any device.", decision: "Progressive Web App, kein Native Build. Mobile-first Design.", alternatives: "React Native (Stackwechsel fuer Validierung = Over-Engineering)", consequences: "Kein zusaetzlicher Stack, schnellerer MVP.", status: "ACTIVE" as const, decidedAt: new Date("2026-03-21"), tags: ["baubeleg", "tech"] },
    { id: "seed-pdec-bb-validation", workspaceId: WORKSPACE_ID, projectId: baubeleg.id, authorId: GENT_ID, title: "Validation POSITIVE — Pain Point bestaetigt", context: "Gent's Vater bestaetigt: Baubelege auf Papier/Word, kein dediziertes Tool.", decision: "Green light to build MVP.", alternatives: "App toeten (nicht gerechtfertigt)", consequences: "HIGH confidence. MVP-Scope: nur Nachtrag-PDF.", status: "ACTIVE" as const, decidedAt: new Date("2026-03-21"), tags: ["baubeleg", "validation"] },
    { id: "seed-pdec-bb-pivot", workspaceId: WORKSPACE_ID, projectId: baubeleg.id, authorId: GENT_ID, title: "Pivot: komplettes Buerokratie-Paket statt nur Baubeleg", context: "Subunternehmer brauchen ALLE Dokumente, nicht nur eines.", decision: "Scope: Baubeleg + Behinderungsanzeige + Stundenlohnzettel.", alternatives: "Nur Baubeleg (austauschbar, weniger Stickiness)", consequences: "Bundling erhoet perceived Value und Stickiness.", status: "ACTIVE" as const, decidedAt: new Date("2026-03-26"), tags: ["baubeleg", "scope"] },
    { id: "seed-pdec-bb-rebranding", workspaceId: WORKSPACE_ID, projectId: baubeleg.id, authorId: GENT_ID, title: "Rebranding Nachtrag → Baubeleg", context: "Nachtrag ist juristischer Fachbegriff (VOB/B §2 Abs. 6), zu eng.", decision: "Volles Rename in 44+ Dateien mit @@map fuer DB-Compat.", alternatives: "Nur UI-Name aendern (inkonsistent)", consequences: "Breiterer, verstaendlicherer Name fuer Zielgruppe.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-01"), tags: ["baubeleg", "branding"] },
    { id: "seed-pdec-bb-supabase-raus", workspaceId: WORKSPACE_ID, projectId: baubeleg.id, authorId: GENT_ID, title: "Supabase komplett entfernt — MinIO + bcryptjs/jose", context: "Tigon-Standard: kein BaaS. Auth auf JWT migriert, Storage offen.", decision: "Self-Hosted-Stack: MinIO + bcryptjs/jose. Kein Supabase-Code mehr.", alternatives: "Supabase-Instanzen wieder aufsetzen (Vendor-Lock-in)", consequences: "Volle Datenkontrolle, EU-konform, 0€ extra.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-08"), tags: ["baubeleg", "infrastructure"] },
    { id: "seed-pdec-bb-coolify", workspaceId: WORKSPACE_ID, projectId: baubeleg.id, authorId: GENT_ID, title: "Migration von Vercel zu Coolify (DSGVO)", context: "Vercel Hobby Plan hat kein DPA.", decision: "Coolify auf Hetzner VPS Frankfurt. Live: baubeleg.surfingtigon.com.", alternatives: "Vercel Hobby bleiben (DSGVO-Verstoss)", consequences: "DSGVO-konform, self-hosted.", status: "ACTIVE" as const, decidedAt: new Date("2026-03-31"), tags: ["baubeleg", "hosting"] },
    { id: "seed-pdec-bb-pg-consolidate", workspaceId: WORKSPACE_ID, projectId: baubeleg.id, authorId: GENT_ID, title: "PostgreSQL konsolidieren — eine Instanz, mehrere Datenbanken", context: "Zwei separate PG-Container auf gleichem VPS.", decision: "Eine Instanz mit baubeleg_dev/staging/prod. Spart ~200-300MB RAM.", alternatives: "Separate Container (unnoetig auf Single-VPS)", consequences: "Einfachere Backups, weniger RAM.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-06"), tags: ["baubeleg", "infrastructure"] },
    { id: "seed-pdec-bb-landing-removed", workspaceId: WORKSPACE_ID, projectId: baubeleg.id, authorId: GENT_ID, title: "Landing Page aus App-Repo entfernt", context: "Landing Page laeuft als eigene Coolify-App. Code in App war tot.", decision: "Clean-Cut. Keine Redundanz.", alternatives: "Beide behalten (groesseres Bundle)", consequences: "Saubere Trennung App vs. Marketing.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-06"), tags: ["baubeleg", "cleanup"] },
    { id: "seed-pdec-bb-turbopack", workspaceId: WORKSPACE_ID, projectId: baubeleg.id, authorId: GENT_ID, title: "Next.js Dev-Server auf Turbopack umgestellt", context: "Webpack: 885+ Module, 245% CPU, 99°C Throttling.", decision: "Turbopack (Rust-basiert), ~5x schneller, weniger CPU-Peaks.", alternatives: "Webpack behalten (verkuerzt Hardware-Lebensdauer)", consequences: "Cooler Dev-Server, schnellere Kompilierung.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-06"), tags: ["baubeleg", "dx"] },
    { id: "seed-pdec-bb-hydration", workspaceId: WORKSPACE_ID, projectId: baubeleg.id, authorId: GENT_ID, title: "Auth-Store Hydration — immer _hasHydrated setzen", context: "Zustand persist Callback bekommt undefined bei leerem localStorage → weisse Seite.", decision: "Fallback via useAuthStore.setState({ _hasHydrated: true }).", alternatives: "Default auf true (Race Condition mit SSR)", consequences: "Kein ewiges White-Screen mehr.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-09"), tags: ["baubeleg", "bugfix"] },
    // Bestattungen Schmid (2)
    { id: "seed-pdec-bs-rebuild", workspaceId: WORKSPACE_ID, projectId: bestattungenSchmid.id, authorId: GENT_ID, title: "Website rebuilt from scratch", context: "Original code lost. Fresh build needed.", decision: "Full rebuild: Next.js 15.5, React 19, Tailwind v4, Framer Motion.", alternatives: "N/A — code was lost", consequences: "Live at bestattungen-schmid.vercel.app.", status: "ACTIVE" as const, decidedAt: new Date("2026-03-24"), tags: ["bestattungen", "rebuild"] },
    { id: "seed-pdec-bs-design", workspaceId: WORKSPACE_ID, projectId: bestattungenSchmid.id, authorId: GENT_ID, title: "Dignified, restrained design language", context: "Funeral industry demands fundamentally different aesthetic.", decision: "Muted palette, generous whitespace, understated typography. No aggressive CTAs.", alternatives: "Standard business design (inappropriate for funerals)", consequences: "Sets respectful tone for client relationship.", status: "ACTIVE" as const, decidedAt: new Date("2026-03-24"), tags: ["bestattungen", "design"] },
    // Fachwelt Marketplace (3)
    { id: "seed-pdec-fm-prisma-docker", workspaceId: WORKSPACE_ID, projectId: marketplace.id, authorId: GENT_ID, title: "Prisma CLI via npm install im Docker Runner-Stage", context: "Prisma 7 tiefe Dependency-Trees fuehrten zu MODULE_NOT_FOUND.", decision: "npm install statt einzelne COPY-Zeilen fuer Prisma-Pakete.", alternatives: "Einzelne @prisma/* kopieren (fehlten immer weitere)", consequences: "Zuverlaessiger Docker Build.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-04"), tags: ["marketplace", "docker"] },
    { id: "seed-pdec-fm-edge-off", workspaceId: WORKSPACE_ID, projectId: marketplace.id, authorId: GENT_ID, title: "Supabase Edge Functions deaktiviert", context: "Endlos-Restart-Loop, Server-Ressourcen verschwendet.", decision: "restart: 'no'. Kein Feature basiert darauf.", alternatives: "Reparieren (unnoetig)", consequences: "Stabile Server-Performance.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-04"), tags: ["marketplace", "infrastructure"] },
    { id: "seed-pdec-fm-docs-migration", workspaceId: WORKSPACE_ID, projectId: marketplace.id, authorId: GENT_ID, title: "Projekt-Doku ins Code-Repo migriert", context: "Doku und Code in getrennten Repos = Split-Brain.", decision: "CLAUDE.md + docs/ ins Code-Repo. ~/tigon/projects/ eliminiert.", alternatives: "Doku in ~/tigon/projects/ (Drift)", consequences: "Git-Historie zeigt Doku+Code zusammen.", status: "ACTIVE" as const, decidedAt: new Date("2026-03-30"), tags: ["marketplace", "architecture"] },
    // Fachwelt Redaktion (2)
    { id: "seed-pdec-fr-nextjs-abandoned", workspaceId: WORKSPACE_ID, projectId: redaktionsassistent.id, authorId: GENT_ID, title: "Next.js port ABANDONED — Lovable original is canonical", context: "Next.js port introduced unnecessary complexity.", decision: "Keep Lovable original. Time-to-delivery > stack purity.", alternatives: "Continue Next.js port (delay)", consequences: "Lovable version works, ship faster.", status: "ACTIVE" as const, decidedAt: new Date("2026-03-24"), tags: ["fachwelt", "architecture"] },
    { id: "seed-pdec-fr-saas-fork", workspaceId: WORKSPACE_ID, projectId: redaktionsassistent.id, authorId: GENT_ID, title: "SaaS fork created to replace n8n", context: "n8n dependency limits self-contained deployment.", decision: "article-editor-saas fork with native API routes.", alternatives: "Keep n8n (vendor dependency)", consequences: "Self-contained SaaS, simpler deployment.", status: "ACTIVE" as const, decidedAt: new Date("2026-03-31"), tags: ["fachwelt", "architecture"] },
    // FinSense (3)
    { id: "seed-pdec-fs-v4-serif", workspaceId: WORKSPACE_ID, projectId: finsenseWebsite.id, authorId: GENT_ID, title: "V4 Serif redesign deployed", context: "Previous versions didn't convey premium financial positioning.", decision: "Serif typography, interactive mortgage calculator. Deployed as V4.", alternatives: "Keep old design (weaker trust signal)", consequences: "Live at finsense-v2.vercel.app.", status: "ACTIVE" as const, decidedAt: new Date("2026-03-20"), tags: ["finsense", "design"] },
    { id: "seed-pdec-fs-show-first", workspaceId: WORKSPACE_ID, projectId: finsenseWebsite.id, authorId: GENT_ID, title: "Show-first strategy — free prototype", context: "Tuna hasn't committed. Polished prototype de-risks conversation.", decision: "Build and deploy free prototype. Upsell document portal as Phase 2.", alternatives: "Wait for commitment (slower)", consequences: "V4 shipped. Waiting for validation call.", status: "ACTIVE" as const, decidedAt: new Date("2026-03-20"), tags: ["finsense", "strategy"] },
    { id: "seed-pdec-fs-competitor", workspaceId: WORKSPACE_ID, projectId: finsenseWebsite.id, authorId: GENT_ID, title: "Competitor analysis completed (Dr. Klein, Interhyp, etc.)", context: "Needed landscape positioning.", decision: "Analyzed 4 competitors. FinSense positioned as modern+personal vs. corporate.", alternatives: "Build without research (risk of generic design)", consequences: "Design decisions data-informed.", status: "ACTIVE" as const, decidedAt: new Date("2026-03-20"), tags: ["finsense", "research"] },
    // habit-monitor (1)
    { id: "seed-pdec-hm-alerts-inline", workspaceId: WORKSPACE_ID, projectId: habitMonitor.id, authorId: GENT_ID, title: "Alerts im bestehenden Prozess statt separatem Service", context: "habit-monitor liest bereits alle Metriken.", decision: "Alert-Checks im bestehenden 2s/5s Zyklus, kein separater Service.", alternatives: "Uptime Kuma (100MB+), Prometheus+Alertmanager (Overkill)", consequences: "~0ms CPU pro Alert-Check.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-04"), tags: ["monitor", "architecture"] },
    // Steuerberater Demo (3)
    { id: "seed-pdec-stb-vertical", workspaceId: WORKSPACE_ID, projectId: steuerberaterDemo.id, authorId: GENT_ID, title: "Steuerberater als erste Cold-Outreach-Vertikale", context: "53K Kanzleien, ~70% ohne brauchbare Website. Hormozi Score 7.1x.", decision: "Design-intelligence-first: Competitor analysis before code.", alternatives: "Innenarchitekten (kein warm path), Tieraerzte (weniger SOP-ready)", consequences: "Best client feedback of any Tigon website.", status: "ACTIVE" as const, decidedAt: new Date("2026-03-20"), tags: ["steuerberater", "outreach"] },
    { id: "seed-pdec-stb-design-first", workspaceId: WORKSPACE_ID, projectId: steuerberaterDemo.id, authorId: GENT_ID, title: "Design-intelligence-first build approach", context: "Demo IS the sales pitch.", decision: "Analyzed top competitor websites before writing code. Now standard.", alternatives: "Code first (weaker demo)", consequences: "Best client feedback to date.", status: "ACTIVE" as const, decidedAt: new Date("2026-03-20"), tags: ["steuerberater", "design"] },
    { id: "seed-pdec-stb-parked", workspaceId: WORKSPACE_ID, projectId: steuerberaterDemo.id, authorId: GENT_ID, title: "Outreach PARKED — GbR formalities first", context: "30 emails written, 0 sent. No business registration.", decision: "Pause all outreach until GbR + IT-Haftpflicht.", alternatives: "Send anyway (personal liability risk)", consequences: "Demo stays live as ready asset.", status: "ACTIVE" as const, decidedAt: new Date("2026-03-29"), tags: ["steuerberater", "legal"] },
    // Tigon Client Portal (6)
    { id: "seed-pdec-tcp-stage-model", workspaceId: WORKSPACE_ID, projectId: clientPortal.id, authorId: GENT_ID, title: "Schema-Shift zu Stage-Model + Knowledge Entries", context: "Portal war zu CRM-lastig. Note war zu flach.", decision: "ClientStage (6 Werte statt 3) + KnowledgeEntry mit 13 Kategorien statt Note.", alternatives: "Note behalten + Tags (zu lose), separate Models pro Typ (Tabellenexplosion)", consequences: "Matcht Ordner-CRM-Logik und reale Nutzung.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-13"), tags: ["portal", "schema"] },
    { id: "seed-pdec-tcp-nullable-client", workspaceId: WORKSPACE_ID, projectId: clientPortal.id, authorId: GENT_ID, title: "Project.clientId nullable", context: "PRODUCT + INTERNAL Projekte haben keinen Kunden.", decision: "clientId nullable. Kein Dummy-Client.", alternatives: "Dummy-Tigon-Client (verschmutzt Kundenliste)", consequences: "Saubere Projekttypen ohne Workaround.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-13"), tags: ["portal", "schema"] },
    { id: "seed-pdec-tcp-migrate-deploy", workspaceId: WORKSPACE_ID, projectId: clientPortal.id, authorId: GENT_ID, title: "Migrations statt db:push, auch im Container", context: "Vor Production muss Schema-Pfad deterministisch sein.", decision: "prisma migrate deploy mit commited Migration-Files.", alternatives: "db push (kann Daten verlieren, keine History)", consequences: "Reproduzierbar und rollback-faehig.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-13"), tags: ["portal", "infrastructure"] },
    { id: "seed-pdec-tcp-redesign", workspaceId: WORKSPACE_ID, projectId: clientPortal.id, authorId: GENT_ID, title: "Komplett-Redesign — Portal als operatives OS fuer Tigon", context: "~/tigon/ Markdown soll in DB migriert werden.", decision: "Source-of-Truth Mode B — DB primaer, naechtlicher Read-Only-Export.", alternatives: "Markdown als Source of Truth (keine Queries, keine Relations)", consequences: "Portal wird zentrale Datenquelle fuer alle operativen Daten.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-13"), tags: ["portal", "architecture"] },
    { id: "seed-pdec-tcp-prisma7-config", workspaceId: WORKSPACE_ID, projectId: clientPortal.id, authorId: GENT_ID, title: "Prisma 7 — datasource.url in prisma.config.ts", context: "Prisma 7 entfernte url aus schema.prisma datasource.", decision: "Connection-URL in prisma.config.ts statt schema.prisma.", alternatives: "Prisma 6 bleiben (outdated bei Neuaufbau)", consequences: "Prisma 7 kompatibel.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-13"), tags: ["portal", "migration"] },
    { id: "seed-pdec-tcp-env-symlink", workspaceId: WORKSPACE_ID, projectId: clientPortal.id, authorId: GENT_ID, title: "Env-File via .env.local Symlink", context: "/dev Skill erwartet .env.local, Prisma liest .env.", decision: ".env -> .env.local Symlink.", alternatives: "dotenv-cli (nicht ueberall installiert)", consequences: "CLI und Next.js lesen aus derselben Quelle.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-13"), tags: ["portal", "dx"] },
    // Tigon Website (1)
    { id: "seed-pdec-tw-prod-branch", workspaceId: WORKSPACE_ID, projectId: tigonWebsite.id, authorId: GENT_ID, title: "Production deployt von v2-redesign, nicht main", context: "Coolify pullt direkt v2-redesign. Merge nach main nie gemacht.", decision: "v2-redesign = Prod. Feature-Branches mergen dort rein.", alternatives: "Fast-Forward v2-redesign → main (unnoetige Kopplung)", consequences: "main ist quasi tot, v2-redesign ist live.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-05"), tags: ["website", "deployment"] },
    // Vasko Website (2)
    { id: "seed-pdec-vw-pro-bono", workspaceId: WORKSPACE_ID, projectId: vaskoWebsite.id, authorId: GENT_ID, title: "Pro Bono Website fuer Vasko", context: "Vasko = Kollege mit Modemarke-Startup.", decision: "Pro Bono als Einstieg, Beziehung aufbauen.", alternatives: "Bezahltes Projekt (persoenliche Beziehung, Early Stage)", consequences: "Portfolio-Stueck + Beziehung.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-01"), tags: ["vasko", "strategy"] },
    { id: "seed-pdec-vw-benchmark", workspaceId: WORKSPACE_ID, projectId: vaskoWebsite.id, authorId: GENT_ID, title: "Homepage-Redesign nach Fashion-Benchmark-Recherche", context: "Gap-Analyse zeigte 9 Luecken vs. Best Practices.", decision: "Top-5 nach ROI: Hero-Bild, 8 Sektionen, PDP Gallery, Hover-Image, Sticky CTA.", alternatives: "Alles auf einmal (zu wenig Produkte fuer manche Features)", consequences: "Data-driven Redesign.", status: "ACTIVE" as const, decidedAt: new Date("2026-04-01"), tags: ["vasko", "design"] },
    // VW Rosenheim (2)
    { id: "seed-pdec-vwr-parked", workspaceId: WORKSPACE_ID, projectId: vwRosenheim.id, authorId: GENT_ID, title: "Project PARKED — outside strategic radius", context: "VW Zentrum Rosenheim not in Tigon's geographic radius.", decision: "Project parked indefinitely. Code on GitHub for portfolio.", alternatives: "Continue development (wasted effort)", consequences: "Reactivate only if warm lead again.", status: "ACTIVE" as const, decidedAt: new Date("2026-03-29"), tags: ["vw-rosenheim", "status"] },
    { id: "seed-pdec-vwr-cleanup", workspaceId: WORKSPACE_ID, projectId: vwRosenheim.id, authorId: GENT_ID, title: "Build artifacts cleaned — 488MB recovered", context: "Build artifacts in vault wasting storage.", decision: "Deleted. Source code on GitHub as single source of truth.", alternatives: "Keep (wastes storage)", consequences: "488MB recovered.", status: "ACTIVE" as const, decidedAt: new Date("2026-03-29"), tags: ["vw-rosenheim", "cleanup"] },
  ];

  for (const d of projectDecisions) {
    await prisma.decision.upsert({ where: { id: d.id }, update: {}, create: d });
  }
  console.log(`  Project Decisions: ${projectDecisions.length} created (from docs/decisions.md)`);

  // ═══════════════════════════════════════════════════════════════════
  // PHASE 3: HANDOFFS → Journal (kind=HANDOFF)
  // ═══════════════════════════════════════════════════════════════════

  const handoffs = [
    { id: "seed-ho-aeh", kind: "HANDOFF" as const, projectId: articleEditorHub.id, authorId: GENT_ID, title: "Article Editor Hub — Fork nach SaaS", occurredAt: new Date("2026-03-31"), content: "Projekt-Scaffold angelegt. Fork als article-editor-saas erstellt. Hub bleibt als Original.", workDone: "CLAUDE.md, docs/, credentials.md angelegt", nextAction: "Aktive Entwicklung im SaaS-Repo", tags: ["fachwelt"] },
    { id: "seed-ho-aes", kind: "HANDOFF" as const, projectId: articleEditorSaas.id, authorId: GENT_ID, title: "Article Editor SaaS — Frontend→API Migration + E2E Fix", occurredAt: new Date("2026-04-01"), content: "Frontend von Supabase Edge Functions auf Hono API umgestellt. Auth-Flow gefixt. editor_freigeben auf Fire-and-Forget. API auf Coolify redeployed.", workDone: "5 Stellen in 3 Dateien migriert, zentraler API-Client, Auth-Bugs gefixt", openItems: "E2E Test: 'Fuer Editor freigeben' im Browser, VITE_API_URL als Build-Arg, freigeben Workflow TODO", landmines: "n8n SaaS Webhook muss aktiv sein. Coolify API App hat doppelte Env Vars.", nextAction: "E2E Test: 'Fuer Editor freigeben' klicken", tags: ["fachwelt"] },
    { id: "seed-ho-bb", kind: "HANDOFF" as const, projectId: baubeleg.id, authorId: GENT_ID, title: "BauBeleg — Explore Branch, kein Code-Change", occurredAt: new Date("2026-04-14"), content: "gent/explore-2026-04-13 von dev erstellt (10 commits). Dev Server kurz hochgezogen. Kein funktionaler Code-Change.", workDone: "ACTIVE-WORK.md um Explore-Branch-Claim erweitert", openItems: "Staging-Smoke-Test, /dev done, Resend API Key, OpenAI Key", landmines: "Staging-DB: prisma db push --accept-data-loss. npm run lint: Circular-JSON-Fehler.", nextAction: "Browser auf Staging → Permission-Cleanup → /dev done", tags: ["baubeleg"] },
    { id: "seed-ho-bs", kind: "HANDOFF" as const, projectId: bestattungenSchmid.id, authorId: GENT_ID, title: "Bestattungen Schmid — Prototyp deployed, Email nicht gesendet", occurredAt: new Date("2026-03-31"), content: "Full website rebuild. Deployed to Vercel. Email draft to Alexander Lohse written but NOT sent. Design: dignified, restrained.", workDone: "Next.js rebuild, Vercel deploy, Email draft", openItems: "Email an Alexander Lohse senden, Client Feedback einholen, Deal closen (€3-5K)", landmines: "Kein direkter Kontakt zum Entscheider (ueber Alexander Lohse).", nextAction: "Email an Alexander Lohse senden", tags: ["bestattungen"] },
    { id: "seed-ho-fm", kind: "HANDOFF" as const, projectId: marketplace.id, authorId: GENT_ID, title: "Marketplace — /dev start, Supabase gestartet", occurredAt: new Date("2026-04-05"), content: "Branch gent/rudolf erstellt. BauBeleg Supabase gestoppt (Port-Konflikt), Fachwelt Supabase gestartet. Prisma Client regeneriert.", workDone: "Branch, Supabase, Prisma Client, Dev-Server", openItems: "Seed-Daten, Approval-Workflow E2E, Public-Facing Pages, Email, Image Upload", landmines: "BauBeleg Supabase gestoppt. Next 16: middleware.ts deprecated → proxy.ts. Port 3000 Zombie-Prozesse.", nextAction: "Seed-Script erweitern", tags: ["fachwelt", "marketplace"] },
    { id: "seed-ho-fr", kind: "HANDOFF" as const, projectId: redaktionsassistent.id, authorId: GENT_ID, title: "Redaktion — Warten auf Kunden-Credentials", occurredAt: new Date("2026-03-31"), content: "Lovable original functional. Next.js port abandoned. SaaS fork initiated. Edon handles Marketplace, Gent handles Redaktion + WebMag.", workDone: "Docs structure, SaaS fork decision", openItems: "OpenAI API Key, WordPress Passwords, Real editorial data testing", landmines: "Credentials vom Kunden muessen kommen.", nextAction: "Client provides credentials", tags: ["fachwelt"] },
    { id: "seed-ho-fs", kind: "HANDOFF" as const, projectId: finsenseWebsite.id, authorId: GENT_ID, title: "FinSense — V4 shipped, warten auf Tuna", occurredAt: new Date("2026-03-31"), content: "V4 Serif redesign live. Competitor research done. Gent added as collaborator.", workDone: "V4 build, deploy, competitor analysis", openItems: "Tuna Validation Call, echtes Foto, V1 vs V4 Entscheidung, Document Portal Upsell", nextAction: "Tuna Validation Call abwarten", tags: ["finsense"] },
    { id: "seed-ho-hf", kind: "HANDOFF" as const, projectId: habitFiles.id, authorId: GENT_ID, title: "HABIT Files — Ubuntu Yaru UI-Redesign", occurredAt: new Date("2026-04-11"), content: "UI-Theme auf Ubuntu Yaru umgestellt. File-Icons nach Extension. Sidebar: Other Locations statt System-Pfaden.", workDone: "Aubergine/Orange Theme, Emoji Icons, Nautilus Sidebar", openItems: "Browser-Test nach Hard-Reload, Bundle-Size (628KB CodeMirror)", landmines: "Bindet NUR auf Tailscale-IP. localhost:4100 funktioniert NICHT vom Server.", nextAction: "Browser Ctrl+Shift+R auf http://habit:4100", tags: ["habit"] },
    { id: "seed-ho-hm", kind: "HANDOFF" as const, projectId: habitMonitor.id, authorId: GENT_ID, title: "HABIT Monitor — Telegram Alerts live", occurredAt: new Date("2026-04-04"), content: "CPU/RAM/Disk/Temp/Docker Alerts. Formatierte Nachrichten. E2E verifiziert.", workDone: "Alert-System, Temp-Bar Fix, systemd Service", openItems: "Optional: SQLite 24h Rolling Window", landmines: "Bot Token + Chat ID in systemd Unit (nicht .env). Git-Repo lokal-only.", nextAction: "Abwarten ob weitere Alert-Typen benoetigt", tags: ["habit", "monitor"] },
    { id: "seed-ho-ht", kind: "HANDOFF" as const, projectId: hurghadaTours.id, authorId: GENT_ID, title: "Hurghada Tours — 17 echte Touren live, Featured Grid", occurredAt: new Date("2026-04-11"), content: "17 echte Touren integriert. Highlight-Block 6→5 Touren. Featured-Grid: 3+2 Layout. TourCard kompakter.", workDone: "Real catalog, Featured Grid, PR #3 merged", openItems: "Stats-Zahlen UWG raus, Impressum/Datenschutz, docs/project.yaml, Loom an Amo", landmines: "NIE gh pr merge --delete-branch bei dev→main. HMR blockiert Cross-Origin. Port 3000 stale.", nextAction: "Stats-Zahlen aus Hero raus", tags: ["hurghada"] },
    { id: "seed-ho-tcp", kind: "HANDOFF" as const, projectId: clientPortal.id, authorId: GENT_ID, title: "Client Portal — Multi-Tenancy Hardening + Nightly Export", occurredAt: new Date("2026-04-14"), content: "4 P0 Leaks + 8 FK-Injection-Stellen gefixt. Dashboard Deadlines Widget. Nightly-Export Cron live. /dev push durchgelaufen.", workDone: "Security fixes, Dashboard Widget, Export Script, /dev push", openItems: "Staging-Rebuild verifizieren, Seed-Script umschreiben, workspaceId propagation, /dev done", landmines: "Staging-DB Port 54329 nicht extern erreichbar. Dev-DB hat Live-Daten. Tenant-Leak-Pattern.", nextAction: "Browser-Test Multi-Assign auf Staging", tags: ["portal"] },
    { id: "seed-ho-tw", kind: "HANDOFF" as const, projectId: tigonWebsite.id, authorId: GENT_ID, title: "Tigon Website — Favicon getauscht", occurredAt: new Date("2026-04-14"), content: "Tigon-T Favicon (#EB7028 auf schwarz, multi-size ICO). Rebase von v2-redesign.", workDone: "Favicon, Rebase 25 Commits", openItems: "Google-Cache zeigt altes Favicon (1-4 Wochen). main bleibt stale.", landmines: "Prod-Branch = v2-redesign. Push = direkter Deploy. Kein dev Branch. Favicon redundant.", nextAction: "Offen — Einzelfix", tags: ["website"] },
    { id: "seed-ho-vw", kind: "HANDOFF" as const, projectId: vaskoWebsite.id, authorId: GENT_ID, title: "Vasko — Homepage + PDP ueberarbeitet, Coolify deployed", occurredAt: new Date("2026-04-01"), content: "Hero, Announcement Bar, Editorial, Instagram, Newsletter. PDP Multi-Image Gallery. Sticky Mobile CTA. Shop-Filter fix. Deployed: five.surfingtigon.com.", workDone: "8 Homepage-Sektionen, PDP Gallery, Hover-Images, Coolify Deploy", openItems: "Stripe, Cart, Legal Pages, Newsletter Backend, Custom Domain", landmines: "Vercel-Deployment versehentlich angelegt+geloescht.", nextAction: "Link an Vasko schicken, Feedback einholen", tags: ["vasko"] },
    { id: "seed-ho-vwr", kind: "HANDOFF" as const, projectId: vwRosenheim.id, authorId: GENT_ID, title: "VW Rosenheim — PARKED", occurredAt: new Date("2026-03-31"), content: "Prototype built. Build artifacts cleaned (488MB). No active development.", workDone: "Prototype, build artifacts cleanup", nextAction: "None. Parked.", tags: ["vw-rosenheim"] },
  ];

  for (const h of handoffs) {
    await prisma.journal.upsert({ where: { id: h.id }, update: {}, create: h });
  }
  console.log(`  Handoffs: ${handoffs.length} created (from docs/handoff.md)`);

  // ═══════════════════════════════════════════════════════════════════
  // PHASE 3: CHANGELOGS → Journal (kind=CHANGELOG)
  // ═══════════════════════════════════════════════════════════════════

  const changelogs = [
    // Article Editor SaaS
    { id: "seed-cl-aes-s3", kind: "CHANGELOG" as const, projectId: articleEditorSaas.id, authorId: GENT_ID, title: "Frontend→API Migration + E2E Fix", occurredAt: new Date("2026-04-01"), content: "Frontend von Supabase Edge Functions auf Hono API. Zentraler API-Client. editor_freigeben Fire-and-Forget. Auth-Flow gefixt.", tags: ["fachwelt"] },
    { id: "seed-cl-aes-s2", kind: "CHANGELOG" as const, projectId: articleEditorSaas.id, authorId: GENT_ID, title: "Coolify Deployment", occurredAt: new Date("2026-04-01"), content: "API Service deployed (api-editor.surfingtigon.com). Frontend deployed (editor.surfingtigon.com). Multi-stage Dockerfile. Env Vars gesetzt.", tags: ["fachwelt", "deployment"] },
    { id: "seed-cl-aes-s1", kind: "CHANGELOG" as const, projectId: articleEditorSaas.id, authorId: GENT_ID, title: "n8n Workflow Patch + Edge Functions", occurredAt: new Date("2026-04-01"), content: "18 OpenAI-Nodes gepatcht. DB-Nodes durch Pass-Through ersetzt. handleEditorFreigeben + handleKiZurueck implementiert.", tags: ["fachwelt"] },
    // BauBeleg (8 changelog entries, condensed)
    { id: "seed-cl-bb-0412", kind: "CHANGELOG" as const, projectId: baubeleg.id, authorId: GENT_ID, title: "Firma-Modell + Einstellungen + Mail-Versand", occurredAt: new Date("2026-04-12"), content: "Firma-Stammdaten erweitert, Logo/Briefkopf Upload via MinIO, alle PDFs nutzen dynamische Firma-Daten, Mail-Versand via Resend, Einstellungen-Seite.", tags: ["baubeleg"] },
    { id: "seed-cl-bb-0411", kind: "CHANGELOG" as const, projectId: baubeleg.id, authorId: GENT_ID, title: "Permission-Normalisierung", occurredAt: new Date("2026-04-11"), content: "Defense-in-Depth: /api/baubeleg/entwuerfe prueft Permission statt Role. 5 Role-Checks durch useCan()/hasPermission() ersetzt. Uniform: Frontend useCan(), Backend hasPermission().", tags: ["baubeleg", "security"] },
    { id: "seed-cl-bb-0410", kind: "CHANGELOG" as const, projectId: baubeleg.id, authorId: GENT_ID, title: "Listenseiten + Soft-Delete + Entwurf-Button", occurredAt: new Date("2026-04-10"), content: "Baubeleg/Behinderung-Listenseiten mit Tabs. Soft-Delete mit 2-Klick-Bestaetigung. Zuletzt-geloescht-Seite (GF only). Als-Entwurf-speichern-Button. Generalunternehmer→Auftraggeber rename.", tags: ["baubeleg"] },
    { id: "seed-cl-bb-0409", kind: "CHANGELOG" as const, projectId: baubeleg.id, authorId: GENT_ID, title: "Branch-Konsolidierung + Mitarbeiter-Auth + Auth-Store Fix", occurredAt: new Date("2026-04-09"), content: "dev→main merged (16 Commits). 15 stale Branches geloescht. Mitarbeiter-Auth via Handynummer+PIN. Auth-Store Hydration Bug gefixt.", tags: ["baubeleg"] },
    { id: "seed-cl-bb-0408", kind: "CHANGELOG" as const, projectId: baubeleg.id, authorId: GENT_ID, title: "Storage-Migration MinIO + Auth-Logout + Security Fix", occurredAt: new Date("2026-04-08"), content: "Supabase SDK entfernt, alle Routes auf MinIO. Logout auf JWT-Endpunkt. Firma-Scope-Check auf Stundenlohnzettel-PDF. Supabase-Pakete entfernt.", tags: ["baubeleg", "security"] },
    { id: "seed-cl-bb-0401", kind: "CHANGELOG" as const, projectId: baubeleg.id, authorId: GENT_ID, title: "Rebranding Nachtrag→Baubeleg", occurredAt: new Date("2026-04-01"), content: "44+ Dateien: API-Routen, Page-Routen, Types, Store, Localization, Docs. Prisma @@map. NT-→BB-. Repo umbenannt.", tags: ["baubeleg", "refactor"] },
    { id: "seed-cl-bb-0331", kind: "CHANGELOG" as const, projectId: baubeleg.id, authorId: GENT_ID, title: "Vercel→Coolify Migration (DSGVO)", occurredAt: new Date("2026-03-31"), content: "Migrated to Coolify Hetzner VPS Frankfurt. Live: baubeleg.surfingtigon.com.", tags: ["baubeleg", "deployment"] },
    { id: "seed-cl-bb-init", kind: "CHANGELOG" as const, projectId: baubeleg.id, authorId: GENT_ID, title: "Initial MVP — Agent-based, PWA, PDF", occurredAt: new Date("2026-03-25"), content: "Agent-based MVP deployed. Full PWA, 3-Step Wizard, PDF generation. 3-Round UX review, 9 blockers identified.", tags: ["baubeleg", "launch"] },
    // Fachwelt Marketplace
    { id: "seed-cl-fm-0404", kind: "CHANGELOG" as const, projectId: marketplace.id, authorId: GENT_ID, title: "Coolify Staging + Prod Environments", occurredAt: new Date("2026-04-04"), content: "Dockerfile fuer Prisma 7 gefixt. Edge Functions deaktiviert. Prod: marketplace.surfingtigon.com, Staging: staging-marketplace.surfingtigon.com.", tags: ["marketplace", "deployment"] },
    { id: "seed-cl-fm-init", kind: "CHANGELOG" as const, projectId: marketplace.id, authorId: EDON_ID, title: "Full platform built from spec v1.0", occurredAt: new Date("2026-03-18"), content: "Auth, DB, Admin, Hersteller-Portal. Deployed to Coolify. 2 Audit-Runden (29 Fixes), Seed-Daten.", tags: ["marketplace", "launch"] },
    // Fachwelt Redaktion
    { id: "seed-cl-fr-init", kind: "CHANGELOG" as const, projectId: redaktionsassistent.id, authorId: GENT_ID, title: "Initial repo setup + SaaS fork", occurredAt: new Date("2026-03-31"), content: "Next.js port cloned. Dependencies installed. SaaS fork created to replace n8n.", tags: ["fachwelt"] },
    // habit-files
    { id: "seed-cl-hf-0411", kind: "CHANGELOG" as const, projectId: habitFiles.id, authorId: GENT_ID, title: "Ubuntu Yaru UI Redesign", occurredAt: new Date("2026-04-11"), content: "Aubergine/Orange Theme, Ubuntu Fonts, File-Type-Icons (Emoji), Nautilus-Style Sidebar.", tags: ["habit"] },
    // habit-monitor
    { id: "seed-cl-hm-alerts", kind: "CHANGELOG" as const, projectId: habitMonitor.id, authorId: GENT_ID, title: "Telegram Alerts + Temp-Bar Fix", occurredAt: new Date("2026-04-04"), content: "CPU/RAM/Disk/Temp/Docker Alerts mit Cooldown. Temp-Bar Gradient Fix. Dev-Server Port-Erkennung Fix. Docker Panel: gruppiert, collapsible.", tags: ["monitor"] },
    // Hurghada Tours
    { id: "seed-cl-ht-catalog", kind: "CHANGELOG" as const, projectId: hurghadaTours.id, authorId: GENT_ID, title: "Echter Katalog + Featured Grid Redesign", occurredAt: new Date("2026-04-11"), content: "17 echte Touren. Neue Kategorie transfers. priceFrom optional. Featured-Block 5 Touren, 3+2 Grid. TourCard kompakter. Echte WhatsApp-Nummer.", tags: ["hurghada"] },
    // Steuerberater Demo
    { id: "seed-cl-stb-init", kind: "CHANGELOG" as const, projectId: steuerberaterDemo.id, authorId: GENT_ID, title: "Initial build + Outreach PARKED", occurredAt: new Date("2026-03-20"), content: "Design-intelligence-first build. Demo at steuerberater-demo.vercel.app. Cold outreach parked — GbR first.", tags: ["steuerberater"] },
    // Tigon Client Portal
    { id: "seed-cl-tcp-0414", kind: "CHANGELOG" as const, projectId: clientPortal.id, authorId: GENT_ID, title: "Multi-Tenancy Hardening + Dashboard", occurredAt: new Date("2026-04-14"), content: "4 P0 Tenant-Leaks geschlossen. FK-Injection-Guards. Task-Status PATCH. Credentials Validation. Multi-Assign. Dashboard Deadlines. Nightly-Export Cron.", tags: ["portal", "security"] },
    { id: "seed-cl-tcp-0413", kind: "CHANGELOG" as const, projectId: clientPortal.id, authorId: GENT_ID, title: "Schema-Redesign + Admin-Dashboard + Aufgaben + Wissen", occurredAt: new Date("2026-04-13"), content: "ClientStage (6 Werte). KnowledgeEntry (13 Kategorien) statt Note. Task-System (Board, Filter, Inline-Create). Wissen-Page (Markdown, Tags, Pin). Task-Detail/Edit.", tags: ["portal"] },
    // Tigon Website
    { id: "seed-cl-tw-0414", kind: "CHANGELOG" as const, projectId: tigonWebsite.id, authorId: GENT_ID, title: "Favicon + Portfolio-Section entfernt", occurredAt: new Date("2026-04-14"), content: "Tigon-T Favicon (multi-size ICO). Portfolio-Section von Homepage entfernt. allowedDevOrigins fuer Tailscale.", tags: ["website"] },
    // Vasko Website
    { id: "seed-cl-vw-init", kind: "CHANGELOG" as const, projectId: vaskoWebsite.id, authorId: GENT_ID, title: "Homepage + PDP + Shop + Coolify Deploy", occurredAt: new Date("2026-04-01"), content: "Hero, Announcement Bar, Editorial, Instagram, Newsletter CTA. PDP Gallery. Hover-Images. Shop-Filter. Sticky Mobile CTA. Deployed: five.surfingtigon.com.", tags: ["vasko"] },
    // VW Rosenheim
    { id: "seed-cl-vwr-init", kind: "CHANGELOG" as const, projectId: vwRosenheim.id, authorId: GENT_ID, title: "Initial Build + Parked", occurredAt: new Date("2026-03-29"), content: "Next.js 16.2 prototype. Parked — outside strategic radius. Build artifacts deleted (488MB).", tags: ["vw-rosenheim"] },
  ];

  for (const c of changelogs) {
    await prisma.journal.upsert({ where: { id: c.id }, update: {}, create: c });
  }
  console.log(`  Changelogs: ${changelogs.length} created (from docs/changelog.md)`);

  // ═══════════════════════════════════════════════════════════════════
  // PHASE 3: PLANS/SPECS/RESEARCH/IDEAS → KnowledgeEntry
  // ═══════════════════════════════════════════════════════════════════

  const projectKnowledge = [
    // PLANS
    { id: "seed-ke-plan-imap-poller", workspaceId: WORKSPACE_ID, projectId: articleEditorSaas.id, authorId: GENT_ID, title: "IMAP-Poller Service Plan", content: "Eigenstaendiger Node.js Service mit ImapFlow. 8 Steps: Skeleton → Config → Prompts → Pipeline → IMAP Client → Main Loop → Test → systemd. Poll 60s, sequentielle Verarbeitung, .last-uid Crash-Safety.", category: "PLAN" as const, tags: ["fachwelt", "imap"] },
    { id: "seed-ke-plan-nachrichten", workspaceId: WORKSPACE_ID, projectId: baubeleg.id, authorId: GENT_ID, title: "Nachrichten — GF→Mitarbeiter Dashboard-Messaging", content: "3 Nachrichtentypen: INFO (read), QUITTIERUNG (acknowledge — Killer-Feature), ANWEISUNG (baustelle-linked). Append-only. Prisma Model: Nachricht + NachrichtEmpfaenger. 4-Tage-Scope: DB+API, GF-UI, MA-UI, Polish. Kein Chat, keine Antworten in MVP.", category: "PLAN" as const, tags: ["baubeleg", "feature"] },
    { id: "seed-ke-plan-supabase-migration", workspaceId: WORKSPACE_ID, projectId: baubeleg.id, authorId: GENT_ID, title: "Supabase → Native Stack Migration Plan", content: "4 Phasen: Auth (bcryptjs+jose) DONE, Storage (MinIO) DONE, DB Connection Switch OFFEN, Cleanup DONE. Cookie-Config, JWT Claims, Token Refresh Flow, Security Checklist dokumentiert.", category: "PLAN" as const, tags: ["baubeleg", "migration"] },
    { id: "seed-ke-plan-werkzeug", workspaceId: WORKSPACE_ID, projectId: baubeleg.id, authorId: GENT_ID, title: "Werkzeug-Management — Spec Draft", content: "Werkzeuge nachvollziehbar zwischen Lager/Fahrzeug/Mitarbeiter bewegen. WerkzeugBewegung Log. Offene Entscheidungen: Ordnung, Dokumentation, UI-Eingabe, Zuordnungsmodell.", category: "PLAN" as const, tags: ["baubeleg", "feature"] },
    { id: "seed-ke-plan-hurghada-v1", workspaceId: WORKSPACE_ID, projectId: hurghadaTours.id, authorId: GENT_ID, title: "Hurghada Tours V1 Plan", content: "Reisebuero Hurghada. Mittelsmann-Modell. Branchen-Research: 5 Top-Performer analysiert. Key Insight: WhatsApp = Haupt-Buchungskanal, kein Payment-Gateway in V1. Site-Struktur, Tech-Stack (Next.js, Sanity CMS, next-intl), Feature-Slices.", category: "PLAN" as const, tags: ["hurghada"] },
    { id: "seed-ke-plan-vasko-architecture", workspaceId: WORKSPACE_ID, projectId: vaskoWebsite.id, authorId: GENT_ID, title: "Vasko Architecture — Dark Luxury E-Commerce", content: "Stack: Next.js + Stripe (kein eigenes Backend). Keine Auth (Guest Checkout). Design: Schwarz + Crimson, Serif/Sans-Serif, viel Schwarzraum. E-Commerce: Cart localStorage → Stripe Checkout. 5 Feature-Slices.", category: "PLAN" as const, tags: ["vasko", "architecture"] },
    { id: "seed-ke-plan-vasko-discovery", workspaceId: WORKSPACE_ID, projectId: vaskoWebsite.id, authorId: GENT_ID, title: "Vasko Discovery — Scope + DSGVO + Pre-Mortem", content: "Pro Bono. Brand-Website + E-Commerce Shop. DSGVO: LOW risk (nur Stripe Checkout). Pre-Mortem: Fotos, Stripe-Konto, Domain. Kein Blog, kein Login, kein CRM.", category: "PLAN" as const, tags: ["vasko", "discovery"] },
    // SPECS
    { id: "seed-ke-spec-baubeleg", workspaceId: WORKSPACE_ID, projectId: baubeleg.id, authorId: GENT_ID, title: "BauBeleg Functional Spec", content: "Mobile-first PWA. 2 Rollen: GF (Vollzugriff) + Mitarbeiter (eingeschraenkt). 5 Phasen: MVP DONE, Rapporte DONE, Multi-User DONE, Erweiterungen OFFEN, Polish OFFEN. Constraints: Rechtsverbindlich, BAG-Urteil 2022 Uhrzeiten, kein type=number.", category: "SPEC" as const, tags: ["baubeleg"] },
    { id: "seed-ke-spec-marketplace", workspaceId: WORKSPACE_ID, projectId: marketplace.id, authorId: GENT_ID, title: "Industrie-Marketplace Funktionsspezifikation v1.0", content: "3 Rollen: Admin, Hersteller, Besucher. Anfragen landen IMMER beim Redakteur. Hersteller-Freigabe-Workflow. Dashboard mit Kennzahlen. Provisionen manuell. 13 offene Punkte (Plattformname, Domain, etc.).", category: "SPEC" as const, tags: ["marketplace", "fachwelt"] },
    // RESEARCH
    { id: "seed-ke-research-n8n-analysis", workspaceId: WORKSPACE_ID, projectId: articleEditorSaas.id, authorId: GENT_ID, title: "n8n Workflow-Analyse — 4 Fachwelt Workflows", content: "4 Workflows: Posteingang (21 Nodes, 2 AI), Editor (81 Nodes, 18 AI), KI-Agent (12 Nodes, 1 AI), Freigabe (40+ Nodes, WordPress). Total: 22 AI-Calls + 12 Code-Steps = 34 pro Email (Worst Case).", category: "RESEARCH" as const, tags: ["fachwelt", "n8n"] },
    { id: "seed-ke-research-saas-split", workspaceId: WORKSPACE_ID, projectId: articleEditorSaas.id, authorId: GENT_ID, title: "SaaS Split: Code vs. n8n — 25 kundenspezifische Konfigpunkte", content: "Hartcodiert (universell): IMAP, Relevanz, Metadaten, Bild-Upload, Sprache, DB-Ops, WordPress API, Change-Agent. In n8n (pro Kunde): 14 Editor-Konfigs, 10+ Freigabe-Konfigs, 1 KI-Agent-Konfig. Posteingang+KI-Agent DONE.", category: "RESEARCH" as const, tags: ["fachwelt", "architecture"] },
    { id: "seed-ke-research-system-arch", workspaceId: WORKSPACE_ID, projectId: articleEditorSaas.id, authorId: GENT_ID, title: "Systemarchitektur — Article Editor SaaS", content: "5 Komponenten: Frontend (Vite/React), Supabase (selfhosted, DB+Storage+Auth), IMAP Poller (systemd), Hono API (Coolify), WordPress (4 Portale). 21 AI Calls pro Email worst case. n8n wird schrittweise ersetzt.", category: "SPEC" as const, tags: ["fachwelt", "architecture"] },
    { id: "seed-ke-research-whitelabel", workspaceId: WORKSPACE_ID, projectId: marketplace.id, authorId: GENT_ID, title: "Fachwelt White-Label Research — German Fachverlag Market", content: "€8.55B Markt, 46% digital. ~300 addressable Mittelstand publishers. Gap: Kein turnkey B2B marketplace als White-Label SaaS. Unit Economics: 5 clients Y1 = €55-110K. Pricing: €5-10K Setup + €500-1K/Mo SaaS.", category: "RESEARCH" as const, tags: ["fachwelt", "market-research"] },
    { id: "seed-ke-research-vasko-brand", workspaceId: WORKSPACE_ID, projectId: vaskoWebsite.id, authorId: GENT_ID, title: "Society de Five Brand Analysis", content: "Instagram @societydefive. Dark Luxury Aesthetic: Schwarz + Crimson, Casino/Poker-Atmosphaere, cinematic Bildsprache. Tone: kryptisch, kurz, mysterioes. Fur Coat = Hero-Piece.", category: "RESEARCH" as const, tags: ["vasko", "brand"] },
    { id: "seed-ke-research-vasko-bench", workspaceId: WORKSPACE_ID, projectId: vaskoWebsite.id, authorId: GENT_ID, title: "Fashion Website Benchmarks", content: "10+ Marken analysiert (Pangaia, Aime Leon Dore, Fear of God, COS, etc.). 3 Farbansaetze: Monochromatisch, Dark/Moody, Single Accent. Serif = Luxury-Signaling. Lifestyle-first Bildsprache.", category: "RESEARCH" as const, tags: ["vasko", "benchmarks"] },
    // PROJECT-LEVEL IDEAS
    { id: "seed-ke-idea-aes-crm-match", workspaceId: WORKSPACE_ID, projectId: articleEditorSaas.id, authorId: GENT_ID, title: "Kunden-Erkennung ohne KI via CRM-Match", content: "Absender-Email gegen CRM matchen statt o3-mini Metadaten-Extraktion. Firma, Ansprechpartner, Telefon direkt aus CRM.", category: "IDEA" as const, tags: ["fachwelt", "optimization"] },
    { id: "seed-ke-idea-bb-whatsapp", workspaceId: WORKSPACE_ID, projectId: baubeleg.id, authorId: GENT_ID, title: "BauBeleg Feature-Ideas: WhatsApp Share, Offline, Multilingual", content: "WhatsApp Share (One-tap PDF), Offline Mode (Service Worker), Multilingual (Albanian/Turkish), Rapporte+Zeiterfassung, Bescheinigungen-Hub, E-Rechnung Hook, Bautagebuch, Photo-GPS, Push Notifications, Bulk PDF, Template Library.", category: "IDEA" as const, tags: ["baubeleg", "features"] },
    { id: "seed-ke-idea-bs-features", workspaceId: WORKSPACE_ID, projectId: bestattungenSchmid.id, authorId: GENT_ID, title: "Bestattungen Schmid Feature-Ideas", content: "Online Kondolenzbuch, Terminbuchung, FAQ-Section, Google Maps, Testimonials (sensibel!), Service-Pakete, Multilingual (Tuerkisch/Arabisch).", category: "IDEA" as const, tags: ["bestattungen"] },
    { id: "seed-ke-idea-fs-features", workspaceId: WORKSPACE_ID, projectId: finsenseWebsite.id, authorId: GENT_ID, title: "FinSense Feature-Ideas", content: "Document Collection Portal (Phase 2 Upsell), Client Dashboard, Real Photo, Calculator Enhancements, Testimonials, Blog/Ratgeber (SEO), Google Reviews, WhatsApp/Calendly.", category: "IDEA" as const, tags: ["finsense"] },
    { id: "seed-ke-idea-fr-features", workspaceId: WORKSPACE_ID, projectId: redaktionsassistent.id, authorId: GENT_ID, title: "Redaktion Feature-Ideas: White-Label, Analytics, Thread-Context", content: "Multi-publisher White-Label SaaS, Workflow Templates pro Publisher-Typ, Analytics Dashboard (AI acceptance rate), Email Thread Context, Bulk Operations.", category: "IDEA" as const, tags: ["fachwelt"] },
    { id: "seed-ke-idea-vwr-features", workspaceId: WORKSPACE_ID, projectId: vwRosenheim.id, authorId: GENT_ID, title: "VW Rosenheim Feature-Ideas (Reference)", content: "Vehicle Inventory Integration, Used Car Marketplace, Financing Calculator, Service Booking, Service History Portal, Virtual Showroom, Test Drive Booking, Customer Reviews.", category: "IDEA" as const, tags: ["vw-rosenheim", "reference"] },
    // CLIENT QUESTIONS
    { id: "seed-ke-client-questions-fm", workspaceId: WORKSPACE_ID, projectId: marketplace.id, clientId: fachwelt.id, authorId: GENT_ID, title: "Fachwelt — Questions for Client (13 Fragen)", content: "MUST before dev: Plattformname, Domain, E-Mail-Absender, Corporate Design, Impressum. During dev: Startinhalt, Freigabe-Workflow, Reaktionszeit, Stripe, Hersteller-Sichtbarkeit, Benachrichtigungen, Datenvolumen, Bestehende Daten.", category: "OTHER" as const, tags: ["fachwelt", "client-questions"] },
    // TODOS (baubeleg-specific from docs/todos.md)
    { id: "seed-ke-todos-baubeleg", workspaceId: WORKSPACE_ID, projectId: baubeleg.id, authorId: GENT_ID, title: "BauBeleg Projekt-Todos", content: "Features: Briefkopf Upload, Werkzeug-Management, PDF-Templates. Bugs: Dezimal-Input (CRITICAL), Passwort-Feld Klartext. Infra: PG 17 Coolify, MinIO Buckets.", category: "OTHER" as const, tags: ["baubeleg", "todos"] },
  ];

  for (const ke of projectKnowledge) {
    await prisma.knowledgeEntry.upsert({ where: { id: ke.id }, update: {}, create: ke });
  }
  console.log(`  Project Knowledge: ${projectKnowledge.length} created (plans, specs, research, ideas from docs/)`);

  // ═══════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n✅ Seed complete!");
  console.log("─".repeat(50));
  console.log("Clients:      Fachwelt (ACTIVE), Horbach (ACTIVE), Vasko (PRO_BONO), LUMINAR (WARM) + Demo Kunde");
  console.log("Contacts:     Alija, Katrin, Marlon, Paul, Jonathan, Vasko, Hr. Eid + " + networkContacts.length + " Network");
  console.log("Client User:  ap@fachwelt-verlag.de / portal2026");
  console.log("Projects:     20 total (incl. Tigon Operations, Steuerberater Demo, Article Editor Hub)");
  console.log("Milestones:   15");
  console.log(`Tasks:        ${tasks.length} (projects) + ${businessTasks.length} (todos.md) + ${initiatives.length} (backlog.md)`);
  console.log(`Leads:        ${leads.length} (warm + cold pipeline)`);
  console.log(`Knowledge:    ${entries.length} + ${ideas.length} ideas + ${sharedInsights.length} insights + ${projectKnowledge.length} project docs`);
  console.log(`Impulses:     ${impulses.length}`);
  console.log(`Servers:      ${servers.length}`);
  console.log(`Expenses:     ${expenses.length}`);
  console.log(`Pipeline:     ${estimates.length} estimates`);
  console.log(`Activities:   ${activities.length}`);
  console.log(`Decisions:    ${decisions.length} + ${allDecisions.length} (decisions.md) + ${projectDecisions.length} (project docs)`);
  console.log(`Journals:     ${journalEntries.length} (journal.md) + ${handoffs.length} (handoffs) + ${changelogs.length} (changelogs)`);
  console.log("Workspace:    Updated (description, objective, techStack, MRR=0, burn=€190)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
