import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Plus, FileText } from "lucide-react";
import { ImpulseStatusBadge, ImpulseTypeBadge, ProjectStatusBadge, CredentialTypeBadge } from "@/components/ui/badge";
import { AreaManager } from "@/components/admin/area-manager";
import { MilestoneManager } from "@/components/admin/milestone-manager";
import { NoteList } from "@/components/admin/note-list";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "Gerade eben";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `vor ${days} Tag${days === 1 ? "" : "en"}`;
  return d.toLocaleDateString("de-DE");
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function ProjektDetailPage({ params }: PageProps) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: {
        select: { id: true, name: true, slug: true },
      },
      areas: {
        orderBy: { sortOrder: "asc" },
      },
      milestones: {
        orderBy: { sortOrder: "asc" },
      },
      impulses: {
        include: {
          author: {
            select: { id: true, name: true },
          },
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) notFound();

  // Fetch V2 CRM data
  const [notes, credentials, documents] = await Promise.all([
    prisma.note.findMany({
      where: { projectId },
      include: { author: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.credential.findMany({
      where: { projectId },
      select: {
        id: true,
        label: true,
        type: true,
        url: true,
        username: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.document.findMany({
      where: { projectId },
      select: {
        id: true,
        name: true,
        displayName: true,
        mimeType: true,
        sizeBytes: true,
        category: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Serialize dates for "use client" components
  const serializedNotes = notes.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  }));

  const totalMilestones = project.milestones.length;
  const completedMilestones = project.milestones.filter((m) => !!m.completedAt).length;
  const milestonePercent =
    totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : null;

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Back link */}
      <Link
        href={`/admin/kunden/${project.client.id}`}
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-surface transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        {project.client.name}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="font-serif text-3xl text-surface tracking-tightest">
              {project.name}
            </h1>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className="text-ink-muted text-sm">
            Kunde:{" "}
            <Link
              href={`/admin/kunden/${project.client.id}`}
              className="text-accent hover:text-accent-hover transition-colors"
            >
              {project.client.name}
            </Link>
          </p>
        </div>
        <Link
          href={`/admin/projekte/${projectId}/edit`}
          className="inline-flex items-center gap-2 bg-dark-200 hover:bg-dark-300 border border-border text-surface font-medium text-sm px-4 py-2.5 rounded-xl transition-colors duration-150 shrink-0"
        >
          <Edit size={14} />
          Bearbeiten
        </Link>
      </div>

      {/* Description */}
      {project.description && (
        <div className="bg-dark-100 border border-border rounded-xl p-5 mb-6">
          <h2 className="text-xs font-medium text-ink-muted uppercase tracking-widest mb-3">
            Beschreibung
          </h2>
          <p className="text-sm text-surface leading-relaxed whitespace-pre-wrap">
            {project.description}
          </p>
        </div>
      )}

      {/* Milestone progress */}
      {milestonePercent !== null && (
        <div className="bg-dark-100 border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-ink-muted uppercase tracking-widest">
              Fortschritt
            </h2>
            <span className="text-sm font-medium text-surface">
              {completedMilestones}/{totalMilestones} Meilensteine
            </span>
          </div>
          <div className="h-2 bg-dark-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${milestonePercent}%` }}
            />
          </div>
          <p className="text-xs text-ink-muted mt-2">{milestonePercent}% abgeschlossen</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Areas */}
        <div className="bg-dark-100 border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-medium text-surface">Projektbereiche</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Kategorien für Impulse und Aufgaben
            </p>
          </div>
          <div className="p-5">
            <AreaManager projectId={projectId} initialAreas={project.areas} />
          </div>
        </div>

        {/* Milestones */}
        <div className="bg-dark-100 border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-medium text-surface">Meilensteine</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Klicken zum Abhaken
            </p>
          </div>
          <div className="p-5">
            <MilestoneManager
              projectId={projectId}
              initialMilestones={project.milestones}
            />
          </div>
        </div>
      </div>

      {/* Impulses section */}
      {project.impulses.length > 0 && (
        <div className="mt-6 bg-dark-100 border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-medium text-surface">
              Impulse ({project.impulses.length})
            </h2>
            <Link
              href={`/admin/impulse?clientId=${project.client.id}`}
              className="text-xs text-ink-muted hover:text-surface transition-colors"
            >
              Alle anzeigen →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {project.impulses.map((impulse) => (
              <Link
                key={impulse.id}
                href={`/admin/impulse/${impulse.id}`}
                className={`flex items-center gap-4 px-5 py-3.5 hover:bg-dark-200 transition-colors group ${
                  impulse.status === "NEW" ? "bg-accent/5" : ""
                }`}
              >
                <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                  <ImpulseTypeBadge type={impulse.type} />
                  <ImpulseStatusBadge status={impulse.status} />
                  <p className="text-sm text-surface group-hover:text-accent transition-colors truncate">
                    {impulse.title}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs text-ink-muted">
                  {impulse._count.comments > 0 && (
                    <span>{impulse._count.comments} Komm.</span>
                  )}
                  <span className="whitespace-nowrap">{timeAgo(impulse.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Notizen Section */}
      <section className="mt-6">
        <div className="bg-dark-100 border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-medium text-surface">Notizen</h2>
          </div>
          <div className="p-5">
            <NoteList notes={serializedNotes} projectId={projectId} />
          </div>
        </div>
      </section>

      {/* Zugangsdaten Section */}
      <section className="mt-6">
        <div className="bg-dark-100 border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-medium text-surface">Zugangsdaten</h2>
            <Link
              href={`/admin/zugangsdaten/neu?projectId=${projectId}`}
              className="text-xs text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"
            >
              <Plus size={12} /> Neu
            </Link>
          </div>
          {credentials.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-ink-muted">Noch keine Zugangsdaten</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {credentials.map((cred) => (
                <Link
                  key={cred.id}
                  href={`/admin/zugangsdaten/${cred.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-dark-200 transition-colors"
                >
                  <CredentialTypeBadge type={cred.type} />
                  <span className="text-sm text-surface flex-1 truncate">{cred.label}</span>
                  {cred.username && (
                    <span className="text-xs text-ink-muted">{cred.username}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Dokumente Section */}
      <section className="mt-6">
        <div className="bg-dark-100 border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-sm font-medium text-surface">Dokumente</h2>
            <Link
              href={`/admin/dokumente/hochladen?projectId=${projectId}`}
              className="text-xs text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"
            >
              <Plus size={12} /> Hochladen
            </Link>
          </div>
          {documents.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-ink-muted">Noch keine Dokumente</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 px-5 py-3">
                  <FileText size={14} className="text-ink-muted shrink-0" />
                  <span className="text-sm text-surface flex-1 truncate">
                    {doc.displayName || doc.name}
                  </span>
                  {doc.category && (
                    <span className="text-xs text-ink-muted bg-dark-300 px-2 py-0.5 rounded">
                      {doc.category}
                    </span>
                  )}
                  <span className="text-xs text-ink-muted">{formatSize(doc.sizeBytes)}</span>
                  <a
                    href={`/api/admin/dokumente/${doc.id}/download`}
                    className="text-xs text-accent hover:text-accent-hover"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
