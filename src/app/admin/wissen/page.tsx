import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { WissenBrowser } from "@/components/admin/wissen-browser";
import type { EntryCategory } from "@/generated/prisma";

interface PageProps {
  searchParams: Promise<{
    category?: string;
    clientId?: string;
    q?: string;
    tag?: string;
  }>;
}

const validCategories: EntryCategory[] = [
  "IDEA",
  "PLAN",
  "RESEARCH",
  "SPEC",
  "MEETING_NOTE",
  "INSIGHT",
  "OTHER",
];

export default async function WissenPage({ searchParams }: PageProps) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const sp = await searchParams;
  const filterCategory =
    sp.category && validCategories.includes(sp.category as EntryCategory)
      ? (sp.category as EntryCategory)
      : undefined;
  const filterClientId = sp.clientId || undefined;
  const filterTag = sp.tag?.trim() || undefined;
  const q = sp.q?.trim() || "";

  const [entries, clients] = await Promise.all([
    prisma.knowledgeEntry.findMany({
      where: {
        deletedAt: null,
        ...(filterCategory ? { category: filterCategory } : {}),
        ...(filterClientId ? { clientId: filterClientId } : {}),
        ...(filterTag ? { tags: { has: filterTag } } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { content: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        author: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.client.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedEntries = entries.map((e) => ({
    ...e,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  return (
    <WissenBrowser
      entries={serializedEntries}
      clients={clients}
      initialCategory={filterCategory}
      initialClientId={filterClientId}
      initialQuery={q}
      initialTag={filterTag}
    />
  );
}
