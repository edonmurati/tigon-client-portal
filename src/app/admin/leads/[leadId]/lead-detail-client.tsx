"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LeadStatus, LeadSource } from "@/generated/prisma";

const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Neu",
  CONTACTED: "Kontaktiert",
  QUALIFIED: "Qualifiziert",
  WON: "Gewonnen",
  LOST: "Verloren",
  SPAM: "Spam",
};

const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: "bg-accent/20 text-accent",
  CONTACTED: "bg-blue-500/20 text-blue-400",
  QUALIFIED: "bg-purple-500/20 text-purple-400",
  WON: "bg-green-500/20 text-green-400",
  LOST: "bg-red-500/20 text-red-400",
  SPAM: "bg-zinc-500/20 text-zinc-400",
};

const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  WEBSITE_KONTAKT: "Website Kontaktformular",
  COLD_OUTREACH: "Cold Outreach",
  REFERRAL: "Empfehlung",
  OTHER: "Sonstige",
};

const ALL_STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "WON",
  "LOST",
  "SPAM",
];

type SerializedLead = {
  id: string;
  status: LeadStatus;
  source: LeadSource;
  name: string;
  email: string;
  telefon: string | null;
  unternehmen: string;
  servicebedarf: string | null;
  branche: string | null;
  groesse: string | null;
  website: string | null;
  aktuelleSoftware: string | null;
  projekttypen: string[];
  problem: string | null;
  nutzer: string | null;
  integrationen: string | null;
  anforderungen: string | null;
  budget: string | null;
  zeitrahmen: string | null;
  quelle: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  rawPayload: string | null;
  notes: string | null;
  convertedClientId: string | null;
  createdAt: string;
  updatedAt: string;
  createdAtFormatted: string;
  updatedAtFormatted: string;
};

export function LeadDetailClient({ lead: initialLead }: { lead: SerializedLead }) {
  const router = useRouter();
  const [lead, setLead] = useState(initialLead);
  const [notes, setNotes] = useState(initialLead.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function updateLead(patch: { status?: LeadStatus; notes?: string }) {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error ?? "Fehler beim Speichern");
        return;
      }
      const data = await res.json();
      setLead((prev) => ({
        ...prev,
        status: data.lead.status,
        notes: data.lead.notes ?? null,
      }));
      if (patch.notes !== undefined) {
        setNotes(data.lead.notes ?? "");
      }
    } catch {
      setSaveError("Netzwerkfehler");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(status: LeadStatus) {
    await updateLead({ status });
  }

  async function handleSaveNotes() {
    await updateLead({ notes });
  }

  async function handleDelete() {
    if (!confirm(`Lead von "${lead.name}" wirklich löschen?`)) return;
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        router.push("/admin/leads");
        router.refresh();
      }
    } catch {
      // ignore
    }
  }

  const sectionHeadClass =
    "text-[10px] font-medium text-ink-muted uppercase tracking-widest mb-3";
  const labelClass = "text-[10px] font-medium text-ink-muted uppercase tracking-wider mb-1";
  const valueClass = "text-sm text-surface";

  function Field({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null;
    return (
      <div>
        <p className={labelClass}>{label}</p>
        <p className={valueClass}>{value}</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-surface tracking-tightest leading-tight">
            {lead.name}
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            {lead.unternehmen} &bull; {lead.email}
          </p>
          <p className="text-ink-muted text-xs mt-0.5">
            Eingegangen: {lead.createdAtFormatted} &bull; Quelle:{" "}
            {LEAD_SOURCE_LABELS[lead.source]}
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="text-xs text-red-400 hover:text-red-300 transition-colors shrink-0 mt-1"
        >
          Löschen
        </button>
      </div>

      {/* Status selector */}
      <div className="bg-dark-100 border border-border rounded-xl p-5 mb-5">
        <p className={sectionHeadClass}>Status</p>
        <div className="flex flex-wrap gap-2">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={saving}
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border ${
                lead.status === s
                  ? `${LEAD_STATUS_COLORS[s]} border-current`
                  : "bg-transparent text-ink-muted border-border hover:border-ink-muted hover:text-surface"
              } disabled:opacity-50`}
            >
              {LEAD_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        {saveError && <p className="text-red-400 text-xs mt-3">{saveError}</p>}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Kontaktdaten */}
        <div className="bg-dark-100 border border-border rounded-xl p-5 space-y-4">
          <p className={sectionHeadClass}>Kontaktdaten</p>
          <Field label="Name" value={lead.name} />
          <Field label="E-Mail" value={lead.email} />
          <Field label="Telefon" value={lead.telefon} />
          <Field label="Unternehmen" value={lead.unternehmen} />
          <Field label="Branche" value={lead.branche} />
          <Field label="Unternehmensgröße" value={lead.groesse} />
          <Field label="Website" value={lead.website} />
        </div>

        {/* Projektinfos */}
        <div className="bg-dark-100 border border-border rounded-xl p-5 space-y-4">
          <p className={sectionHeadClass}>Projektinfos</p>
          <Field label="Servicebedarf" value={lead.servicebedarf} />
          {lead.projekttypen.length > 0 && (
            <div>
              <p className={labelClass}>Projekttypen</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {lead.projekttypen.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-dark-300 text-ink-muted border border-border"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
          <Field label="Aktuelle Software" value={lead.aktuelleSoftware} />
          <Field label="Nutzer" value={lead.nutzer} />
          <Field label="Integrationen" value={lead.integrationen} />
          <Field label="Budget" value={lead.budget} />
          <Field label="Zeitrahmen" value={lead.zeitrahmen} />
          <Field label="Quelle (Wie gefunden)" value={lead.quelle} />
        </div>
      </div>

      {/* Problem/Anforderungen */}
      {(lead.problem || lead.anforderungen) && (
        <div className="mt-5 bg-dark-100 border border-border rounded-xl p-5 space-y-4">
          <p className={sectionHeadClass}>Vorhaben & Anforderungen</p>
          {lead.problem && (
            <div>
              <p className={labelClass}>Beschreibung</p>
              <p className="text-sm text-surface leading-relaxed whitespace-pre-wrap">
                {lead.problem}
              </p>
            </div>
          )}
          {lead.anforderungen && (
            <div>
              <p className={labelClass}>Besondere Anforderungen / Ziel</p>
              <p className="text-sm text-surface leading-relaxed whitespace-pre-wrap">
                {lead.anforderungen}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="mt-5 bg-dark-100 border border-border rounded-xl p-5">
        <p className={sectionHeadClass}>Interne Notizen</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          className="w-full bg-dark-200 border border-border rounded-lg text-surface text-sm py-3 px-4 focus:outline-none focus:border-accent transition-colors resize-none placeholder:text-ink-muted"
          placeholder="Notizen zum Lead, Gesprächsverläufe, nächste Schritte..."
        />
        <div className="flex items-center justify-between mt-3">
          {saveError && <p className="text-red-400 text-xs">{saveError}</p>}
          <div className="ml-auto">
            <button
              onClick={handleSaveNotes}
              disabled={saving || notes === (lead.notes ?? "")}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-ink font-medium text-sm px-4 py-2 rounded-xl transition-colors duration-150"
            >
              {saving ? "Speichern..." : "Notizen speichern"}
            </button>
          </div>
        </div>
      </div>

      {/* Als Kunde anlegen placeholder */}
      <div className="mt-5 bg-dark-100 border border-border rounded-xl p-5">
        <p className={sectionHeadClass}>Als Kunde anlegen</p>
        <p className="text-sm text-ink-muted mb-3">
          Diesen Lead direkt als Kunden im Portal registrieren.
        </p>
        <button
          disabled
          className="inline-flex items-center gap-2 bg-dark-300 border border-border text-ink-muted font-medium text-sm px-4 py-2.5 rounded-xl cursor-not-allowed opacity-60"
        >
          Kunde anlegen (kommt bald)
        </button>
        {lead.convertedClientId && (
          <p className="text-xs text-green-400 mt-2">
            Bereits konvertiert → Client ID: {lead.convertedClientId}
          </p>
        )}
      </div>

      {/* Meta / Debug */}
      <details className="mt-5">
        <summary className="text-xs text-ink-muted cursor-pointer hover:text-surface transition-colors">
          Technische Metadaten
        </summary>
        <div className="mt-3 bg-dark-100 border border-border rounded-xl p-5 space-y-2">
          <Field label="IP-Adresse" value={lead.ipAddress} />
          {lead.userAgent && (
            <div>
              <p className={labelClass}>User Agent</p>
              <p className="text-xs text-ink-muted break-all">{lead.userAgent}</p>
            </div>
          )}
          {lead.rawPayload && (
            <div>
              <p className={labelClass}>Raw Payload (Extra-Felder)</p>
              <pre className="text-xs text-ink-muted bg-dark-200 rounded p-3 overflow-x-auto">
                {JSON.stringify(JSON.parse(lead.rawPayload), null, 2)}
              </pre>
            </div>
          )}
          <Field label="Lead-ID" value={lead.id} />
          <Field label="Erstellt" value={lead.createdAtFormatted} />
          <Field label="Zuletzt aktualisiert" value={lead.updatedAtFormatted} />
        </div>
      </details>
    </>
  );
}
