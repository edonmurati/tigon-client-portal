"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { CredentialType } from "@/generated/prisma";

const credentialTypeOptions = [
  { value: "LOGIN", label: "Login" },
  { value: "API_KEY", label: "API Key" },
  { value: "ENV_VARIABLE", label: "Env Variable" },
  { value: "SSH_KEY", label: "SSH Key" },
  { value: "DATABASE", label: "Datenbank" },
  { value: "OTHER", label: "Sonstige" },
];

interface ExistingCredential {
  id: string;
  label: string;
  type: CredentialType;
  url?: string | null;
  username?: string | null;
  notes?: string | null;
  clientId?: string | null;
  projectId?: string | null;
}

interface CredentialFormProps {
  clientId?: string;
  projectId?: string;
  credential?: ExistingCredential;
  clients: { id: string; name: string }[];
  projects: { id: string; name: string; clientId?: string | null }[];
}

export function CredentialForm({
  clientId: defaultClientId,
  projectId: defaultProjectId,
  credential,
  clients,
  projects,
}: CredentialFormProps) {
  const router = useRouter();
  const isEdit = !!credential;

  const [selectedClientId, setSelectedClientId] = useState(
    credential?.clientId ?? defaultClientId ?? ""
  );
  const [selectedProjectId, setSelectedProjectId] = useState(
    credential?.projectId ?? defaultProjectId ?? ""
  );
  const [type, setType] = useState<string>(credential?.type ?? "LOGIN");
  const [label, setLabel] = useState(credential?.label ?? "");
  const [url, setUrl] = useState(credential?.url ?? "");
  const [username, setUsername] = useState(credential?.username ?? "");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState(credential?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter projects by selected client
  const filteredProjects = selectedClientId
    ? projects.filter((p) => p.clientId === selectedClientId)
    : projects;

  const clientOptions = [
    { value: "", label: "— Kein Kunde —" },
    ...clients.map((c) => ({ value: c.id, label: c.name })),
  ];

  const projectOptions = [
    { value: "", label: "— Kein Projekt —" },
    ...filteredProjects.map((p) => ({ value: p.id, label: p.name })),
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) {
      setError("Label ist erforderlich.");
      return;
    }
    if (!isEdit && !value.trim()) {
      setError("Wert ist erforderlich.");
      return;
    }

    setLoading(true);
    setError(null);

    const body: Record<string, unknown> = {
      label: label.trim(),
      type,
      url: url.trim() || null,
      username: username.trim() || null,
      notes: notes.trim() || null,
      clientId: selectedClientId || null,
      projectId: selectedProjectId || null,
    };

    if (value.trim()) {
      body.value = value;
    }

    try {
      const endpoint = isEdit
        ? `/api/admin/zugangsdaten/${credential!.id}`
        : "/api/admin/zugangsdaten";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Fehler beim Speichern.");
        return;
      }

      router.push("/admin/zugangsdaten");
      router.refresh();
    } catch {
      setError("Netzwerkfehler. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-dark-100 border border-border rounded-xl p-6 max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Client + Project row */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Kunde"
            value={selectedClientId}
            onChange={(e) => {
              setSelectedClientId(e.target.value);
              setSelectedProjectId(""); // reset project when client changes
            }}
            options={clientOptions}
          />
          <Select
            label="Projekt"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            options={projectOptions}
          />
        </div>

        {/* Type + Label row */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Typ"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={credentialTypeOptions}
          />
          <Input
            label="Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="z.B. Hauptzugang, Deploy Key…"
            required
          />
        </div>

        {/* URL */}
        <Input
          label="URL (optional)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          type="url"
        />

        {/* Username */}
        <Input
          label="Benutzername (optional)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="user@beispiel.de"
        />

        {/* Value */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
            Passwort / Wert{isEdit ? " (leer lassen um nicht zu ändern)" : ""}
          </label>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={isEdit ? "Leer lassen um nicht zu ändern" : "Passwort, API Key, Token…"}
            required={!isEdit}
            rows={3}
            className="bg-dark-200 border border-border rounded-xl px-4 py-2.5 text-sm text-surface placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors duration-150 resize-none font-mono"
          />
        </div>

        {/* Notes */}
        <Textarea
          label="Notizen (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Zusätzliche Informationen…"
          rows={3}
        />

        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" loading={loading}>
            {isEdit ? "Änderungen speichern" : "Zugangsdaten anlegen"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/admin/zugangsdaten")}
          >
            Abbrechen
          </Button>
        </div>
      </form>
    </div>
  );
}
