"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { taskPriorityLabels } from "@/lib/constants";
import type { TaskPriority } from "@/generated/prisma";

type ClientOption = { id: string; name: string };
type ProjectOption = { id: string; name: string; clientId: string | null };
type UserOption = { id: string; name: string };

interface InitialData {
  title: string;
  description: string | null;
  priority: TaskPriority;
  assigneeIds: string[];
  clientId: string | null;
  projectId: string | null;
  dueDate: string | null;
  completedAt: string | null;
}

interface Props {
  taskId: string;
  initialData: InitialData;
  clients: ClientOption[];
  projects: ProjectOption[];
  admins: UserOption[];
}

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function TaskForm({ taskId, initialData, clients, projects, admins }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(initialData.priority);
  const [assigneeIds, setAssigneeIds] = useState<string[]>(initialData.assigneeIds);
  const [clientId, setClientId] = useState(initialData.clientId ?? "");
  const [projectId, setProjectId] = useState(initialData.projectId ?? "");
  const [dueDate, setDueDate] = useState(toDateInput(initialData.dueDate));
  const [completed, setCompleted] = useState(!!initialData.completedAt);

  function toggleAssignee(id: string) {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const visibleProjects = clientId
    ? projects.filter((p) => p.clientId === clientId)
    : projects;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      title: title.trim(),
      description: description.trim() ? description : null,
      priority,
      assigneeIds,
      clientId: clientId || null,
      projectId: projectId || null,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      completedAt: completed
        ? initialData.completedAt ?? new Date().toISOString()
        : null,
    };

    try {
      const res = await fetch(`/api/admin/aufgaben/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Speichern fehlgeschlagen.");
        setSaving(false);
        return;
      }
      startTransition(() => {
        router.push("/admin/aufgaben");
        router.refresh();
      });
    } catch {
      setError("Netzwerkfehler.");
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Aufgabe "${initialData.title}" wirklich löschen?`)) return;
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/aufgaben/${taskId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        setError("Löschen fehlgeschlagen.");
        setDeleting(false);
        return;
      }
      startTransition(() => {
        router.push("/admin/aufgaben");
        router.refresh();
      });
    } catch {
      setError("Netzwerkfehler.");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="bg-dark-100 border border-border rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink-muted uppercase tracking-widest mb-2">
            Titel
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-muted uppercase tracking-widest mb-2">
            Beschreibung
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Optional…"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink-muted uppercase tracking-widest mb-2">
              Priorität
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full bg-dark-200 border border-border rounded-xl px-3 py-2 text-sm text-surface focus:border-accent outline-none"
            >
              {Object.entries(taskPriorityLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted uppercase tracking-widest mb-2">
              Fällig
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-ink-muted uppercase tracking-widest mb-2">
              Assignees
            </label>
            <div className="flex flex-wrap gap-2">
              {admins.map((a) => {
                const active = assigneeIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAssignee(a.id)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                      active
                        ? "bg-accent/20 border-accent text-surface"
                        : "bg-dark-200 border-border text-ink-muted hover:text-surface"
                    }`}
                  >
                    {a.name}
                  </button>
                );
              })}
              {admins.length === 0 && (
                <span className="text-xs text-ink-muted">Keine Admins</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted uppercase tracking-widest mb-2">
              Kunde
            </label>
            <select
              value={clientId}
              onChange={(e) => {
                const next = e.target.value;
                setClientId(next);
                if (projectId) {
                  const p = projects.find((p) => p.id === projectId);
                  if (p && p.clientId !== next) setProjectId("");
                }
              }}
              className="w-full bg-dark-200 border border-border rounded-xl px-3 py-2 text-sm text-surface focus:border-accent outline-none"
            >
              <option value="">Kein Kunde</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted uppercase tracking-widest mb-2">
              Projekt
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full bg-dark-200 border border-border rounded-xl px-3 py-2 text-sm text-surface focus:border-accent outline-none"
            >
              <option value="">Kein Projekt</option>
              {visibleProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-surface">
              <input
                type="checkbox"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                className="w-4 h-4 accent-accent"
              />
              Erledigt
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={remove}
          disabled={deleting || saving || isPending}
          className="inline-flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
        >
          <Trash2 size={14} />
          {deleting ? "Lösche…" : "Löschen"}
        </button>
        <Button type="submit" disabled={saving || deleting || isPending}>
          {saving ? "Speichere…" : "Speichern"}
        </Button>
      </div>
    </form>
  );
}
