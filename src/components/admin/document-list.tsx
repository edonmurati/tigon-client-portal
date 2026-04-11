"use client";

import { useState } from "react";
import { FileText, Image, File, Download, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DocumentItem {
  id: string;
  name: string;
  displayName?: string | null;
  mimeType: string;
  sizeBytes: number;
  category?: string | null;
  client?: { name: string } | null;
  project?: { name: string } | null;
  createdAt: Date | string;
  uploadedBy: { name: string };
}

interface DocumentListProps {
  documents: DocumentItem[];
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === "application/pdf" || mimeType.startsWith("text/")) {
    return <FileText size={18} className="text-ink-muted shrink-0" />;
  }
  if (mimeType.startsWith("image/")) {
    return <Image size={18} className="text-ink-muted shrink-0" />;
  }
  return <File size={18} className="text-ink-muted shrink-0" />;
}

export function DocumentList({ documents: initialDocuments }: DocumentListProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" wirklich löschen?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/dokumente/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (documents.length === 0) {
    return (
      <div className="bg-dark-100 border border-border rounded-xl px-5 py-12 text-center">
        <File size={32} className="text-ink-muted mx-auto mb-3" />
        <p className="text-sm text-ink-muted">Noch keine Dokumente vorhanden.</p>
      </div>
    );
  }

  return (
    <div className="bg-dark-100 border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-border">
        <span className="w-[18px]" />
        <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest">
          Name
        </span>
        <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest min-w-[100px]">
          Kunde / Projekt
        </span>
        <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest min-w-[60px] text-right">
          Größe
        </span>
        <span className="text-[10px] font-medium text-ink-muted uppercase tracking-widest min-w-[80px]">
          Hochgeladen
        </span>
        <span className="w-[72px]" />
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {documents.map((doc) => {
          const displayTitle = doc.displayName || doc.name;
          return (
            <div
              key={doc.id}
              className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 hover:bg-dark-200 transition-colors duration-150"
            >
              {/* Icon */}
              <FileIcon mimeType={doc.mimeType} />

              {/* Name + Category */}
              <div className="min-w-0">
                <p className="text-sm font-medium text-surface truncate">{displayTitle}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {doc.category && (
                    <Badge className="bg-accent/15 text-accent text-[10px]">
                      {doc.category}
                    </Badge>
                  )}
                  <p className="text-xs text-ink-muted truncate">
                    {doc.uploadedBy.name}
                  </p>
                </div>
              </div>

              {/* Client / Project */}
              <div className="min-w-[100px]">
                {doc.client ? (
                  <p className="text-xs text-ink-muted truncate">{doc.client.name}</p>
                ) : null}
                {doc.project ? (
                  <p className="text-xs text-ink-muted/60 truncate">{doc.project.name}</p>
                ) : null}
                {!doc.client && !doc.project && (
                  <p className="text-xs text-ink-muted">—</p>
                )}
              </div>

              {/* Size */}
              <div className="min-w-[60px] text-right">
                <span className="text-xs text-ink-muted font-mono">
                  {formatSize(doc.sizeBytes)}
                </span>
              </div>

              {/* Date */}
              <div className="min-w-[80px]">
                <span className="text-xs text-ink-muted">{formatDate(doc.createdAt)}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5">
                <a
                  href={`/api/admin/dokumente/${doc.id}/download`}
                  download
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-dark-300 border border-border text-ink-muted hover:text-surface hover:border-accent/40 transition-colors duration-150"
                  title="Herunterladen"
                >
                  <Download size={14} />
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={deletingId === doc.id}
                  onClick={() => handleDelete(doc.id, displayTitle)}
                  className="w-8 h-8 p-0 text-ink-muted hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10"
                  title="Löschen"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
