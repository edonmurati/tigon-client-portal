"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { ProjectStatus } from "@/generated/prisma";

interface ProjectFormProps {
  mode: "create" | "edit";
  projectId?: string;
  clientId?: string; // required for create
  clientName?: string;
  initialData?: {
    name?: string;
    description?: string;
    status?: ProjectStatus;
    startDate?: string | null;
    liveUrl?: string | null;
  };
}

const statusOptions = [
  { value: "ACTIVE", label: "Aktiv" },
  { value: "PAUSED", label: "Pausiert" },
  { value: "COMPLETED", label: "Abgeschlossen" },
];

export function ProjectForm({
  mode,
  projectId,
  clientId,
  clientName,
  initialData,
}: ProjectFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? ""
  );
  const [status, setStatus] = useState<ProjectStatus>(
    initialData?.status ?? "ACTIVE"
  );
  const [startDate, setStartDate] = useState(
    initialData?.startDate
      ? new Date(initialData.startDate).toISOString().split("T")[0]
      : ""
  );
  const [liveUrl, setLiveUrl] = useState(initialData?.liveUrl ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/projekte", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            clientId,
            name: name.trim(),
            description: description.trim() || undefined,
            startDate: startDate || undefined,
            liveUrl: liveUrl.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Fehler beim Erstellen");
          return;
        }
        router.push(`/admin/projekte/${data.project.id}`);
        router.refresh();
      } else if (mode === "edit" && projectId) {
        const res = await fetch(`/api/admin/projekte/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            status,
            startDate: startDate || null,
            liveUrl: liveUrl.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Fehler beim Speichern");
          return;
        }
        router.push(`/admin/projekte/${projectId}`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      {clientName && mode === "create" && (
        <div className="bg-dark-200 border border-border rounded-xl px-4 py-3">
          <p className="text-xs text-ink-muted">Kunde</p>
          <p className="text-sm font-medium text-surface mt-0.5">{clientName}</p>
        </div>
      )}

      <Input
        label="Projektname"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="z.B. Website Relaunch"
      />

      <Textarea
        label="Beschreibung"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Kurze Beschreibung des Projekts..."
        rows={4}
      />

      <Input
        label="Startdatum"
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />

      <Input
        label="Live-URL"
        type="url"
        value={liveUrl}
        onChange={(e) => setLiveUrl(e.target.value)}
        placeholder="https://example.com"
      />

      {mode === "edit" && (
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as ProjectStatus)}
          options={statusOptions}
        />
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={loading}>
          {mode === "create" ? "Projekt erstellen" : "Änderungen speichern"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={loading}
        >
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
