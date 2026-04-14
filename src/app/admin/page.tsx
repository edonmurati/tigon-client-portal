import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  CheckSquare,
  Users,
  FolderOpen,
  BookOpen,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  impulseStatusLabels,
  impulseStatusColors,
  taskPriorityLabels,
  taskPriorityColors,
} from "@/lib/constants";

export default async function AdminDashboardPage() {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const now = new Date();

  const [
    openImpulseCount,
    openTaskCount,
    overdueTaskCount,
    activeClientCount,
    activeProjectCount,
    knowledgeCount,
    recentImpulses,
    myTasks,
  ] = await Promise.all([
    prisma.impulse.count({ where: { status: { in: ["NEW", "SEEN", "IN_PROGRESS"] } } }),
    prisma.task.count({ where: { completedAt: null } }),
    prisma.task.count({
      where: { completedAt: null, dueDate: { lt: now, not: null } },
    }),
    prisma.client.count({ where: { stage: "ACTIVE" } }),
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.knowledgeEntry.count(),
    prisma.impulse.findMany({
      where: { status: { in: ["NEW", "SEEN"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        project: { select: { id: true, name: true, client: { select: { name: true } } } },
      },
    }),
    prisma.task.findMany({
      where: {
        completedAt: null,
        dueDate: { not: null },
        project: { workspaceId: user.workspaceId, deletedAt: null },
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 5,
      include: {
        client: { select: { id: true, name: true, stage: true } },
        project: { select: { id: true, name: true } },
        assignees: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    }),
  ]);

  const upcomingTasks = myTasks;

  const stats = [
    {
      label: "Offene Impulse",
      value: openImpulseCount,
      icon: Bell,
      href: "/admin/impulse",
      accent: openImpulseCount > 0,
    },
    {
      label: "Offene Aufgaben",
      value: openTaskCount,
      icon: CheckSquare,
      href: "/admin/aufgaben",
      accent: overdueTaskCount > 0,
      hint: overdueTaskCount > 0 ? `${overdueTaskCount} überfällig` : null,
    },
    {
      label: "Aktive Kunden",
      value: activeClientCount,
      icon: Users,
      href: "/admin/kunden",
    },
    {
      label: "Aktive Projekte",
      value: activeProjectCount,
      icon: FolderOpen,
      href: "/admin/projekte",
    },
    {
      label: "Wissenseinträge",
      value: knowledgeCount,
      icon: BookOpen,
      href: "/admin/wissen",
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1400px]">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-surface tracking-tightest">
          Willkommen zurück, {user.name.split(" ")[0]}
        </h1>
        <p className="text-ink-muted text-sm mt-1">
          Dein Überblick für heute — {now.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="group bg-dark-100 border border-border rounded-xl p-4 hover:border-accent/40 hover:bg-dark-200 transition-colors duration-150"
            >
              <div className="flex items-center gap-2 text-ink-muted mb-2">
                <Icon size={14} className={s.accent ? "text-accent" : ""} />
                <span className="text-[10px] font-medium uppercase tracking-widest">
                  {s.label}
                </span>
              </div>
              <p className="font-serif text-3xl text-surface tracking-tightest">
                {s.value}
              </p>
              {s.hint && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {s.hint}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Recent Impulses */}
        <Card>
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
            <h2 className="font-serif text-lg text-surface tracking-tight">
              Neueste Impulse
            </h2>
            <Link
              href="/admin/impulse"
              className="text-xs text-ink-muted hover:text-accent transition-colors inline-flex items-center gap-1"
            >
              Alle ansehen <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentImpulses.length === 0 ? (
              <p className="text-sm text-ink-muted px-5 py-6 text-center">
                Keine offenen Impulse.
              </p>
            ) : (
              recentImpulses.map((imp) => (
                <Link
                  key={imp.id}
                  href={`/admin/impulse/${imp.id}`}
                  className="block px-5 py-3 hover:bg-dark-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-surface truncate">
                        {imp.title}
                      </p>
                      <p className="text-xs text-ink-muted mt-0.5 truncate">
                        {imp.project.client?.name ?? "—"} · {imp.project.name}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${impulseStatusColors[imp.status] ?? ""}`}
                    >
                      {impulseStatusLabels[imp.status] ?? imp.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Naechste Deadlines */}
        <Card>
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
            <h2 className="font-serif text-lg text-surface tracking-tight">
              Nächste Deadlines
            </h2>
            <Link
              href="/admin/aufgaben"
              className="text-xs text-ink-muted hover:text-accent transition-colors inline-flex items-center gap-1"
            >
              Alle ansehen <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-ink-muted px-5 py-6 text-center">
                Keine Aufgaben mit Fälligkeitsdatum.
              </p>
            ) : (
              upcomingTasks.map((t) => {
                const overdue = t.dueDate && t.dueDate < now;
                const assigneeNames = t.assignees.map((a) => a.user.name).join(", ");
                return (
                  <Link
                    key={t.id}
                    href={`/admin/aufgaben/${t.id}`}
                    className="block px-5 py-3 hover:bg-dark-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-surface truncate">
                          {t.title}
                        </p>
                        <p className="text-xs text-ink-muted mt-0.5 truncate">
                          {t.client?.name ?? t.project?.name ?? "Allgemein"}
                          {assigneeNames && <span className="ml-2">· {assigneeNames}</span>}
                          {t.dueDate && (
                            <span className={overdue ? "text-red-400 ml-2" : "ml-2"}>
                              {overdue ? "Überfällig: " : "Fällig: "}
                              {t.dueDate.toLocaleDateString("de-DE")}
                            </span>
                          )}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-[10px] font-medium uppercase tracking-wider ${taskPriorityColors[t.priority] ?? ""}`}
                      >
                        {taskPriorityLabels[t.priority] ?? t.priority}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}
