import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const slugMap: Record<string, string> = {};
  const clients = await prisma.client.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true },
  });
  for (const c of clients) slugMap[c.slug] = c.id;

  const entries = await prisma.knowledgeEntry.findMany({
    where: {
      clientId: null,
      deletedAt: null,
      title: { startsWith: "kunden/" },
    },
    select: { id: true, title: true },
  });

  let fixed = 0;
  for (const e of entries) {
    const parts = e.title.split("/");
    if (parts.length < 3) continue;
    const slug = parts[1];
    const clientId = slugMap[slug];
    if (!clientId) {
      console.log(`  no client for slug=${slug} title=${e.title}`);
      continue;
    }
    await prisma.knowledgeEntry.update({
      where: { id: e.id },
      data: {
        clientId,
        title: `${slug}: ${parts.slice(2).join("/")}`,
      },
    });
    fixed++;
    console.log(`  FIXED ${slug}: ${e.title}`);
  }
  console.log(`\nTotal fixed: ${fixed}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
