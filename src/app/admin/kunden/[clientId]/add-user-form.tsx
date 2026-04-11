"use client";

import { useState } from "react";
import { UserPlus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AddUserFormProps {
  clientId: string;
}

export function AddUserForm({ clientId }: AddUserFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/kunden/${clientId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Fehler beim Erstellen");
        return;
      }
      setGeneratedPassword(data.generatedPassword);
      setName("");
      setEmail("");
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

  function handleDone() {
    setGeneratedPassword(null);
    setCopied(false);
    setOpen(false);
    // Refresh to show new user in list
    window.location.reload();
  }

  if (generatedPassword) {
    return (
      <div className="space-y-3">
        <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 space-y-2">
          <p className="text-xs font-medium text-accent">Benutzer erstellt</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-dark-300 border border-border rounded-lg px-3 py-2 text-xs font-mono text-surface tracking-widest overflow-auto">
              {generatedPassword}
            </code>
            <button
              onClick={copyPassword}
              className={cn(
                "text-xs px-2.5 py-2 rounded-lg border transition-colors",
                copied
                  ? "border-green-500/40 text-green-400"
                  : "border-border text-ink-muted hover:text-surface"
              )}
            >
              {copied ? "✓" : "Kopieren"}
            </button>
          </div>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={handleDone}>
          Fertig
        </Button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors"
      >
        <UserPlus size={14} />
        Benutzer hinzufügen
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
        required
        className="w-full bg-dark-200 border border-border rounded-lg px-3 py-2 text-sm text-surface placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
        disabled={loading}
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-Mail"
        required
        className="w-full bg-dark-200 border border-border rounded-lg px-3 py-2 text-sm text-surface placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
        disabled={loading}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" loading={loading}>
          Erstellen
        </Button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="text-xs text-ink-muted hover:text-surface transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </form>
  );
}
