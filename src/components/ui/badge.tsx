import { cn } from "@/lib/utils";
import type { ImpulseStatus, ImpulseType, CredentialType, ServerStatus, NoteType } from "@/generated/prisma";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "status" | "type" | "project" | "default";
}

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}

const statusColors: Record<ImpulseStatus, string> = {
  NEW: "bg-accent/20 text-accent",
  SEEN: "bg-blue-500/20 text-blue-400",
  IN_PROGRESS: "bg-yellow-500/20 text-yellow-400",
  DONE: "bg-green-500/20 text-green-400",
};

const statusLabels: Record<ImpulseStatus, string> = {
  NEW: "Neu",
  SEEN: "Gesehen",
  IN_PROGRESS: "In Bearbeitung",
  DONE: "Erledigt",
};

const typeColors: Record<ImpulseType, string> = {
  FEEDBACK: "bg-purple-500/20 text-purple-400",
  CHANGE_REQUEST: "bg-orange-500/20 text-orange-400",
  QUESTION: "bg-cyan-500/20 text-cyan-400",
  IDEA: "bg-pink-500/20 text-pink-400",
};

const typeLabels: Record<ImpulseType, string> = {
  FEEDBACK: "Feedback",
  CHANGE_REQUEST: "Änderungswunsch",
  QUESTION: "Frage",
  IDEA: "Idee",
};

const projectStatusColors: Record<string, string> = {
  ACTIVE: "bg-green-500/20 text-green-400",
  COMPLETED: "bg-ink-muted/20 text-ink-muted",
  PAUSED: "bg-yellow-500/20 text-yellow-400",
};

const projectStatusLabels: Record<string, string> = {
  ACTIVE: "Aktiv",
  COMPLETED: "Abgeschlossen",
  PAUSED: "Pausiert",
};

export function ImpulseStatusBadge({ status }: { status: ImpulseStatus }) {
  return (
    <Badge className={statusColors[status]}>{statusLabels[status]}</Badge>
  );
}

export function ImpulseTypeBadge({ type }: { type: ImpulseType }) {
  return (
    <Badge className={typeColors[type]}>{typeLabels[type]}</Badge>
  );
}

export function ProjectStatusBadge({ status }: { status: string }) {
  return (
    <Badge className={projectStatusColors[status] ?? "bg-dark-300 text-ink-muted"}>
      {projectStatusLabels[status] ?? status}
    </Badge>
  );
}

const credentialTypeColors: Record<CredentialType, string> = {
  LOGIN: "bg-blue-500/20 text-blue-400",
  API_KEY: "bg-purple-500/20 text-purple-400",
  ENV_VARIABLE: "bg-yellow-500/20 text-yellow-400",
  SSH_KEY: "bg-green-500/20 text-green-400",
  DATABASE: "bg-orange-500/20 text-orange-400",
  OTHER: "bg-dark-300 text-ink-muted",
};

const credentialTypeLabels: Record<CredentialType, string> = {
  LOGIN: "Login",
  API_KEY: "API Key",
  ENV_VARIABLE: "Env Var",
  SSH_KEY: "SSH Key",
  DATABASE: "Datenbank",
  OTHER: "Sonstige",
};

export function CredentialTypeBadge({ type }: { type: CredentialType }) {
  return (
    <Badge className={credentialTypeColors[type]}>{credentialTypeLabels[type]}</Badge>
  );
}

const serverStatusColors: Record<ServerStatus, string> = {
  ONLINE: "bg-green-500/20 text-green-400",
  DEGRADED: "bg-yellow-500/20 text-yellow-400",
  OFFLINE: "bg-red-500/20 text-red-400",
  MAINTENANCE: "bg-blue-500/20 text-blue-400",
};

const serverStatusLabels: Record<ServerStatus, string> = {
  ONLINE: "Online",
  DEGRADED: "Eingeschränkt",
  OFFLINE: "Offline",
  MAINTENANCE: "Wartung",
};

export function ServerStatusBadge({ status }: { status: ServerStatus }) {
  return (
    <Badge className={serverStatusColors[status]}>{serverStatusLabels[status]}</Badge>
  );
}

const noteTypeColors: Record<NoteType, string> = {
  MEETING: "bg-purple-500/20 text-purple-400",
  CALL: "bg-blue-500/20 text-blue-400",
  EMAIL: "bg-yellow-500/20 text-yellow-400",
  INTERNAL: "bg-dark-300 text-ink-muted",
};

const noteTypeLabels: Record<NoteType, string> = {
  MEETING: "Meeting",
  CALL: "Anruf",
  EMAIL: "E-Mail",
  INTERNAL: "Intern",
};

export function NoteTypeBadge({ type }: { type: NoteType }) {
  return (
    <Badge className={noteTypeColors[type]}>{noteTypeLabels[type]}</Badge>
  );
}
