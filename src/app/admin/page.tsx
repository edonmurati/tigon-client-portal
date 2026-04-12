import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FolderOpen, Bell, Users, Flag } from "lucide-react";
import {
  ImpulseStatusBadge,
  ImpulseTypeBadge,
  ProjectStatusBadge,
} from "@/components/ui/badge";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Gerade eben";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `vor ${days} Tag${days === 1 ? "" : "en"}`;
  return date.toLocaleDateString("de-DE");
}

export default async function AdminDashboardPage() {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    activeProjectCount,
    openImpulseCount,
    clientCount,
    dueMilestoneCount,
    latestImpulses,
    upcomingMilestones,
  ] = await Promise.all([
    prisma.project.count({ where: { status: "ACTIVE" } }),
    prisma.impulse.count({ where: { status: "NEW" } }),
    prisma.client.count(),
    prisma.milestone.count({
      where: {
        dueDate: { gte: now, lte: in30Days },
        completedAt: null,
      },
    }),
    prisma.impulse.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        project: { include: { client: true } },
        author: true,
      },
    }),
    prisma.milestone.findMany({
      where: {
        dueDate: { gte: now, lte: in30Days },
        completedAt: null,
      },
      include: { project: { include: { client: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
  ]);

  const activeProjects = await prisma.project.findMany({
    where: { status: "ACTIVE" },
    include: {
      client: true,
      _count: { select: { impulses: { where: { status: "NEW" } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = [
    {
      label: "Aktive Projekte",
      value: activeProjectCount,
      icon: FolderOpen,
    },
    {
      label: "Offene Impulse",
      value: openImpulseCount,
      icon: Bell,
    },
    {
      label: "Kunden",
      value: clientCount,
      icon: Users,
    },
    {
      label: "Meilensteine fällig",
      value: dueMilestoneCount,
      icon: Flag,
    },
  ];

  function milestoneColor(dueDate: Date): string {
    const msUntil = dueDate.getTime() - now.getTime();
    const daysUntil = msUntil / (1000 * 60 * 60 * 24);
    if (daysUntil <= 7) return "text-red-400";
    if (daysUntil <= 14) return "text-yellow-400";
    return "text-ink-muted";
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Page title */}
      <h1 className="font-serif text-3xl text-surface tracking-tightest">
        Dashboard
      </h1>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-dark-100 border border-border rounded-xl p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <Icon className="w-4 h-4 text-ink-muted" />
            </div>
            <p className="text-3xl font-serif text-accent leading-none mb-2">
              {value}
            </p>
            <p className="text-[10px] font-medium text-ink-muted uppercase tracking-widest">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Middle Row: Impulse + Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Neueste Impulse */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-surface tracking-tightest">
              Neueste Impulse
            </h2>
            <Link
              href="/admin/impulse"
              className="text-xs text-ink-muted hover:text-accent transition-colors"
            >
              Alle anzeigen
            </Link>
          </div>
          <div className="bg-dark-100 border border-border rounded-xl overflow-hidden">
            {latestImpulses.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-ink-muted text-sm">Keine Impulse vorhanden.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {latestImpulses.map((impulse) => (
                  <Link
                    key={impulse.id}
                    href={`/admin/impulse/${impulse.id}`}
                    className="flex items-start gap-3 px-5 py-4 hover:bg-dark-200 hover:border-accent/40 transition-colors duration-150 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <ImpulseTypeBadge type={impulse.type} />
                        <ImpulseStatusBadge status={impulse.status} />
                      </div>
                      <p className="text-sm text-surface font-medium truncate group-hover:text-accent transition-colors">
                        {impulse.title}
                      </p>
                      <p className="text-xs text-ink-muted mt-0.5 truncate">
                        {impulse.project.client.name} &bull;{" "}
                        {impulse.project.name} &bull; {impulse.author.name}
                      </p>
                    </div>
                    <span className="text-xs text-ink-muted whitespace-nowrap shrink-0 mt-1">
                      {timeAgo(new Date(impulse.createdAt))}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Nächste Meilensteine */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-surface tracking-tightest">
              Nächste Meilensteine
            </h2>
          </div>
          <div className="bg-dark-100 border border-border rounded-xl overflow-hidden">
            {upcomingMilestones.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-ink-muted text-sm">
                  Keine fälligen Meilensteine in den nächsten 30 Tagen.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {upcomingMilestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-start justify-between gap-3 px-5 py-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-surface font-medium truncate">
                        {milestone.title}
                      </p>
                      <p className="text-xs text-ink-muted mt-0.5 truncate">
                        {milestone.project.client.name} &bull;{" "}
                        {milestone.project.name}
                      </p>
                    </div>
                    <span
                      className={`text-xs shrink-0 mt-0.5 ${milestoneColor(
                        new Date(milestone.dueDate!)
                      )}`}
                    >
                      {new Date(milestone.dueDate!).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Aktive Projekte */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl text-surface tracking-tightest">
            Aktive Projekte
          </h2>
          <Link
            href="/admin/projekte"
            className="text-xs text-ink-muted hover:text-accent transition-colors"
          >
            Alle anzeigen
          </Link>
        </div>
        {activeProjects.length === 0 ? (
          <div className="bg-dark-100 border border-border rounded-xl py-12 text-center">
            <p className="text-ink-muted text-sm">Keine aktiven Projekte.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeProjects.map((project) => (
              <Link
                key={project.id}
                href={`/admin/projekte/${project.id}`}
                className="bg-dark-100 border border-border rounded-xl p-5 hover:bg-dark-200 hover:border-accent/40 transition-colors duration-150 group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-surface truncate group-hover:text-accent transition-colors">
                      {project.name}
                    </p>
                    <p className="text-xs text-ink-muted mt-0.5">
                      {project.client.name}
                    </p>
                  </div>
                  <ProjectStatusBadge status={project.status} />
                </div>
                {project._count.impulses > 0 && (
                  <p className="text-[10px] font-medium text-ink-muted uppercase tracking-widest">
                    {project._count.impulses}{" "}
                    {project._count.impulses === 1 ? "offener Impuls" : "offene Impulse"}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
