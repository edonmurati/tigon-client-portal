"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ServerStatus } from "@/generated/prisma";

interface ServerFormProps {
  server?: {
    id: string;
    name: string;
    provider: string | null;
    url: string | null;
    ip: string | null;
    status: ServerStatus;
    statusNote: string | null;
    clientId: string | null;
    projectId: string | null;
  };
  clients: { id: string; name: string }[];
  projects: { id: string; name: string; clientId: string | null }[];
  clientId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const statusOptions = [
  { value: "ONLINE", label: "Online" },
  { value: "DEGRADED", label: "Eingeschränkt" },
  { value: "OFFLINE", label: "Offline" },
  { value: "MAINTENANCE", label: "Wartung" },
];

export function ServerForm({
  server,
  clients,
  projects,
  clientId: defaultClientId,
  onSuccess,
  onCancel,
}: ServerFormProps) {
  const [name, setName] = useState(server?.name ?? "");
  const [provider, setProvider] = useState(server?.provider ?? "");
  const [url, setUrl] = useState(server?.url ?? "");
  const [ip, setIp] = useState(server?.ip ?? "");
  const [status, setStatus] = useState<ServerStatus>(server?.status ?? "ONLINE");
  const [statusNote, setStatusNote] = useState(server?.statusNote ?? "");
  const [selectedClientId, setSelectedClientId] = useState(
    server?.clientId ?? defaultClientId ?? ""
  );
  const [selectedProjectId, setSelectedProjectId] = useState(server?.projectId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter projects by selected client
  const filteredProjects = selectedClientId
    ? projects.filter((p) => p.clientId === selectedClientId)
    : projects;

  // Reset project when client changes
  useEffect(() => {
    if (selectedProjectId) {
      const projectBelongsToClient = filteredProjects.some(
        (p) => p.id === selectedProjectId
      );
      if (!projectBelongsToClient) {
        setSelectedProjectId("");
      }
    }
  }, [selectedClientId, filteredProjects, selectedProjectId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;

    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      provider: provider.trim() || null,
      url: url.trim() || null,
      ip: ip.trim() || null,
      status,
      statusNote: statusNote.trim() || null,
      clientId: selectedClientId || null,
      projectId: selectedProjectId || null,
    };

    try {
      const res = await fetch(
        server
          ? `/api/admin/infrastruktur/${server.id}`
          : "/api/admin/infrastruktur",
        {
          method: server ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Fehler beim Speichern");
        return;
      }

      onSuccess?.();
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setSaving(false);
    }
  }

  const clientOptions = clients.map((c) => ({ value: c.id, label: c.name }));
  const projectOptions = filteredProjects.map((p) => ({ value: p.id, label: p.name }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="z.B. Production Server"
        required
        disabled={saving}
      />

      <Input
        label="Provider"
        value={provider}
        onChange={(e) => setProvider(e.target.value)}
        placeholder="z.B. Hetzner, Coolify, Vercel"
        disabled={saving}
      />

      <Input
        label="URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://..."
        disabled={saving}
      />

      <Input
        label="IP-Adresse"
        value={ip}
        onChange={(e) => setIp(e.target.value)}
        placeholder="z.B. 192.168.1.1"
        disabled={saving}
      />

      <Select
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value as ServerStatus)}
        options={statusOptions}
        disabled={saving}
      />

      <Input
        label="Status-Notiz"
        value={statusNote}
        onChange={(e) => setStatusNote(e.target.value)}
        placeholder="z.B. Geplante Wartung bis 03:00 Uhr"
        disabled={saving}
      />

      <Select
        label="Kunde"
        value={selectedClientId}
        onChange={(e) => setSelectedClientId(e.target.value)}
        options={clientOptions}
        placeholder="— Kein Kunde —"
        disabled={saving}
      />

      <Select
        label="Projekt"
        value={selectedProjectId}
        onChange={(e) => setSelectedProjectId(e.target.value)}
        options={projectOptions}
        placeholder="— Kein Projekt —"
        disabled={saving || projectOptions.length === 0}
      />

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
            Abbrechen
          </Button>
        )}
        <Button type="submit" size="sm" loading={saving} disabled={!name.trim()}>
          {server ? "Speichern" : "Hinzufügen"}
        </Button>
      </div>
    </form>
  );
}
