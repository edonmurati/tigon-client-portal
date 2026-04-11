"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ClientStatus } from "@/generated/prisma";

interface ClientFormProps {
  mode: "create" | "edit";
  clientId?: string;
  initialData?: {
    name?: string;
    slug?: string;
    partnershipScope?: string;
    status?: ClientStatus;
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const statusOptions = [
  { value: "ACTIVE", label: "Aktiv" },
  { value: "PAUSED", label: "Pausiert" },
  { value: "ENDED", label: "Beendet" },
];

export function ClientForm({ mode, clientId, initialData }: ClientFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [partnershipScope, setPartnershipScope] = useState(
    initialData?.partnershipScope ?? ""
  );
  const [status, setStatus] = useState<ClientStatus>(
    initialData?.status ?? "ACTIVE"
  );

  // First user fields (create only)
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleNameChange(val: string) {
    setName(val);
    if (!slugTouched) {
      setSlug(slugify(val));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "create") {
        const res = await fetch("/api/admin/kunden", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim(),
            partnershipScope: partnershipScope.trim() || undefined,
            user: { name: userName.trim(), email: userEmail.trim() },
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Fehler beim Erstellen");
          return;
        }
        setGeneratedPassword(data.generatedPassword);
        setCreatedClientId(data.client.id);
      } else if (mode === "edit" && clientId) {
        const res = await fetch(`/api/admin/kunden/${clientId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            name: name.trim(),
            slug: slug.trim(),
            partnershipScope: partnershipScope.trim() || null,
            status,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Fehler beim Speichern");
          return;
        }
        router.push(`/admin/kunden/${clientId}`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  function copyPassword() {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  // After creation: show password reveal
  if (generatedPassword && createdClientId) {
    return (
      <div className="max-w-xl space-y-6">
        <div className="bg-accent/10 border border-accent/30 rounded-xl p-6 space-y-3">
          <p className="text-sm font-medium text-accent">
            Kunde erfolgreich erstellt
          </p>
          <p className="text-sm text-ink-muted">
            Das generierte Passwort für den ersten Benutzer. Es wird nur einmal angezeigt.
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-dark-300 border border-border rounded-lg px-4 py-2.5 text-sm font-mono text-surface tracking-widest">
              {generatedPassword}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={copyPassword}
              className={cn(copied && "border-green-500/40 text-green-400")}
            >
              {copied ? "Kopiert!" : "Kopieren"}
            </Button>
          </div>
          <p className="text-xs text-ink-muted">
            Senden Sie dieses Passwort sicher an den Kunden.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => router.push(`/admin/kunden/${createdClientId}`)}
        >
          Zum Kundenprofil →
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      {/* Client info */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-ink-muted uppercase tracking-wider">
          Kundendaten
        </h2>

        <Input
          label="Firmenname"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
          placeholder="z.B. Musterhaus GmbH"
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
            Slug
          </label>
          <div className="flex items-center gap-2">
            <input
              className="flex-1 bg-dark-200 border border-border rounded-xl px-4 py-2.5 text-sm text-surface placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              required
              placeholder="musterhaus-gmbh"
              pattern="[a-z0-9-]+"
              title="Nur Kleinbuchstaben, Zahlen und Bindestriche"
            />
          </div>
          <p className="text-[11px] text-ink-muted">
            Wird für URLs verwendet. Nur a–z, 0–9, Bindestriche.
          </p>
        </div>

        <Textarea
          label="Partnership Scope"
          value={partnershipScope}
          onChange={(e) => setPartnershipScope(e.target.value)}
          placeholder="Beschreibung der Zusammenarbeit und des Leistungsumfangs..."
          rows={4}
        />

        {mode === "edit" && (
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ClientStatus)}
            options={statusOptions}
          />
        )}
      </div>

      {/* First user (create only) */}
      {mode === "create" && (
        <div className="space-y-4 pt-4 border-t border-border">
          <h2 className="text-sm font-medium text-ink-muted uppercase tracking-wider">
            Erster Benutzer
          </h2>
          <Input
            label="Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
            placeholder="Max Mustermann"
          />
          <Input
            label="E-Mail"
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            required
            placeholder="max@musterhaus.de"
          />
          <p className="text-xs text-ink-muted">
            Das Passwort wird automatisch generiert und nach dem Erstellen angezeigt.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={loading}>
          {mode === "create" ? "Kunde erstellen" : "Änderungen speichern"}
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
