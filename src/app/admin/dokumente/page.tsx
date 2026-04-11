import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Files } from "lucide-react";
import { DocumentList } from "@/components/admin/document-list";

export default async function DokumentePage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; category?: string }>;
}) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const { clientId, category } = await searchParams;

  const [documents, clients, categories] = await Promise.all([
    prisma.document.findMany({
      where: {
        ...(clientId ? { clientId } : {}),
        ...(category ? { category } : {}),
      },
      include: {
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.document.findMany({
      select: { category: true },
      where: { category: { not: null } },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);

  const distinctCategories = categories
    .map((d) => d.category)
    .filter((c): c is string => c !== null);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-surface tracking-tightest">
            Dokumente
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            {documents.length}{" "}
            {documents.length === 1 ? "Dokument" : "Dokumente"} insgesamt
          </p>
        </div>
        <Link
          href="/admin/dokumente/hochladen"
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-ink font-medium text-sm px-4 py-2.5 rounded-xl transition-colors duration-150"
        >
          <Plus size={16} />
          Hochladen
        </Link>
      </div>

      {/* Filters */}
      {(clients.length > 0 || distinctCategories.length > 0) && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <form method="GET" className="flex flex-wrap gap-3">
            {clients.length > 0 && (
              <select
                name="clientId"
                defaultValue={clientId ?? ""}
                onChange={(e) => {
                  const form = e.target.closest("form") as HTMLFormElement;
                  form?.requestSubmit();
                }}
                className="bg-dark-200 border border-border rounded-xl px-4 py-2 text-sm text-surface focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
              >
                <option value="">Alle Kunden</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            {distinctCategories.length > 0 && (
              <select
                name="category"
                defaultValue={category ?? ""}
                onChange={(e) => {
                  const form = e.target.closest("form") as HTMLFormElement;
                  form?.requestSubmit();
                }}
                className="bg-dark-200 border border-border rounded-xl px-4 py-2 text-sm text-surface focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
              >
                <option value="">Alle Kategorien</option>
                {distinctCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
            {(clientId || category) && (
              <Link
                href="/admin/dokumente"
                className="inline-flex items-center px-3 py-2 text-xs text-ink-muted hover:text-surface border border-border rounded-xl transition-colors"
              >
                Filter zurücksetzen
              </Link>
            )}
          </form>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="bg-dark-100 border border-border rounded-xl px-5 py-16 text-center">
          <Files size={36} className="text-ink-muted mx-auto mb-3" />
          <p className="text-sm font-medium text-surface mb-1">
            Noch keine Dokumente
          </p>
          <p className="text-xs text-ink-muted mb-4">
            Laden Sie das erste Dokument hoch.
          </p>
          <Link
            href="/admin/dokumente/hochladen"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-ink font-medium text-sm px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={16} />
            Hochladen
          </Link>
        </div>
      ) : (
        <DocumentList documents={documents} />
      )}
    </div>
  );
}
