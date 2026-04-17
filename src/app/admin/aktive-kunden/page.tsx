import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, FolderOpen, Bell, CheckSquare, Flag } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default async function AktiveKundenPage() {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const clients = await prisma.client.findMany({
    where: {
      workspaceId: user.workspaceId,
      deletedAt: null,
      stage: "ACTIVE",
    },
    include: {
      projects: {
        where: { deletedAt: null, status: "ACTIVE" },
        include: {
          milestones: {
            where: { deletedAt: null, status: { in: ["PLANNED", "IN_PROGRESS"] } },
            orderBy: { dueDate: "asc" },
            take: 3,
          },
          _count: {
            select: {
              impulses: { where: { status: "NEW" } },
            },
          },
        },
      },
      tasks: {
        where: {
          deletedAt: null,
          status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] },
        },
        orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });

  const enriched = clients.map((c) => {
    const openImpulses = c.projects.reduce((s, p) => s + p._count.impulses, 0);
    const openTasks = c.tasks.length;
    const activeProjects = c.projects.length;
    const nextMilestones = c.projects
      .flatMap((p) => p.milestones.map((m) => ({ ...m, projectName: p.name, projectId: p.id })))
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.getTime() - b.dueDate.getTime();
      })
      .slice(0, 3);
    return { ...c, openImpulses, openTasks, activeProjects, nextMilestones };
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-surface tracking-tightest">
          Aktive Kunden
        </h1>
        <p className="text-ink-muted text-sm mt-1">
          Was brennt bei wem — {clients.length} {clients.length === 1 ? "Kunde" : "Kunden"} in ACTIVE
        </p>
      </div>

      {enriched.length === 0 ? (
        <div className="bg-dark-100 border border-border rounded-xl">
          <EmptyState
            icon={Users}
            title="Keine aktiven Kunden"
            description="Wechsle einen Kunden im CRM auf Stage ACTIVE, um ihn hier zu sehen."
            action={{ label: "Zum CRM", href: "/admin/crm" }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {enriched.map((client) => (
            <div
              key={client.id}
              className="bg-dark-100 border border-border rounded-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <Link
                  href={`/admin/kunden/${client.id}`}
                  className="group"
                >
                  <p className="text-base font-medium text-surface group-hover:text-accent transition-colors">
                    {client.name}
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5 font-mono">
                    {client.slug}
                  </p>
                </Link>
                <div className="flex items-center gap-4 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-ink-muted">
                    <FolderOpen size={12} />
                    {client.activeProjects} {client.activeProjects === 1 ? "Projekt" : "Projekte"}
                  </span>
                  {client.openImpulses > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-accent">
                      <Bell size={12} />
                      {client.openImpulses} neu
                    </span>
                  )}
                  {client.openTasks > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-ink-muted">
                      <CheckSquare size={12} />
                      {client.openTasks} offen
                    </span>
                  )}
                </div>
              </div>

              {client.nextMilestones.length > 0 && (
                <div className="px-5 py-3 bg-dark-200/50">
                  <p className="text-[10px] font-medium text-ink-muted uppercase tracking-widest mb-2">
                    Nächste Milestones
                  </p>
                  <div className="space-y-1.5">
                    {client.nextMilestones.map((m) => (
                      <Link
                        key={m.id}
                        href={`/admin/projekte/${m.projectId}`}
                        className="flex items-center gap-2 text-xs text-ink-muted hover:text-surface transition-colors"
                      >
                        <Flag size={11} className="shrink-0" />
                        <span className="truncate">{m.title}</span>
                        <span className="text-ink-muted/60">·</span>
                        <span className="text-ink-muted/60 truncate">{m.projectName}</span>
                        {m.dueDate && (
                          <span className="ml-auto text-ink-muted/60 shrink-0">
                            {new Date(m.dueDate).toLocaleDateString("de-DE", {
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
