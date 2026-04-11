import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { CredentialTypeBadge } from "@/components/ui/badge";
import { RevealButton } from "@/components/admin/reveal-button";
import { CredentialForm } from "@/components/admin/credential-form";
import { DeleteCredentialButton } from "./delete-button";

interface PageProps {
  params: Promise<{ credentialId: string }>;
}

export default async function ZugangsdatenDetailPage({ params }: PageProps) {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const { credentialId } = await params;

  const [credential, clients, projects] = await Promise.all([
    prisma.credential.findUnique({
      where: { id: credentialId },
      select: {
        id: true,
        label: true,
        type: true,
        url: true,
        username: true,
        notes: true,
        clientId: true,
        projectId: true,
        createdAt: true,
        updatedAt: true,
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    }),
    prisma.client.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      select: { id: true, name: true, clientId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!credential) notFound();

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Back link */}
      <Link
        href="/admin/zugangsdaten"
        className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-surface transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Zurück zu Zugangsdaten
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-serif text-3xl text-surface tracking-tightest">
            {credential.label}
          </h1>
          <CredentialTypeBadge type={credential.type} />
        </div>
        <DeleteCredentialButton credentialId={credential.id} label={credential.label} />
      </div>

      {/* Detail card */}
      <div className="bg-dark-100 border border-border rounded-xl divide-y divide-border mb-6">
        {/* URL */}
        {credential.url && (
          <div className="px-5 py-4">
            <p className="text-[10px] font-medium text-ink-muted uppercase tracking-widest mb-1.5">URL</p>
            <a
              href={credential.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover transition-colors"
            >
              <ExternalLink size={13} />
              {credential.url}
            </a>
          </div>
        )}

        {/* Username */}
        {credential.username && (
          <div className="px-5 py-4">
            <p className="text-[10px] font-medium text-ink-muted uppercase tracking-widest mb-1.5">Benutzername</p>
            <code className="text-sm text-surface font-mono">{credential.username}</code>
          </div>
        )}

        {/* Reveal */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-medium text-ink-muted uppercase tracking-widest mb-2">Passwort / Wert</p>
          <RevealButton credentialId={credential.id} />
        </div>

        {/* Notes */}
        {credential.notes && (
          <div className="px-5 py-4">
            <p className="text-[10px] font-medium text-ink-muted uppercase tracking-widest mb-1.5">Notizen</p>
            <p className="text-sm text-surface leading-relaxed whitespace-pre-wrap">{credential.notes}</p>
          </div>
        )}

        {/* Client + Project */}
        {(credential.client || credential.project) && (
          <div className="px-5 py-4">
            <p className="text-[10px] font-medium text-ink-muted uppercase tracking-widest mb-2">Zuordnung</p>
            <div className="flex items-center gap-4 flex-wrap">
              {credential.client && (
                <Link
                  href={`/admin/kunden/${credential.clientId}`}
                  className="text-sm text-accent hover:text-accent-hover transition-colors"
                >
                  {credential.client.name}
                </Link>
              )}
              {credential.project && (
                <Link
                  href={`/admin/projekte/${credential.projectId}`}
                  className="text-sm text-ink-muted hover:text-surface transition-colors"
                >
                  {credential.project.name}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-medium text-ink-muted uppercase tracking-widest mb-1">Erstellt</p>
            <p className="text-xs text-ink-muted">{formatDate(credential.createdAt)}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-ink-muted uppercase tracking-widest mb-1">Zuletzt geändert</p>
            <p className="text-xs text-ink-muted">{formatDate(credential.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div>
        <h2 className="text-sm font-medium text-surface mb-4">Bearbeiten</h2>
        <CredentialForm
          credential={credential}
          clients={clients}
          projects={projects}
        />
      </div>
    </div>
  );
}
