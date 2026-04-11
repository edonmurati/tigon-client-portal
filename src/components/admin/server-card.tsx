"use client";

import { useState } from "react";
import { ExternalLink, Copy, Check, Pencil, Trash2 } from "lucide-react";
import { ServerStatusBadge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ServerForm } from "@/components/admin/server-form";
import { timeAgo } from "@/lib/time";
import type { ServerStatus } from "@/generated/prisma";

interface ServerCardServer {
  id: string;
  name: string;
  provider: string | null;
  url: string | null;
  ip: string | null;
  status: ServerStatus;
  statusNote: string | null;
  lastChecked: Date | string | null;
  clientId: string | null;
  projectId: string | null;
  client?: { id: string; name: string } | null;
  project?: { id: string; name: string } | null;
}

interface ServerCardProps {
  server: ServerCardServer;
  clients: { id: string; name: string }[];
  projects: { id: string; name: string; clientId: string }[];
  onUpdate?: () => void;
  onDelete?: () => void;
}

const statusBorderColors: Record<ServerStatus, string> = {
  ONLINE: "border-l-green-500",
  DEGRADED: "border-l-yellow-500",
  OFFLINE: "border-l-red-500",
  MAINTENANCE: "border-l-blue-500",
};

const statusDotColors: Record<ServerStatus, string> = {
  ONLINE: "bg-green-500",
  DEGRADED: "bg-yellow-500",
  OFFLINE: "bg-red-500",
  MAINTENANCE: "bg-blue-500",
};

const statusDotActiveRing: Record<ServerStatus, string> = {
  ONLINE: "ring-2 ring-green-500/40",
  DEGRADED: "ring-2 ring-yellow-500/40",
  OFFLINE: "ring-2 ring-red-500/40",
  MAINTENANCE: "ring-2 ring-blue-500/40",
};

const ALL_STATUSES: ServerStatus[] = ["ONLINE", "DEGRADED", "OFFLINE", "MAINTENANCE"];

export function ServerCard({ server, clients, projects, onUpdate, onDelete }: ServerCardProps) {
  const [currentStatus, setCurrentStatus] = useState<ServerStatus>(server.status);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleStatusChange(newStatus: ServerStatus) {
    if (newStatus === currentStatus || updatingStatus) return;
    setUpdatingStatus(true);
    const prev = currentStatus;
    setCurrentStatus(newStatus);

    try {
      const res = await fetch(`/api/admin/infrastruktur/${server.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        setCurrentStatus(prev);
      } else {
        onUpdate?.();
      }
    } catch {
      setCurrentStatus(prev);
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/infrastruktur/${server.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        onDelete?.();
      }
    } finally {
      setDeleting(false);
      setDeleteConfirm(false);
    }
  }

  async function copyIp() {
    if (!server.ip) return;
    await navigator.clipboard.writeText(server.ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <div
        className={`bg-dark-100 border border-border border-l-4 ${statusBorderColors[currentStatus]} rounded-xl p-4 flex flex-col gap-3 transition-colors duration-150`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-surface truncate">{server.name}</p>
            {server.provider && (
              <p className="text-xs text-ink-muted mt-0.5">{server.provider}</p>
            )}
          </div>
          <ServerStatusBadge status={currentStatus} />
        </div>

        {/* URL + IP */}
        {(server.url || server.ip) && (
          <div className="space-y-1.5">
            {server.url && (
              <a
                href={server.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors truncate max-w-full"
              >
                <ExternalLink size={11} className="shrink-0" />
                <span className="truncate">{server.url}</span>
              </a>
            )}
            {server.ip && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-ink-muted">{server.ip}</span>
                <button
                  onClick={copyIp}
                  className="text-ink-muted hover:text-surface transition-colors"
                  aria-label="IP kopieren"
                >
                  {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Status note */}
        {server.statusNote && (
          <p className="text-xs text-ink-muted italic leading-relaxed">{server.statusNote}</p>
        )}

        {/* Client + Project */}
        {(server.client || server.project) && (
          <div className="flex items-center gap-2 flex-wrap">
            {server.client && (
              <span className="text-[10px] text-ink-muted bg-dark-200 border border-border px-2 py-0.5 rounded-full">
                {server.client.name}
              </span>
            )}
            {server.project && (
              <span className="text-[10px] text-ink-muted bg-dark-200 border border-border px-2 py-0.5 rounded-full">
                {server.project.name}
              </span>
            )}
          </div>
        )}

        {/* Footer: status dots + actions */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          {/* Quick status toggle */}
          <div className="flex items-center gap-1.5">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={updatingStatus}
                aria-label={s}
                className={`rounded-full transition-all duration-150 disabled:cursor-not-allowed ${
                  currentStatus === s
                    ? `w-3 h-3 ${statusDotColors[s]} ${statusDotActiveRing[s]}`
                    : `w-2.5 h-2.5 ${statusDotColors[s]} opacity-40 hover:opacity-70`
                }`}
              />
            ))}
            {server.lastChecked && (
              <span className="text-[10px] text-ink-muted ml-1">
                {timeAgo(server.lastChecked)}
              </span>
            )}
          </div>

          {/* Edit + Delete */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditOpen(true)}
              className="p-1.5 text-ink-muted hover:text-surface rounded-lg hover:bg-dark-200 transition-colors"
              aria-label="Bearbeiten"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="p-1.5 text-ink-muted hover:text-red-400 rounded-lg hover:bg-dark-200 transition-colors"
              aria-label="Löschen"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`${server.name} bearbeiten`}
      >
        <ServerForm
          server={{ ...server, clientId: server.clientId, projectId: server.projectId }}
          clients={clients}
          projects={projects}
          onSuccess={() => {
            setEditOpen(false);
            onUpdate?.();
          }}
          onCancel={() => setEditOpen(false)}
        />
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        title="Server löschen"
      >
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">
            Soll <span className="text-surface font-medium">{server.name}</span> wirklich gelöscht
            werden? Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirm(false)}
              disabled={deleting}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              size="sm"
              loading={deleting}
              onClick={handleDelete}
            >
              Löschen
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
