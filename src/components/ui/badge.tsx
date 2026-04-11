import { cn } from "@/lib/utils";
import type { ImpulseStatus, ImpulseType } from "@/generated/prisma";

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
