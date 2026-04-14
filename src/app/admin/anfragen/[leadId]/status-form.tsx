"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "NEW", label: "Neu" },
  { value: "QUALIFIED", label: "Qualifiziert" },
  { value: "IN_CONVERSATION", label: "Im Gespräch" },
  { value: "MEETING_BOOKED", label: "Meeting gebucht" },
  { value: "CONVERTED", label: "Konvertiert" },
  { value: "REJECTED", label: "Abgelehnt" },
  { value: "PARKED", label: "Geparkt" },
];

interface StatusFormProps {
  leadId: string;
  currentStatus: string;
}

export function StatusForm({ leadId, currentStatus }: StatusFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(newStatus: string) {
    if (newStatus === status) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/anfragen/${leadId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Fehler beim Speichern");
        return;
      }
      setStatus(newStatus);
      router.refresh();
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <label className="block text-[10px] font-medium text-ink-muted uppercase tracking-widest mb-2">
        Status
      </label>
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value)}
        disabled={saving}
        className="w-full bg-dark-200 border border-border rounded-lg px-3 py-2 text-sm text-surface focus:outline-none focus:border-accent disabled:opacity-50 transition-colors"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      {saving && <p className="text-xs text-ink-muted mt-1">Speichern…</p>}
    </div>
  );
}
