"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, ExternalLink, Edit, Trash2, FolderOpen, User } from "lucide-react";
import { CredentialTypeBadge } from "@/components/ui/badge";
import { RevealButton } from "@/components/admin/reveal-button";
import type { CredentialType } from "@/generated/prisma";

interface CredentialCardProps {
  credential: {
    id: string;
    label: string;
    type: CredentialType;
    url?: string | null;
    username?: string | null;
    notes?: string | null;
    client?: { name: string } | null;
    project?: { name: string } | null;
    createdAt: Date | string;
  };
}

export function CredentialCard({ credential }: CredentialCardProps) {
  const router = useRouter();
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function copyUsername() {
    if (!credential.username) return;
    await navigator.clipboard.writeText(credential.username);
    setCopiedUsername(true);
    setTimeout(() => setCopiedUsername(false), 2000);
  }

  async function handleDelete() {
    if (!confirm(`"${credential.label}" wirklich löschen?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/zugangsdaten/${credential.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <div className="bg-dark-100 border border-border rounded-xl p-5 space-y-4 hover:border-border/80 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <CredentialTypeBadge type={credential.type} />
          </div>
          <p className="text-sm font-medium text-surface truncate">{credential.label}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <a
            href={`/admin/zugangsdaten/${credential.id}`}
            className="p-1.5 text-ink-muted hover:text-surface transition-colors rounded-lg hover:bg-dark-200"
            title="Bearbeiten"
          >
            <Edit size={13} />
          </a>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 text-ink-muted hover:text-red-400 transition-colors rounded-lg hover:bg-dark-200 disabled:opacity-50"
            title="Löschen"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* URL */}
      {credential.url && (
        <div>
          <p className="text-[10px] font-medium text-ink-muted uppercase tracking-widest mb-1">URL</p>
          <a
            href={credential.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors truncate max-w-full"
          >
            <ExternalLink size={11} />
            <span className="truncate">{credential.url}</span>
          </a>
        </div>
      )}

      {/* Username */}
      {credential.username && (
        <div>
          <p className="text-[10px] font-medium text-ink-muted uppercase tracking-widest mb-1">Benutzername</p>
          <div className="flex items-center gap-2">
            <code className="text-xs text-surface font-mono bg-dark-200 border border-border rounded px-2 py-1 flex-1 truncate">
              {credential.username}
            </code>
            <button
              onClick={copyUsername}
              className="shrink-0 p-1 text-ink-muted hover:text-surface transition-colors"
              title="Kopieren"
            >
              {copiedUsername ? (
                <Check size={12} className="text-green-400" />
              ) : (
                <Copy size={12} />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Reveal */}
      <div>
        <p className="text-[10px] font-medium text-ink-muted uppercase tracking-widest mb-2">Passwort / Wert</p>
        <RevealButton credentialId={credential.id} />
      </div>

      {/* Notes */}
      {credential.notes && (
        <div>
          <p className="text-[10px] font-medium text-ink-muted uppercase tracking-widest mb-1">Notizen</p>
          <p className="text-xs text-ink-muted leading-relaxed whitespace-pre-wrap line-clamp-3">
            {credential.notes}
          </p>
        </div>
      )}

      {/* Footer: client + project + date */}
      <div className="pt-2 border-t border-border flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {credential.client && (
            <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
              <User size={11} />
              {credential.client.name}
            </span>
          )}
          {credential.project && (
            <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
              <FolderOpen size={11} />
              {credential.project.name}
            </span>
          )}
        </div>
        <span className="text-xs text-ink-muted">{formatDate(credential.createdAt)}</span>
      </div>
    </div>
  );
}
