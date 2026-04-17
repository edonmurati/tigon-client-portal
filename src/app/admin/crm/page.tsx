import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { clientStageLabels, clientStageColors } from "@/lib/constants";
import { ClientDeleteButton } from "@/components/admin/client-delete-button";
import type { ClientStage } from "@/generated/prisma";

const stageOrder: ClientStage[] = ["ACTIVE", "WARM", "COLD", "PAUSED", "ENDED"];

export default async function CrmPage() {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const clients = await prisma.client.findMany({
    where: { workspaceId: user.workspaceId, deletedAt: null },
    include: {
      _count: {
        select: {
          users: true,
          projects: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const byStage = stageOrder.map((stage) => ({
    stage,
    clients: clients.filter((c) => c.stage === stage),
  }));

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-surface tracking-tightest">
            CRM
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            Pipeline — {clients.length} {clients.length === 1 ? "Kunde" : "Kunden"} insgesamt
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

      {clients.length === 0 ? (
        <div className="bg-dark-100 border border-border rounded-xl">
          <EmptyState
            icon={Users}
            title="Noch keine Kunden angelegt"
            description="Erstellen Sie den ersten Kunden, um das Portal zu nutzen."
            action={{ label: "Kunden erstellen", href: "/admin/kunden/neu" }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {byStage
            .filter((g) => g.clients.length > 0)
            .map((group) => (
              <section key={group.stage}>
                <div className="flex items-center gap-3 mb-3 px-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${clientStageColors[group.stage] ?? "text-ink-muted bg-dark-300"}`}
                  >
                    {clientStageLabels[group.stage] ?? group.stage}
                  </span>
                  <span className="text-xs text-ink-muted">
                    {group.clients.length}
                  </span>
                </div>

                <div className="bg-dark-100 border border-border rounded-xl overflow-hidden">
                  <div className="divide-y divide-border">
                    {group.clients.map((client) => (
                      <div
                        key={client.id}
                        className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3 hover:bg-dark-200 transition-colors duration-150 group"
                      >
                        <Link
                          href={`/admin/kunden/${client.id}`}
                          className="min-w-0"
                        >
                          <p className="text-sm font-medium text-surface group-hover:text-accent transition-colors truncate">
                            {client.name}
                          </p>
                          <p className="text-xs text-ink-muted mt-0.5 font-mono truncate">
                            {client.slug}
                          </p>
                        </Link>
                        <span className="text-xs text-ink-muted whitespace-nowrap">
                          {client._count.users} {client._count.users === 1 ? "Nutzer" : "Nutzer"}
                        </span>
                        <span className="text-xs text-ink-muted whitespace-nowrap">
                          {client._count.projects} {client._count.projects === 1 ? "Projekt" : "Projekte"}
                        </span>
                        <ClientDeleteButton
                          clientId={client.id}
                          clientName={client.name}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
