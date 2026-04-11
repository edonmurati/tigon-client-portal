"use client";

import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | Date | null;
  completedAt: string | Date | null;
  sortOrder: number;
}

interface MilestoneManagerProps {
  projectId: string;
  initialMilestones: Milestone[];
}

function formatDate(date: string | Date | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function MilestoneManager({ projectId, initialMilestones }: MilestoneManagerProps) {
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [adding, setAdding] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || adding) return;

    setAdding(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/projekte/${projectId}/milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: newTitle.trim(),
          dueDate: newDueDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Fehler beim Hinzufügen");
        return;
      }
      setMilestones((prev) => [...prev, data.milestone]);
      setNewTitle("");
      setNewDueDate("");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggleComplete(milestone: Milestone) {
    if (togglingId) return;
    setTogglingId(milestone.id);
    try {
      const completedAt = milestone.completedAt ? null : new Date().toISOString();
      const res = await fetch(
        `/api/admin/projekte/${projectId}/milestones?milestoneId=${milestone.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ completedAt }),
        }
      );
      if (res.ok) {
        setMilestones((prev) =>
          prev.map((m) =>
            m.id === milestone.id ? { ...m, completedAt } : m
          )
        );
      }
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(milestoneId: string) {
    if (deletingId) return;
    setDeletingId(milestoneId);
    try {
      const res = await fetch(
        `/api/admin/projekte/${projectId}/milestones?milestoneId=${milestoneId}`,
        { method: "DELETE", credentials: "include" }
      );
      if (res.ok) {
        setMilestones((prev) => prev.filter((m) => m.id !== milestoneId));
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Milestones list */}
      {milestones.length > 0 && (
        <div className="space-y-2">
          {milestones.map((milestone) => {
            const isCompleted = !!milestone.completedAt;
            return (
              <div
                key={milestone.id}
                className="flex items-center gap-3 px-4 py-3 bg-dark-200 border border-border rounded-xl group"
              >
                {/* Toggle complete */}
                <button
                  onClick={() => handleToggleComplete(milestone)}
                  disabled={togglingId === milestone.id}
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150",
                    isCompleted
                      ? "bg-green-500 border-green-500"
                      : "border-border hover:border-accent",
                    "disabled:opacity-50"
                  )}
                  aria-label={isCompleted ? "Als offen markieren" : "Als abgeschlossen markieren"}
                >
                  {isCompleted && <Check size={10} className="text-dark" strokeWidth={3} />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCompleted ? "line-through text-ink-muted" : "text-surface"
                    )}
                  >
                    {milestone.title}
                  </p>
                  {milestone.dueDate && (
                    <p className="text-xs text-ink-muted mt-0.5">
                      Fällig: {formatDate(milestone.dueDate)}
                      {isCompleted && milestone.completedAt && (
                        <span className="ml-2 text-green-400">
                          ✓ {formatDate(milestone.completedAt)}
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(milestone.id)}
                  disabled={deletingId === milestone.id}
                  className="text-ink-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  aria-label="Meilenstein löschen"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add new milestone */}
      <form onSubmit={handleAdd} className="flex items-center gap-2 flex-wrap">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Neuer Meilenstein..."
          className="flex-1 min-w-[200px] bg-dark-200 border border-border rounded-lg px-3 py-2 text-sm text-surface placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
          disabled={adding}
        />
        <input
          type="date"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
          className="bg-dark-200 border border-border rounded-lg px-3 py-2 text-sm text-surface focus:outline-none focus:border-accent transition-colors"
          disabled={adding}
          title="Fälligkeitsdatum (optional)"
        />
        <Button type="submit" size="sm" loading={adding} disabled={!newTitle.trim()}>
          <Plus size={14} />
          Hinzufügen
        </Button>
      </form>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
