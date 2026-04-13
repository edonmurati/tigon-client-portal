"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, CheckCircle2, Circle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import {
  taskPriorityLabels,
  taskPriorityColors,
  clientStageColors,
} from "@/lib/constants";
import type { TaskPriority } from "@/generated/prisma";

type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  dueDate: string | null;
  completedAt: string | null;
  assignee: { id: string; name: string; email: string } | null;
  client: { id: string; name: string; stage: string } | null;
  project: { id: string; name: string } | null;
};

type ClientOption = { id: string; name: string };
type ProjectOption = { id: string; name: string; clientId: string | null };
type UserOption = { id: string; name: string };

type Filter = "open" | "done" | "all" | "mine";

interface Props {
  initialTasks: Task[];
  clients: ClientOption[];
  projects: ProjectOption[];
  admins: UserOption[];
  currentUserId: string;
}

export function AufgabenBoard({
  initialTasks,
  clients,
  projects,
  admins,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filter, setFilter] = useState<Filter>("open");
  const [showNew, setShowNew] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Filtered view
  const filtered = tasks.filter((t) => {
    if (filter === "open") return !t.completedAt;
    if (filter === "done") return !!t.completedAt;
    if (filter === "mine") return !t.completedAt && t.assignee?.id === currentUserId;
    return true;
  });

  async function toggleComplete(task: Task) {
    const newValue = task.completedAt ? null : new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completedAt: newValue } : t))
    );
    try {
      const res = await fetch(`/api/admin/aufgaben/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ completedAt: newValue }),
      });
      if (!res.ok) throw new Error("Update failed");
    } catch {
      // Revert
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, completedAt: task.completedAt } : t
        )
      );
      setError("Aufgabe konnte nicht aktualisiert werden.");
    }
  }

  async function deleteTask(task: Task) {
    if (!confirm(`Aufgabe "${task.title}" wirklich löschen?`)) return;
    const prev = tasks;
    setTasks((ts) => ts.filter((t) => t.id !== task.id));
    try {
      const res = await fetch(`/api/admin/aufgaben/${task.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete failed");
    } catch {
      setTasks(prev);
      setError("Aufgabe konnte nicht gelöscht werden.");
    }
  }

  async function createTask(form: FormData) {
    const title = (form.get("title") as string)?.trim();
    if (!title) return;

    const clientId = (form.get("clientId") as string) || undefined;
    const projectId = (form.get("projectId") as string) || undefined;
    const assigneeId = (form.get("assigneeId") as string) || undefined;
    const priority = (form.get("priority") as TaskPriority) || "NORMAL";
    const description = (form.get("description") as string)?.trim() || undefined;
    const dueDateRaw = (form.get("dueDate") as string) || "";

    const payload = {
      title,
      ...(description ? { description } : {}),
      ...(clientId ? { clientId } : {}),
      ...(projectId ? { projectId } : {}),
      ...(assigneeId ? { assigneeId } : {}),
      priority,
      ...(dueDateRaw ? { dueDate: new Date(dueDateRaw).toISOString() } : {}),
    };

    try {
      const res = await fetch("/api/admin/aufgaben", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Aufgabe konnte nicht erstellt werden.");
        return;
      }
      const data = await res.json();
      setTasks((prev) => [data.task, ...prev]);
      setShowNew(false);
      setError(null);
      startTransition(() => router.refresh());
    } catch {
      setError("Netzwerkfehler.");
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl text-surface tracking-tightest">
            Aufgaben
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            {tasks.filter((t) => !t.completedAt).length} offen ·{" "}
            {tasks.filter((t) => !!t.completedAt).length} erledigt
          </p>
        </div>
        <Button onClick={() => setShowNew((v) => !v)}>
          {showNew ? <X size={16} /> : <Plus size={16} />}
          {showNew ? "Abbrechen" : "Neue Aufgabe"}
        </Button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* New task form */}
      {showNew && (
        <form
          action={createTask}
          className="mb-6 bg-dark-100 border border-border rounded-xl p-5 space-y-3"
        >
          <Input name="title" placeholder="Titel…" required autoFocus />
          <Textarea name="description" placeholder="Beschreibung (optional)…" rows={2} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select
              name="priority"
              defaultValue="NORMAL"
              className="bg-dark-200 border border-border rounded-xl px-3 py-2 text-sm text-surface focus:border-accent outline-none"
            >
              {Object.entries(taskPriorityLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <select
              name="assigneeId"
              defaultValue={currentUserId}
              className="bg-dark-200 border border-border rounded-xl px-3 py-2 text-sm text-surface focus:border-accent outline-none"
            >
              <option value="">Kein Assignee</option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <select
              name="clientId"
              className="bg-dark-200 border border-border rounded-xl px-3 py-2 text-sm text-surface focus:border-accent outline-none"
            >
              <option value="">Kein Kunde</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              name="projectId"
              className="bg-dark-200 border border-border rounded-xl px-3 py-2 text-sm text-surface focus:border-accent outline-none"
            >
              <option value="">Kein Projekt</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <Input name="dueDate" type="date" />
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              Anlegen
            </Button>
          </div>
        </form>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-border">
        {(
          [
            { key: "open", label: "Offen" },
            { key: "mine", label: "Meine" },
            { key: "done", label: "Erledigt" },
            { key: "all", label: "Alle" },
          ] as { key: Filter; label: string }[]
        ).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              filter === f.key
                ? "text-accent border-accent"
                : "text-ink-muted border-transparent hover:text-surface"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <div className="bg-dark-100 border border-border rounded-xl">
          <EmptyState
            icon={CheckCircle2}
            title={filter === "done" ? "Noch nichts erledigt" : "Keine Aufgaben"}
            description={
              filter === "done"
                ? "Sobald Aufgaben abgeschlossen werden, erscheinen sie hier."
                : "Lege eine neue Aufgabe an, um loszulegen."
            }
          />
        </div>
      ) : (
        <div className="bg-dark-100 border border-border rounded-xl divide-y divide-border overflow-hidden">
          {filtered.map((task) => {
            const isDone = !!task.completedAt;
            const overdue = !isDone && task.dueDate && new Date(task.dueDate) < new Date();
            return (
              <div
                key={task.id}
                className="flex items-start gap-3 px-5 py-3 hover:bg-dark-200 transition-colors group"
              >
                <button
                  onClick={() => toggleComplete(task)}
                  className="mt-0.5 shrink-0 text-ink-muted hover:text-accent transition-colors"
                  aria-label={isDone ? "Als offen markieren" : "Als erledigt markieren"}
                >
                  {isDone ? (
                    <CheckCircle2 size={18} className="text-accent" />
                  ) : (
                    <Circle size={18} />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/admin/aufgaben/${task.id}`}
                    className={`text-sm font-medium hover:text-accent transition-colors ${
                      isDone ? "text-ink-muted line-through" : "text-surface"
                    }`}
                  >
                    {task.title}
                  </Link>
                  {task.description && (
                    <p className="text-xs text-ink-muted mt-0.5 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-ink-muted">
                    <span
                      className={`font-medium uppercase tracking-wider text-[10px] ${taskPriorityColors[task.priority] ?? ""}`}
                    >
                      {taskPriorityLabels[task.priority]}
                    </span>
                    {task.assignee && (
                      <>
                        <span>·</span>
                        <span>{task.assignee.name}</span>
                      </>
                    )}
                    {task.client && (
                      <>
                        <span>·</span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] ${clientStageColors[task.client.stage] ?? ""}`}
                        >
                          {task.client.name}
                        </span>
                      </>
                    )}
                    {task.project && (
                      <>
                        <span>·</span>
                        <span>{task.project.name}</span>
                      </>
                    )}
                    {task.dueDate && (
                      <>
                        <span>·</span>
                        <span className={overdue ? "text-red-400" : ""}>
                          {overdue ? "Überfällig: " : "Fällig: "}
                          {new Date(task.dueDate).toLocaleDateString("de-DE")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task)}
                  className="shrink-0 text-ink-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1"
                  aria-label="Aufgabe löschen"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
