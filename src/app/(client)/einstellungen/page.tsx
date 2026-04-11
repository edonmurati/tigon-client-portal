"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function EinstellungenPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("Das neue Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Die neuen Passwörter stimmen nicht überein.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/client/einstellungen/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Fehler beim Ändern des Passworts.");
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Verbindungsfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-surface tracking-tightest">
          Einstellungen
        </h1>
        <p className="text-sm text-ink-muted mt-1">
          Verwalten Sie Ihre Zugangsdaten.
        </p>
      </div>

      <Card>
        <CardBody className="py-6">
          <h2 className="text-sm font-medium text-surface mb-5">
            Passwort ändern
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Aktuelles Passwort"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <Input
              label="Neues Passwort"
              type="password"
              placeholder="Mindestens 8 Zeichen"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
            />

            <Input
              label="Neues Passwort bestätigen"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                <p className="text-sm text-green-400">
                  Passwort erfolgreich geändert.
                </p>
              </div>
            )}

            <div className="pt-1">
              <Button type="submit" loading={loading}>
                Passwort speichern
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
