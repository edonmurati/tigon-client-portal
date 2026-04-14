"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { ImpulseStatus } from "@/generated/prisma";

interface StatusSelectProps {
  impulseId: string;
  currentStatus: ImpulseStatus;
  onStatusChange?: (status: ImpulseStatus) => void;
}

const statusConfig: Record<
  ImpulseStatus,
  { label: string; color: string; dotColor: string }
> = {
  NEW: {
    label: "Neu",
    color: "text-accent border-accent/30 bg-accent/10",
    dotColor: "bg-accent",
  },
  SEEN: {
    label: "Gesehen",
    color: "text-blue-400 border-blue-400/30 bg-blue-400/10",
    dotColor: "bg-blue-400",
  },
  IN_PROGRESS: {
    label: "In Bearbeitung",
    color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    dotColor: "bg-yellow-400",
  },
  ACCEPTED: {
    label: "Angenommen",
    color: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
    dotColor: "bg-cyan-400",
  },
  REJECTED: {
    label: "Abgelehnt",
    color: "text-red-400 border-red-400/30 bg-red-400/10",
    dotColor: "bg-red-400",
  },
  DONE: {
    label: "Erledigt",
    color: "text-green-400 border-green-400/30 bg-green-400/10",
    dotColor: "bg-green-400",
  },
};

const allStatuses: ImpulseStatus[] = [
  "NEW",
  "SEEN",
  "IN_PROGRESS",
  "ACCEPTED",
  "REJECTED",
  "DONE",
];

export function StatusSelect({
  impulseId,
  currentStatus,
  onStatusChange,
}: StatusSelectProps) {
  const [status, setStatus] = useState<ImpulseStatus>(currentStatus);
  const [loading, setLoading] = useState(false);

  const config = statusConfig[status];

  async function handleChange(newStatus: ImpulseStatus) {
    if (newStatus === status || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/impulse/${impulseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        onStatusChange?.(newStatus);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium",
          config.color
        )}
      >
        <div className={cn("w-2 h-2 rounded-full shrink-0", config.dotColor)} />
        <span>{config.label}</span>
      </div>

      <select
        className="bg-dark-200 border border-border rounded-lg px-3 py-1.5 text-sm text-surface focus:outline-none focus:border-accent transition-colors cursor-pointer appearance-none disabled:opacity-50"
        value={status}
        disabled={loading}
        onChange={(e) => handleChange(e.target.value as ImpulseStatus)}
      >
        {allStatuses.map((s) => (
          <option key={s} value={s} className="bg-dark-200">
            {statusConfig[s].label}
          </option>
        ))}
      </select>
    </div>
  );
}
