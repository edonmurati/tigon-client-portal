import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FolderOpen, Zap, Flag, ArrowRight } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { ProjectStatusBadge, ImpulseTypeBadge, ImpulseStatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { timeAgo } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (!user.clientId) redirect("/login");

  const [projects, recentImpulses] = await Promise.all([
    prisma.project.findMany({
      where: { clientId: user.clientId, deletedAt: null },
      include: {
        _count: {
          select: {
            impulses: { where: { status: { not: "DONE" } } },
            milestones: { where: { completedAt: null, dueDate: { not: null } } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.impulse.findMany({
      where: { project: { clientId: user.clientId, deletedAt: null } },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        createdAt: true,
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const activeProjects = projects.filter((p) => p.status === "ACTIVE").length;
  const openImpulses = projects.reduce((acc, p) => acc + p._count.impulses, 0);
  const upcomingMilestones = projects.reduce((acc, p) => acc + p._count.milestones, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-surface tracking-tightest">
          Willkommen, {user.name.split(" ")[0]}
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          {user.clientName ? `${user.clientName} — Ihr Projektportal` : "Ihr persönlicher Arbeitsbereich"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardBody className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
              <FolderOpen className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-surface">{activeProjects}</p>
              <p className="text-xs text-ink-muted mt-0.5">Aktive Projekte</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-surface">{openImpulses}</p>
              <p className="text-xs text-ink-muted mt-0.5">Offene Impulse</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Flag className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-surface">{upcomingMilestones}</p>
              <p className="text-xs text-ink-muted mt-0.5">Meilensteine</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Projects grid */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-ink-muted uppercase tracking-wider">Projekte</h2>
          <Link href="/projekte" className="text-xs text-accent hover:text-accent-hover flex items-center gap-1 transition-colors">
            Alle <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {projects.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Noch keine Projekte"
            description="Ihre Projekte erscheinen hier, sobald Tigon sie angelegt hat."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link key={project.id} href={`/projekte/${project.id}`}>
                <Card variant="interactive" className="h-full">
                  <CardBody className="py-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-medium text-surface leading-snug">{project.name}</h3>
                      <ProjectStatusBadge status={project.status} />
                    </div>
                    {project.description && (
                      <p className="text-xs text-ink-muted line-clamp-2 mb-3">{project.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-ink-muted">
                      <span>{project.areas.length} Bereiche</span>
                      <span>·</span>
                      <span>{project._count.impulses} offene Impulse</span>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent impulses */}
      <section>
        <h2 className="text-sm font-medium text-ink-muted uppercase tracking-wider mb-4">Letzte Impulse</h2>

        {recentImpulses.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="Noch keine Impulse"
            description="Öffnen Sie ein Projekt um Feedback, Fragen oder Ideen zu senden."
          />
        ) : (
          <div className="space-y-2">
            {recentImpulses.map((impulse) => (
              <Link
                key={impulse.id}
                href={`/projekte/${impulse.project.id}/impulse/${impulse.id}`}
              >
                <Card variant="interactive">
                  <CardBody className="py-3.5 flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <ImpulseTypeBadge type={impulse.type} />
                      <span className="text-sm text-surface truncate">{impulse.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ImpulseStatusBadge status={impulse.status} />
                      <span className="text-xs text-ink-muted hidden sm:block">{impulse.project.name}</span>
                      <span className="text-xs text-ink-muted">{timeAgo(impulse.createdAt)}</span>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
