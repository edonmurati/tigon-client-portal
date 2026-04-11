import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

const clientStatusLabels: Record<string, string> = {
  ACTIVE: "Aktiv",
  PAUSED: "Pausiert",
  ENDED: "Beendet",
};

const clientStatusColors: Record<string, string> = {
  ACTIVE: "text-green-400 bg-green-400/10 border border-green-400/20",
  PAUSED: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20",
  ENDED: "text-ink-muted bg-dark-300 border border-border",
};

export default async function KundenPage() {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const clients = await prisma.client.findMany({
    include: {
      _count: {
        select: {
          users: true,
          projects: true,
        },
      },
      projects: {
        include: {
          _count: {
            select: {
              impulses: {
                where: { status: "NEW" },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const clientsWithCounts = clients.map((client) => ({
    ...client,
    openImpulses: client.projects.reduce(
      (sum, p) => sum + p._count.impulses,
      0
    ),
  }));

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-surface tracking-tightest">
            Kunden
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            {clients.length} {clients.length === 1 ? "Kunde" : "Kunden"} insgesamt
          </p>
        </div>
        <Link
          href="/admin/kunden/neu"
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-ink font-medium text-sm px-4 py-2.5 rounded-xl transition-colors duration-150"
        >
          <Plus size={16} />
          Neuer Kunde
        </Link>
      </div>

      {clientsWithCounts.length === 0 ? (
        <div className="bg-dark-100 border border-border rounded-xl">
          <EmptyState
            icon={Users}
            title="Noch keine Kunden angelegt"
            description="Erstellen Sie den ersten Kunden, um das Portal zu nutzen."
            action={{ label: "Kunden erstellen", href: "/admin/kunden/neu" }}
          />
        </div>
      ) : (
        <div className="bg-dark-100 border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-border">
            <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest">
              Kunde
            </span>
            <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest text-center min-w-[60px]">
              Nutzer
            </span>
            <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest text-center min-w-[70px]">
              Projekte
            </span>
            <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest text-center min-w-[70px]">
              Impulse
            </span>
            <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest min-w-[80px]">
              Status
            </span>
          </div>

          <div className="divide-y divide-border">
            {clientsWithCounts.map((client) => (
              <Link
                key={client.id}
                href={`/admin/kunden/${client.id}`}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-dark-200 transition-colors duration-150 group"
              >
                <div>
                  <p className="text-sm font-medium text-surface group-hover:text-accent transition-colors">
                    {client.name}
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5 font-mono">
                    {client.slug}
                  </p>
                </div>
                <div className="min-w-[60px] text-center">
                  <span className="text-sm text-ink-muted">{client._count.users}</span>
                </div>
                <div className="min-w-[70px] text-center">
                  <span className="text-sm text-ink-muted">{client._count.projects}</span>
                </div>
                <div className="min-w-[70px] text-center">
                  {client.openImpulses > 0 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold">
                      {client.openImpulses}
                    </span>
                  ) : (
                    <span className="text-sm text-ink-muted">—</span>
                  )}
                </div>
                <div className="min-w-[80px]">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${clientStatusColors[client.status] ?? "text-ink-muted bg-dark-300"}`}
                  >
                    {clientStatusLabels[client.status] ?? client.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
