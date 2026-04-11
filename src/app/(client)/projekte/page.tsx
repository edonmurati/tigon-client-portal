import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { ProjectStatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function ProjectListPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (!user.clientId) redirect("/login");

  const projects = await prisma.project.findMany({
    where: { clientId: user.clientId },
    include: {
      areas: { select: { id: true } },
      _count: {
        select: {
          impulses: { where: { status: { not: "DONE" } } },
          milestones: { where: { completedAt: null } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-surface tracking-tightest">Projekte</h1>
        <p className="text-sm text-ink-muted mt-1">Alle Ihre laufenden und abgeschlossenen Projekte</p>
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
                    <p className="text-xs text-ink-muted line-clamp-3 mb-3">{project.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-ink-muted mt-auto">
                    <span>{project.areas.length} Bereiche</span>
                    <span>·</span>
                    <span>{project._count.impulses} offene Impulse</span>
                    <span>·</span>
                    <span>{project._count.milestones} Meilensteine</span>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
