"use client";

import { useState } from "react";
import {
  KeyRound,
  FileText,
  User,
  MessageSquare,
  Server,
  Zap,
  Users,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";
import { timeAgo } from "@/lib/time";

interface ActivityEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  meta: string | null;
  createdAt: string | Date;
  userId: string | null;
  clientId: string | null;
  user: { id: string; name: string } | null;
  client: { id: string; name: string } | null;
}

interface ActivityFeedProps {
  initialActivities: ActivityEntry[];
  initialNextCursor: string | null;
  filters?: {
    clientId?: string;
    entityType?: string;
    userId?: string;
  };
}

const entityTypeIcons: Record<string, LucideIcon> = {
  Credential: KeyRound,
  Document: FileText,
  ContactPerson: User,
  Note: MessageSquare,
  ServerEntry: Server,
  Impulse: Zap,
  Client: Users,
  Project: FolderOpen,
};

const actionLabels: Record<string, string> = {
  "credential.create": "Zugangsdaten erstellt",
  "credential.update": "Zugangsdaten aktualisiert",
  "credential.delete": "Zugangsdaten gelöscht",
  "credential.reveal": "Zugangsdaten eingesehen",
  "document.upload": "Dokument hochgeladen",
  "document.delete": "Dokument gelöscht",
  "note.create": "Notiz erstellt",
  "note.update": "Notiz aktualisiert",
  "note.delete": "Notiz gelöscht",
  "contact.create": "Kontakt erstellt",
  "contact.update": "Kontakt aktualisiert",
  "contact.delete": "Kontakt gelöscht",
  "server.create": "Server erstellt",
  "server.update": "Server aktualisiert",
  "server.delete": "Server gelöscht",
};

function getActionLabel(action: string): string {
  return actionLabels[action] ?? action;
}

function getEntityIcon(entityType: string): LucideIcon {
  return entityTypeIcons[entityType] ?? FolderOpen;
}

function parseMetaPreview(meta: string | null): string | null {
  if (!meta) return null;
  try {
    const parsed = JSON.parse(meta);
    const parts: string[] = [];
    if (parsed.label) parts.push(parsed.label);
    else if (parsed.name) parts.push(parsed.name);
    else if (parsed.title) parts.push(parsed.title);
    if (parsed.type) parts.push(parsed.type);
    return parts.length > 0 ? parts.join(" · ") : null;
  } catch {
    return null;
  }
}

export function ActivityFeed({
  initialActivities,
  initialNextCursor,
  filters,
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityEntry[]>(initialActivities);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (!nextCursor || loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ cursor: nextCursor, limit: "50" });
      if (filters?.clientId) params.set("clientId", filters.clientId);
      if (filters?.entityType) params.set("entityType", filters.entityType);
      if (filters?.userId) params.set("userId", filters.userId);

      const res = await fetch(`/api/admin/aktivitaet?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      setActivities((prev) => [...prev, ...(data.activities ?? [])]);
      setNextCursor(data.nextCursor ?? null);
    } finally {
      setLoading(false);
    }
  }

  if (activities.length === 0) {
    return (
      <div className="py-20 text-center">
        <Zap size={32} className="mx-auto mb-3 text-ink-muted/40" />
        <p className="text-ink-muted text-sm">Noch keine Aktivitäten</p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-dark-100 border border-border rounded-xl overflow-hidden">
        <div className="divide-y divide-border">
          {activities.map((activity) => {
            const Icon = getEntityIcon(activity.entityType);
            const label = getActionLabel(activity.action);
            const metaPreview = parseMetaPreview(activity.meta);

            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 px-5 py-4 hover:bg-dark-200 transition-colors"
              >
                {/* Icon */}
                <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-dark-300 border border-border flex items-center justify-center">
                  <Icon size={14} className="text-ink-muted" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface">{label}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {activity.user && (
                      <span className="text-xs text-ink-muted">
                        {activity.user.name}
                      </span>
                    )}
                    {activity.client && (
                      <>
                        {activity.user && (
                          <span className="text-xs text-ink-muted/40">·</span>
                        )}
                        <span className="text-xs text-ink-muted">
                          {activity.client.name}
                        </span>
                      </>
                    )}
                    {metaPreview && (
                      <>
                        <span className="text-xs text-ink-muted/40">·</span>
                        <span className="text-xs text-ink-muted/70 truncate max-w-[240px]">
                          {metaPreview}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Time */}
                <div className="shrink-0 text-right">
                  <span className="text-xs text-ink-muted whitespace-nowrap">
                    {timeAgo(new Date(activity.createdAt))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Load more */}
      {nextCursor && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-4 py-2 text-sm text-ink-muted hover:text-surface border border-border rounded-lg hover:border-accent/50 transition-all duration-150 disabled:opacity-50"
          >
            {loading ? "Laden..." : "Mehr laden"}
          </button>
        </div>
      )}
    </div>
  );
}
