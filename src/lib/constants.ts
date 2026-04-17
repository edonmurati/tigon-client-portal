// ─── Client Stage ───────────────────────────────────────────────────────────

export const clientStageLabels: Record<string, string> = {
  COLD: "Cold",
  WARM: "Warm",
  ACTIVE: "Aktiv",
  PAUSED: "Pausiert",
  ENDED: "Beendet",
};

export const clientStageColors: Record<string, string> = {
  COLD: "text-blue-400 bg-blue-400/10 border border-blue-400/20",
  WARM: "text-orange-400 bg-orange-400/10 border border-orange-400/20",
  ACTIVE: "text-green-400 bg-green-400/10 border border-green-400/20",
  PAUSED: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20",
  ENDED: "text-ink-muted bg-dark-300 border border-border",
};

// ─── Project Status ─────────────────────────────────────────────────────────

export const projectStatusLabels: Record<string, string> = {
  ACTIVE: "Aktiv",
  COMPLETED: "Abgeschlossen",
  PAUSED: "Pausiert",
};

export const projectStatusColors: Record<string, string> = {
  ACTIVE: "text-green-400 bg-green-400/10 border border-green-400/20",
  COMPLETED: "text-blue-400 bg-blue-400/10 border border-blue-400/20",
  PAUSED: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20",
};

// ─── Project Type ───────────────────────────────────────────────────────────

export const projectTypeLabels: Record<string, string> = {
  CLIENT_PROJECT: "Kundenprojekt",
  PRODUCT: "Produkt",
  INTERNAL: "Intern",
};

export const projectTypeColors: Record<string, string> = {
  CLIENT_PROJECT: "text-accent bg-accent/10 border border-accent/20",
  PRODUCT: "text-purple-400 bg-purple-400/10 border border-purple-400/20",
  INTERNAL: "text-ink-muted bg-dark-300 border border-border",
};

// ─── Project Health ─────────────────────────────────────────────────────────

export const projectHealthLabels: Record<string, string> = {
  GREEN: "Gut",
  AMBER: "Achtung",
  RED: "Kritisch",
};

export const projectHealthColors: Record<string, string> = {
  GREEN: "text-green-400",
  AMBER: "text-yellow-400",
  RED: "text-red-400",
};

export const projectHealthDots: Record<string, string> = {
  GREEN: "bg-green-400",
  AMBER: "bg-yellow-400",
  RED: "bg-red-400",
};

// ─── Impulse Status ─────────────────────────────────────────────────────────

export const impulseStatusLabels: Record<string, string> = {
  NEW: "Neu",
  SEEN: "Gesehen",
  IN_PROGRESS: "In Bearbeitung",
  DONE: "Erledigt",
};

export const impulseStatusColors: Record<string, string> = {
  NEW: "text-accent bg-accent/10 border border-accent/20",
  SEEN: "text-blue-400 bg-blue-400/10 border border-blue-400/20",
  IN_PROGRESS: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20",
  DONE: "text-green-400 bg-green-400/10 border border-green-400/20",
};

// ─── Task Priority ──────────────────────────────────────────────────────────

export const taskPriorityLabels: Record<string, string> = {
  LOW: "Niedrig",
  NORMAL: "Normal",
  HIGH: "Hoch",
  URGENT: "Dringend",
};

export const taskPriorityColors: Record<string, string> = {
  LOW: "text-ink-muted",
  NORMAL: "text-blue-400",
  HIGH: "text-orange-400",
  URGENT: "text-red-400",
};

// ─── Knowledge Entry Category ───────────────────────────────────────────────

export const entryCategoryLabels: Record<string, string> = {
  CHANGELOG: "Changelog",
  DECISION: "Entscheidung",
  HANDOFF: "Handoff",
  IDEA: "Idee",
  PLAN: "Plan",
  RESEARCH: "Research",
  SPEC: "Spezifikation",
  PLAYBOOK: "Playbook",
  SOP: "SOP",
  MEETING_NOTE: "Meeting",
  INSIGHT: "Insight",
  JOURNAL: "Journal",
  OTHER: "Sonstiges",
};

export const entryCategoryColors: Record<string, string> = {
  CHANGELOG: "text-green-400 bg-green-400/10 border border-green-400/20",
  DECISION: "text-purple-400 bg-purple-400/10 border border-purple-400/20",
  HANDOFF: "text-blue-400 bg-blue-400/10 border border-blue-400/20",
  IDEA: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20",
  PLAN: "text-accent bg-accent/10 border border-accent/20",
  RESEARCH: "text-cyan-400 bg-cyan-400/10 border border-cyan-400/20",
  SPEC: "text-indigo-400 bg-indigo-400/10 border border-indigo-400/20",
  PLAYBOOK: "text-orange-400 bg-orange-400/10 border border-orange-400/20",
  SOP: "text-orange-400 bg-orange-400/10 border border-orange-400/20",
  MEETING_NOTE: "text-blue-400 bg-blue-400/10 border border-blue-400/20",
  INSIGHT: "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20",
  JOURNAL: "text-ink-muted bg-dark-300 border border-border",
  OTHER: "text-ink-muted bg-dark-300 border border-border",
};

// ─── Server Status ──────────────────────────────────────────────────────────

export const serverStatusLabels: Record<string, string> = {
  ONLINE: "Online",
  DEGRADED: "Eingeschränkt",
  OFFLINE: "Offline",
  MAINTENANCE: "Wartung",
};

export const serverStatusColors: Record<string, string> = {
  ONLINE: "text-green-400 bg-green-400/10 border border-green-400/20",
  DEGRADED: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20",
  OFFLINE: "text-red-400 bg-red-400/10 border border-red-400/20",
  MAINTENANCE: "text-blue-400 bg-blue-400/10 border border-blue-400/20",
};

// ─── Lead (Inbound) Status ───────────────────────────────────────────────────

export const leadStatusLabels: Record<string, string> = {
  NEW: "Neu",
  QUALIFIED: "Qualifiziert",
  OUTREACH_SENT: "Outreach gesendet",
  FOLLOWUP_1: "Follow-up 1",
  FOLLOWUP_2: "Follow-up 2",
  REPLIED: "Geantwortet",
  IN_CONVERSATION: "Im Gespräch",
  MEETING_BOOKED: "Meeting gebucht",
  CONVERTED: "Konvertiert",
  REJECTED: "Abgelehnt",
  UNRESPONSIVE: "Keine Reaktion",
  PARKED: "Geparkt",
};

export const leadStatusColors: Record<string, string> = {
  NEW: "text-accent bg-accent/10 border border-accent/20",
  QUALIFIED: "text-blue-400 bg-blue-400/10 border border-blue-400/20",
  OUTREACH_SENT: "text-purple-400 bg-purple-400/10 border border-purple-400/20",
  FOLLOWUP_1: "text-purple-400 bg-purple-400/10 border border-purple-400/20",
  FOLLOWUP_2: "text-purple-400 bg-purple-400/10 border border-purple-400/20",
  REPLIED: "text-cyan-400 bg-cyan-400/10 border border-cyan-400/20",
  IN_CONVERSATION: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20",
  MEETING_BOOKED: "text-orange-400 bg-orange-400/10 border border-orange-400/20",
  CONVERTED: "text-green-400 bg-green-400/10 border border-green-400/20",
  REJECTED: "text-red-400 bg-red-400/10 border border-red-400/20",
  UNRESPONSIVE: "text-ink-muted bg-dark-300 border border-border",
  PARKED: "text-ink-muted bg-dark-300 border border-border",
};
