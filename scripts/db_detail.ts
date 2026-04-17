import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const line = "─".repeat(78);
const dline = "━".repeat(78);
const p = (s: string) => console.log(s);

async function main() {
  const ws = (await prisma.workspace.findFirst())!;

  // ===== USERS =====
  p(dline); p(`  USERS (3)`); p(dline);
  const users = await prisma.user.findMany({
    where: { workspaceId: ws.id },
    select: { role: true, name: true, email: true, clientId: true, createdAt: true, lastLoginAt: true },
  });
  for (const u of users) {
    const last = u.lastLoginAt ? u.lastLoginAt.toISOString().slice(0, 10) : "nie";
    p(`  ${u.role.padEnd(7)} ${u.name.padEnd(22)} ${u.email.padEnd(38)} login:${last}`);
  }

  // ===== CLIENTS =====
  p(`\n${dline}`); p(`  CLIENTS (13)`); p(dline);
  const clients = await prisma.client.findMany({
    where: { workspaceId: ws.id, deletedAt: null },
    select: { slug: true, name: true, stage: true, industry: true, createdAt: true },
    orderBy: [{ stage: "asc" }, { slug: "asc" }],
  });
  for (const c of clients) {
    p(`  ${c.stage.padEnd(9)} ${c.slug.padEnd(22)} ${(c.name || "").padEnd(30)} ${c.industry || ""}`);
  }

  // ===== PROJECTS =====
  p(`\n${dline}`); p(`  PROJECTS (21)`); p(dline);
  const projects = await prisma.project.findMany({
    where: { workspaceId: ws.id, deletedAt: null },
    select: {
      name: true, slug: true, status: true,
      client: { select: { slug: true } },
      _count: { select: { tasks: true, milestones: true, impulses: true } },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
  for (const pr of projects) {
    p(`  ${(pr.status || "—").padEnd(11)} ${(pr.client?.slug || "-").padEnd(20)} ${pr.name.padEnd(30)} t:${pr._count.tasks} m:${pr._count.milestones} i:${pr._count.impulses}`);
  }

  // ===== TASKS =====
  p(`\n${dline}`); p(`  TASKS (86) — Verteilung`); p(dline);
  const tasksByStatus = await prisma.task.groupBy({
    by: ["status"], where: { project: { workspaceId: ws.id } }, _count: true,
  });
  const tasksByPriority = await prisma.task.groupBy({
    by: ["priority"], where: { project: { workspaceId: ws.id } }, _count: true,
  });
  p(`  Status:`);
  for (const t of tasksByStatus.sort((a,b) => b._count - a._count)) {
    p(`    ${t.status.padEnd(14)} ${t._count}`);
  }
  p(`  Priority:`);
  for (const t of tasksByPriority.sort((a,b) => b._count - a._count)) {
    p(`    ${(t.priority || "null").padEnd(14)} ${t._count}`);
  }
  p(`  Top 5 nach Projekten (OPEN tasks):`);
  const openByProject = await prisma.task.groupBy({
    by: ["projectId"],
    where: { project: { workspaceId: ws.id }, status: "OPEN" },
    _count: true,
    orderBy: { _count: { projectId: "desc" } },
    take: 5,
  });
  for (const r of openByProject) {
    const pr = await prisma.project.findUnique({ where: { id: r.projectId! }, select: { name: true, client: { select: { slug: true } } } });
    p(`    ${r._count}x  ${pr?.client?.slug ?? "-"} / ${pr?.name}`);
  }

  // ===== KNOWLEDGE =====
  p(`\n${dline}`); p(`  KNOWLEDGE ENTRIES (251)`); p(dline);
  const kByCat = await prisma.knowledgeEntry.groupBy({
    by: ["category"], where: { workspaceId: ws.id, deletedAt: null }, _count: true,
  });
  p(`  Nach Kategorie:`);
  for (const k of kByCat.sort((a,b) => b._count - a._count)) {
    p(`    ${k.category.padEnd(14)} ${k._count}`);
  }
  p(`  Workspace-Level (kein Client): 194`);
  p(`  Client-zugeordnet:              57`);
  const kAll = await prisma.knowledgeEntry.findMany({
    where: { workspaceId: ws.id, deletedAt: null },
    select: { tags: true, content: true },
  });
  const tagCount = new Map<string, number>();
  for (const e of kAll) for (const t of e.tags) tagCount.set(t, (tagCount.get(t) || 0) + 1);
  p(`  Top 10 Tags:`);
  for (const [t, c] of [...tagCount.entries()].sort((a,b) => b[1] - a[1]).slice(0, 10)) {
    p(`    ${t.padEnd(30)} ${c}`);
  }
  const totalChars = kAll.reduce((s, e) => s + (e.content?.length || 0), 0);
  p(`  Total Content: ${(totalChars / 1024).toFixed(0)} KB Text (${kAll.length} Einträge)`);

  // ===== CREDENTIALS =====
  p(`\n${dline}`); p(`  CREDENTIALS (10) — alle verschlüsselt`); p(dline);
  const creds = await prisma.credential.findMany({
    where: { workspaceId: ws.id, deletedAt: null },
    select: { label: true, type: true, client: { select: { slug: true } } },
    orderBy: { label: "asc" },
  });
  for (const c of creds) {
    p(`  ${c.type.padEnd(10)} ${c.label.padEnd(45)} ${c.client?.slug ?? "workspace"}`);
  }

  // ===== DOCUMENTS =====
  p(`\n${dline}`); p(`  DOCUMENTS (159)`); p(dline);
  const docs = await prisma.document.findMany({
    where: { workspaceId: ws.id, deletedAt: null },
    select: { mimeType: true, sizeBytes: true, category: true, tags: true },
  });
  const mimeCount = new Map<string, { n: number; bytes: number }>();
  for (const d of docs) {
    const m = mimeCount.get(d.mimeType) || { n: 0, bytes: 0 };
    m.n++; m.bytes += d.sizeBytes;
    mimeCount.set(d.mimeType, m);
  }
  const catCount = new Map<string, number>();
  for (const d of docs) catCount.set(d.category, (catCount.get(d.category) || 0) + 1);
  p(`  Nach Kategorie:`);
  for (const [c, n] of [...catCount.entries()].sort((a,b) => b[1] - a[1])) {
    p(`    ${c.padEnd(14)} ${n}`);
  }
  p(`  Nach MIME-Typ:`);
  for (const [m, { n, bytes }] of [...mimeCount.entries()].sort((a,b) => b[1].n - a[1].n).slice(0, 10)) {
    p(`    ${m.padEnd(45)} ${String(n).padStart(3)}   ${(bytes/1024/1024).toFixed(1)} MB`);
  }
  const totalBytes = docs.reduce((s, d) => s + d.sizeBytes, 0);
  p(`  Total Storage: ${(totalBytes/1024/1024).toFixed(1)} MB`);

  // ===== SERVERS =====
  p(`\n${dline}`); p(`  SERVERS (3)`); p(dline);
  const servers = await prisma.server.findMany({
    where: { workspaceId: ws.id, deletedAt: null },
    select: { name: true, provider: true, url: true, ip: true, region: true, client: { select: { slug: true } } },
  });
  for (const s of servers) {
    p(`  ${s.name.padEnd(20)} ${(s.provider || "-").padEnd(12)} ${(s.url || s.ip || "-").padEnd(35)} ${s.region || ""}  ${s.client?.slug ?? "-"}`);
  }

  // ===== ACTIVITIES =====
  p(`\n${dline}`); p(`  ACTIVITIES (218)`); p(dline);
  const actByKind = await prisma.activity.groupBy({
    by: ["kind"], where: { workspaceId: ws.id }, _count: true,
  });
  p(`  Nach Typ:`);
  for (const a of actByKind.sort((a,b) => b._count - a._count)) {
    p(`    ${a.kind.padEnd(14)} ${a._count}`);
  }
  const recent = await prisma.activity.findMany({
    where: { workspaceId: ws.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { kind: true, subject: true, actorName: true, createdAt: true },
  });
  p(`  Letzte 5:`);
  for (const a of recent) {
    p(`    ${a.createdAt.toISOString().slice(0,16)} ${a.kind.padEnd(12)} ${(a.subject || "").slice(0, 50)} — ${a.actorName || "?"}`);
  }

  p(`\n${dline}`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
