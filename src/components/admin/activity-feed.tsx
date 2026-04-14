"use client";

import { useState } from "react";
import {
  FileText,
  MessageSquare,
  Zap,
  Users,
  FolderOpen,
  Phone,
  Video,
  Mail,
  Send,
  CheckCircle2,
  Edit,
  Trash2,
  ArrowRightCircle,
  Flag,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import { timeAgo } from "@/lib/time";

interface ActivityEntry {
  id: string;
  kind: string;
  channel: string | null;
  direction: string | null;
  subject: string | null;
  summary: string | null;
  occurredAt: string | Date;
  actorId: string | null;
  clientId: string | null;
  projectId: string | null;
  actor: { id: string; name: string } | null;
  client: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
}

interface ActivityFeedProps {
  initialActivities: ActivityEntry[];
  initialNextCursor: string | null;
  filters?: {
    clientId?: string;
    kind?: string;
    userId?: string;
  };
}

const kindIcons: Record<string, LucideIcon> = {
  CREATED: FileText,
  UPDATED: Edit,
  DELETED: Trash2,
  STATUS_CHANGED: ArrowRightCircle,
  NOTE: MessageSquare,
  MEETING: Video,
  CALL: Phone,
  EMAIL: Mail,
  WHATSAPP: MessageSquare,
  OUTREACH_SENT: Send,
  OUTREACH_REPLY: Mail,
  IMPULSE_ACCEPTED: CheckCircle2,
  IMPULSE_RESOLVED: CheckCircle2,
  MILESTONE_REACHED: Flag,
  DEPLOYED: Rocket,
  IN_PERSON: Users,
};

const kindLabels: Record<string, string> = {
  CREATED: "Erstellt",
  UPDATED: "Aktualisiert",
  DELETED: "Geloescht",
  STATUS_CHANGED: "Status geaendert",
  NOTE: "Notiz",
  MEETING: "Meeting",
  CALL: "Call",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
  IN_PERSON: "Persoenlich",
  OUTREACH_SENT: "Outreach gesendet",
  OUTREACH_REPLY: "Outreach Antwort",
  IMPULSE_ACCEPTED: "Impuls akzeptiert",
  IMPULSE_RESOLVED: "Impuls geloest",
  MILESTONE_REACHED: "Meilenstein erreicht",
  DEPLOYED: "Deployed",
};

function getKindLabel(kind: string): string {
  return kindLabels[kind] ?? kind;
}

function getKindIcon(kind: string): LucideIcon {
  return kindIcons[kind] ?? FolderOpen;
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
      if (filters?.kind) params.set("kind", filters.kind);
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
        <p className="text-ink-muted text-sm">Noch keine Aktivitaeten</p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-dark-100 border border-border rounded-xl overflow-hidden">
        <div className="divide-y divide-border">
          {activities.map((activity) => {
            const Icon = getKindIcon(activity.kind);
            const label = activity.subject ?? getKindLabel(activity.kind);
            const subtext = activity.summary ?? null;

            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 px-5 py-4 hover:bg-dark-200 transition-colors"
              >
                <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-dark-300 border border-border flex items-center justify-center">
                  <Icon size={14} className="text-ink-muted" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface">{label}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {activity.actor && (
                      <span className="text-xs text-ink-muted">
                        {activity.actor.name}
                      </span>
                    )}
                    {activity.client && (
                      <>
                        {activity.actor && (
                          <span className="text-xs text-ink-muted/40">·</span>
                        )}
                        <span className="text-xs text-ink-muted">
                          {activity.client.name}
                        </span>
                      </>
                    )}
                    {activity.project && (
                      <>
                        <span className="text-xs text-ink-muted/40">·</span>
                        <span className="text-xs text-ink-muted">
                          {activity.project.name}
                        </span>
                      </>
                    )}
                    {subtext && (
                      <>
                        <span className="text-xs text-ink-muted/40">·</span>
                        <span className="text-xs text-ink-muted/70 truncate max-w-[240px]">
                          {subtext}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-xs text-ink-muted whitespace-nowrap">
                    {timeAgo(new Date(activity.occurredAt))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
