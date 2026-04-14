import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ImpulseStatusBadge, ImpulseTypeBadge } from "@/components/ui/badge";
import { CommentThread } from "@/components/admin/comment-thread";
import { StatusSelect } from "@/components/admin/status-select";

interface PageProps {
  params: Promise<{ impulseId: string }>;
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ImpulseDetailPage({ params }: PageProps) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const { impulseId } = await params;

  const impulse = await prisma.impulse.findUnique({
    where: { id: impulseId },
    include: {
      project: {
        include: {
          client: true,
        },
      },
      author: {
        select: { id: true, name: true, email: true },
      },
      comments: {
        include: {
          author: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!impulse) notFound();

  // Auto-mark as SEEN if it was NEW
  if (impulse.status === "NEW") {
    await prisma.impulse.update({
      where: { id: impulseId },
      data: { status: "SEEN" },
    });
  }

  const initialStatus = impulse.status === "NEW" ? "SEEN" : impulse.status;

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Back link */}
      <Link
        href="/admin/impulse"
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-surface transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Impulse Inbox
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <ImpulseTypeBadge type={impulse.type} />
          <ImpulseStatusBadge status={initialStatus} />
        </div>
        <h1 className="font-serif text-3xl text-surface tracking-tightest leading-tight mb-4">
          {impulse.title}
        </h1>
        <StatusSelect
          impulseId={impulseId}
          currentStatus={initialStatus}
        />
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {impulse.project.client && (
        <div className="bg-dark-100 border border-border rounded-xl px-4 py-3">
          <p className="text-[10px] text-ink-muted uppercase tracking-wider mb-1">Kunde</p>
          <Link
            href={`/admin/kunden/${impulse.project.client.id}`}
            className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            {impulse.project.client.name}
          </Link>
        </div>
        )}
        <div className="bg-dark-100 border border-border rounded-xl px-4 py-3">
          <p className="text-[10px] text-ink-muted uppercase tracking-wider mb-1">Projekt</p>
          <Link
            href={`/admin/projekte/${impulse.project.id}`}
            className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
          >
            {impulse.project.name}
          </Link>
        </div>
        <div className="bg-dark-100 border border-border rounded-xl px-4 py-3">
          <p className="text-[10px] text-ink-muted uppercase tracking-wider mb-1">Von</p>
          <p className="text-sm font-medium text-surface">{impulse.author.name}</p>
        </div>
        <div className="bg-dark-100 border border-border rounded-xl px-4 py-3">
          <p className="text-[10px] text-ink-muted uppercase tracking-wider mb-1">Datum</p>
          <p className="text-sm text-surface">{formatDate(impulse.createdAt)}</p>
        </div>
      </div>

      {/* Area */}
      {impulse.area && (
        <div className="mb-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-dark-300 border border-border text-ink-muted">
            Bereich: {impulse.area}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="bg-dark-100 border border-border rounded-xl p-6 mb-6">
        <h2 className="text-xs font-medium text-ink-muted uppercase tracking-widest mb-4">
          Nachricht
        </h2>
        <p className="text-sm text-surface leading-relaxed whitespace-pre-wrap">
          {impulse.content}
        </p>
      </div>

      {/* Comment thread */}
      <div className="bg-dark-100 border border-border rounded-xl p-6">
        <h2 className="text-xs font-medium text-ink-muted uppercase tracking-widest mb-4">
          Konversation
        </h2>
        <CommentThread
          impulseId={impulseId}
          initialComments={impulse.comments.map((c) => ({
            id: c.id,
            content: c.content,
            createdAt: c.createdAt.toISOString(),
            author: {
              id: c.author.id,
              name: c.author.name,
              role: c.author.role,
            },
          }))}
        />
      </div>
    </div>
  );
}
