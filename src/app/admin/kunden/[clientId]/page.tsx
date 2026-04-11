import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, Plus, UserPlus, FolderOpen, MessageSquare } from "lucide-react";
import { ProjectStatusBadge } from "@/components/ui/badge";
import { AddUserForm } from "./add-user-form";

const clientStatusLabels: Record<string, string> = {
  ACTIVE: "Aktiv",
  PAUSED: "Pausiert",
  ENDED: "Beendet",
};

const clientStatusColors: Record<string, string> = {
  ACTIVE: "text-green-400 bg-green-400/10 border border-green-400/20",
  PAUSED: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20",
  ENDED: "text-ink-muted bg-dark-300 border border-border",
};

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function KundeDetailPage({ params }: PageProps) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const { clientId } = await params;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      projects: {
        include: {
          areas: true,
          milestones: true,
          _count: {
            select: {
              impulses: true,
              milestones: {
                where: { completedAt: { not: null } },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      users: {
        select: { id: true, name: true, email: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!client) notFound();

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Back link */}
      <Link
        href="/admin/kunden"
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-surface transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Zurück zu Kunden
      </Link>

      {/* Client header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="font-serif text-3xl text-surface tracking-tightest">
            {client.name}
          </h1>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${clientStatusColors[client.status] ?? "text-ink-muted bg-dark-300"}`}
          >
            {clientStatusLabels[client.status] ?? client.status}
          </span>
        </div>
        <Link
          href={`/admin/kunden/${clientId}/edit`}
          className="inline-flex items-center gap-2 bg-dark-200 hover:bg-dark-300 border border-border text-surface font-medium text-sm px-4 py-2.5 rounded-xl transition-colors duration-150"
        >
          <Edit size={14} />
          Bearbeiten
        </Link>
      </div>

      {/* Partnership scope */}
      {client.partnershipScope && (
        <div className="bg-dark-100 border border-border rounded-xl p-5 mb-6">
          <h2 className="text-xs font-medium text-ink-muted uppercase tracking-widest mb-3">
            Partnership Scope
          </h2>
          <p className="text-sm text-surface leading-relaxed whitespace-pre-wrap">
            {client.partnershipScope}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Users section */}
        <div className="bg-dark-100 border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-surface">Benutzer</h2>
              <span className="text-xs text-ink-muted">({client.users.length})</span>
            </div>
          </div>

          <div className="divide-y divide-border">
            {client.users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-dark-300 flex items-center justify-center shrink-0 text-xs font-bold text-ink-muted">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface truncate">{u.name}</p>
                  <p className="text-xs text-ink-muted truncate">{u.email}</p>
                </div>
                <span className="text-xs text-ink-muted shrink-0">
                  {formatDate(u.createdAt)}
                </span>
              </div>
            ))}
          </div>

          {/* Add user form */}
          <div className="px-5 py-4 border-t border-border">
            <AddUserForm clientId={clientId} />
          </div>
        </div>

        {/* Projects section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-surface">Projekte</h2>
              <span className="text-xs text-ink-muted">({client.projects.length})</span>
            </div>
            <Link
              href={`/admin/kunden/${clientId}/neu-projekt`}
              className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors"
            >
              <Plus size={14} />
              Neues Projekt
            </Link>
          </div>

          {client.projects.length === 0 ? (
            <div className="bg-dark-100 border border-border rounded-xl px-5 py-10 text-center">
              <FolderOpen size={24} className="text-ink-muted mx-auto mb-3" />
              <p className="text-sm text-ink-muted">Noch keine Projekte</p>
            </div>
          ) : (
            <div className="space-y-3">
              {client.projects.map((project) => {
                const totalMilestones = project.milestones.length;
                const completedMilestones = project._count.milestones;
                const milestonePercent =
                  totalMilestones > 0
                    ? Math.round((completedMilestones / totalMilestones) * 100)
                    : null;

                return (
                  <Link
                    key={project.id}
                    href={`/admin/projekte/${project.id}`}
                    className="block bg-dark-100 border border-border hover:border-accent/40 rounded-xl p-5 transition-colors duration-150 group"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface group-hover:text-accent transition-colors truncate">
                          {project.name}
                        </p>
                        {project.description && (
                          <p className="text-xs text-ink-muted mt-0.5 line-clamp-1">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <ProjectStatusBadge status={project.status} />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-ink-muted">
                      {project._count.impulses > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare size={11} />
                          {project._count.impulses} Impulse
                        </span>
                      )}
                      {milestonePercent !== null && (
                        <span>{milestonePercent}% abgeschlossen</span>
                      )}
                    </div>

                    {milestonePercent !== null && (
                      <div className="mt-3 h-1 bg-dark-300 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all duration-300"
                          style={{ width: `${milestonePercent}%` }}
                        />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
