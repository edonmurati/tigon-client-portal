import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProjectForm } from "@/components/admin/project-form";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function EditProjektPage({ params }: PageProps) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      startDate: true,
      liveUrl: true,
      client: { select: { id: true, name: true } },
    },
  });

  if (!project) notFound();

  return (
    <div className="p-6 lg:p-8">
      <Link
        href={`/admin/projekte/${projectId}`}
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-surface transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Zurück zum Projekt
      </Link>

      <div className="mb-8">
        <h1 className="font-serif text-3xl text-surface tracking-tightest">
          Projekt bearbeiten
        </h1>
        <p className="text-ink-muted text-sm mt-1">
          {project.name} &bull; {project.client.name}
        </p>
      </div>

      <ProjectForm
        mode="edit"
        projectId={projectId}
        initialData={{
          name: project.name,
          description: project.description ?? undefined,
          status: project.status,
          startDate: project.startDate
            ? project.startDate.toISOString()
            : null,
          liveUrl: project.liveUrl ?? null,
        }}
      />
    </div>
  );
}
