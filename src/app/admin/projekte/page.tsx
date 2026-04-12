import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FolderOpen } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectStatusBadge } from "@/components/ui/badge";

export default async function ProjektePage() {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const projects = await prisma.project.findMany({
    include: {
      client: {
        select: { id: true, name: true },
      },
      _count: {
        select: {
          impulses: {
            where: { status: "NEW" },
          },
          milestones: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-surface tracking-tightest">
            Projekte
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            {projects.length} {projects.length === 1 ? "Projekt" : "Projekte"} insgesamt
          </p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="bg-dark-100 border border-border rounded-xl">
          <EmptyState
            icon={FolderOpen}
            title="Noch keine Projekte angelegt"
            description="Projekte werden unter einem Kunden erstellt."
          />
        </div>
      ) : (
        <div className="bg-dark-100 border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-border">
            <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest">
              Projekt
            </span>
            <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest min-w-[120px]">
              Kunde
            </span>
            <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest min-w-[80px]">
              Status
            </span>
            <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest text-center min-w-[70px]">
              Impulse
            </span>
            <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest text-center min-w-[90px]">
              Meilensteine
            </span>
            <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest min-w-[100px]">
              Startdatum
            </span>
          </div>

          <div className="divide-y divide-border">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/admin/projekte/${project.id}`}
                className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-dark-200 transition-colors duration-150 group"
              >
                <div>
                  <p className="text-sm font-medium text-surface group-hover:text-accent transition-colors">
                    {project.name}
                  </p>
                  {project.description && (
                    <p className="text-xs text-ink-muted mt-0.5 truncate max-w-xs">
                      {project.description}
                    </p>
                  )}
                </div>
                <div className="min-w-[120px]">
                  <span className="text-sm text-ink-muted">{project.client.name}</span>
                </div>
                <div className="min-w-[80px]">
                  <ProjectStatusBadge status={project.status} />
                </div>
                <div className="min-w-[70px] text-center">
                  {project._count.impulses > 0 ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold">
                      {project._count.impulses}
                    </span>
                  ) : (
                    <span className="text-sm text-ink-muted">—</span>
                  )}
                </div>
                <div className="min-w-[90px] text-center">
                  <span className="text-sm text-ink-muted">{project._count.milestones}</span>
                </div>
                <div className="min-w-[100px]">
                  <span className="text-sm text-ink-muted">
                    {project.startDate
                      ? new Date(project.startDate).toLocaleDateString("de-DE")
                      : "—"}
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
