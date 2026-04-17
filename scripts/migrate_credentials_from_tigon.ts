import "dotenv/config";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { encrypt } from "../src/lib/vault";

const TIGON_ROOT = "/home/habit/tigon";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

interface CredFile {
  path: string;
  relPath: string;
  label: string;
  clientSlug: string | null;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (name.startsWith(".") || name === "_export" || name === "tools") continue;
    if (name.includes("sync-conflict") || name.includes(".backup-")) continue;
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) walk(full, out);
    else if (/credentials.*\.md$/.test(name) || /^credentials.*\.md$/.test(name)) out.push(full);
  }
  return out;
}

function classify(fp: string): CredFile | null {
  const rel = fp.substring(TIGON_ROOT.length + 1);
  const parts = rel.split("/");
  let clientSlug: string | null = null;
  let label: string;

  if (parts[0] === "kunden") {
    if (parts[1] === "active" || parts[1] === "warm" || parts[1] === "cold" || parts[1] === "ended" || parts[1] === "pro-bono" || parts[1] === "paused") {
      clientSlug = parts[2] ?? null;
      label = parts.slice(3).join("/").replace(/\.md$/, "");
    } else {
      clientSlug = parts[1] ?? null;
      label = parts.slice(2).join("/").replace(/\.md$/, "");
    }
  } else if (parts[0] === "intern") {
    label = `intern/${parts.slice(1).join("/").replace(/\.md$/, "")}`;
  } else {
    label = rel.replace(/\.md$/, "");
  }

  if (!label || label === "credentials") label = clientSlug ? `${clientSlug} Credentials` : "Credentials";
  return { path: fp, relPath: rel, label, clientSlug };
}

async function main() {
  const workspace = await prisma.workspace.findFirst({ select: { id: true } });
  if (!workspace) throw new Error("No workspace");
  const wsId = workspace.id;

  const admin = await prisma.user.findFirst({
    where: { workspaceId: wsId, role: "ADMIN" },
    select: { id: true },
  });
  if (!admin) throw new Error("No admin user");

  const clients = await prisma.client.findMany({
    where: { workspaceId: wsId, deletedAt: null },
    select: { id: true, slug: true },
  });
  const clientMap = new Map(clients.map((c) => [c.slug, c.id]));

  const files = walk(TIGON_ROOT).map(classify).filter((x): x is CredFile => x !== null);
  console.log(`Found ${files.length} credential files.`);

  let created = 0;
  let skipped = 0;

  for (const f of files) {
    const content = readFileSync(f.path, "utf-8");
    if (content.trim().length < 10) {
      skipped++;
      continue;
    }

    const clientId = f.clientSlug ? clientMap.get(f.clientSlug) ?? null : null;
    if (f.clientSlug && !clientId) {
      console.log(`  [skip] ${f.relPath} - client slug "${f.clientSlug}" not found`);
      skipped++;
      continue;
    }

    const exists = await prisma.credential.findFirst({
      where: { workspaceId: wsId, label: f.label, deletedAt: null },
      select: { id: true },
    });
    if (exists) {
      console.log(`  [skip-dup] ${f.label}`);
      skipped++;
      continue;
    }

    const { encValue, encIv, encTag } = encrypt(content);

    await prisma.credential.create({
      data: {
        workspaceId: wsId,
        clientId,
        label: f.label,
        type: "OTHER",
        encValue,
        encIv,
        encTag,
        notes: `Migriert aus ~/tigon/${f.relPath} am ${new Date().toISOString().split("T")[0]}. Kompletter Dateiinhalt verschluesselt gespeichert (reveal zum Lesen).`,
        createdById: admin.id,
      },
    });
    created++;
    console.log(`  OK ${f.label} ${clientId ? `-> client ${f.clientSlug}` : "(workspace)"}`);
  }

  console.log(`\nCreated: ${created}, Skipped: ${skipped}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
