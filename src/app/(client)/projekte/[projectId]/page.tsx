import { getAuthUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CheckCircle2, Circle, Plus, Layers, Monitor } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (!user.clientId) redirect("/login");

  const { projectId } = await params;

  const project = await prisma.project.findFirst({
    where: { id: projectId, clientId: user.clientId },
    include: {
      areas: {
        include: {
          _count: { select: { impulses: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
      milestones: {
        orderBy: { sortOrder: "asc" },
      },
      client: { select: { partnershipScope: true } },
    },
  });

  if (!project) notFound();

  const completedMilestones = project.milestones.filter((m) => m.completedAt !== null);
  const upcomingMilestones = project.milestones.filter((m) => m.completedAt === null);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start gap-3 mb-2">
          <h1 className="font-serif text-3xl text-surface tracking-tightest leading-tight flex-1">
            {project.name}
          </h1>
          <ProjectStatusBadge status={project.status} />
        </div>
        {project.description && (
          <p className="text-sm text-ink-muted max-w-2xl">{project.description}</p>
        )}
        <div className="mt-4 flex items-center gap-3">
          <Link href={`/projekte/${project.id}/impulse/neu`}>
            <Button size="sm">
              <Plus className="w-4 h-4" />
              Neuen Impuls erstellen
            </Button>
          </Link>
          {project.liveUrl && (
            <Link href={`/projekte/${project.id}/live`}>
              <Button size="sm" variant="ghost">
                <Monitor className="w-4 h-4" />
                Live Feedback
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Partnership Scope */}
      {project.client.partnershipScope && (
        <section className="mb-8">
          <h2 className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-3">
            Leistungsumfang
          </h2>
          <Card>
            <CardBody>
              <p className="text-sm text-surface whitespace-pre-wrap leading-relaxed">
                {project.client.partnershipScope}
              </p>
            </CardBody>
          </Card>
        </section>
      )}

      {/* Areas */}
      {project.areas.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-3">
            Projektbereiche
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {project.areas.map((area) => (
              <Link key={area.id} href={`/projekte/${project.id}/impulse?areaId=${area.id}`}>
                <Card variant="interactive">
                  <CardBody className="py-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Layers className="w-4 h-4 text-accent shrink-0" />
                      <p className="text-sm font-medium text-surface truncate">{area.name}</p>
                    </div>
                    <p className="text-xs text-ink-muted">{area._count.impulses} Impulse</p>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Milestones timeline */}
      {project.milestones.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-ink-muted uppercase tracking-wider mb-4">
            Meilensteine
          </h2>
          <div className="relative">
            <div className="absolute left-[9px] top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4 pl-8">
              {/* Upcoming first */}
              {upcomingMilestones.map((milestone) => (
                <div key={milestone.id} className="relative">
                  <div className="absolute -left-8 top-0.5">
                    <Circle className="w-5 h-5 text-ink-muted" />
                  </div>
                  <Card>
                    <CardBody className="py-3.5">
                      <p className="text-sm font-medium text-surface">{milestone.title}</p>
                      {milestone.description && (
                        <p className="text-xs text-ink-muted mt-0.5">{milestone.description}</p>
                      )}
                      {milestone.dueDate && (
                        <p className="text-xs text-ink-muted mt-1">
                          Fällig: {formatDate(milestone.dueDate)}
                        </p>
                      )}
                    </CardBody>
                  </Card>
                </div>
              ))}
              {/* Completed */}
              {completedMilestones.map((milestone) => (
                <div key={milestone.id} className="relative opacity-60">
                  <div className="absolute -left-8 top-0.5">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <Card>
                    <CardBody className="py-3.5">
                      <p className="text-sm font-medium text-surface line-through">{milestone.title}</p>
                      {milestone.completedAt && (
                        <p className="text-xs text-green-500 mt-0.5">
                          Abgeschlossen: {formatDate(milestone.completedAt)}
                        </p>
                      )}
                    </CardBody>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
