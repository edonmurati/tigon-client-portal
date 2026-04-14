"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
}

interface AdminUser {
  id: string;
  name: string;
}

interface ActivityFiltersProps {
  clients: Client[];
  users: AdminUser[];
}

const kindOptions = [
  { value: "", label: "Alle Typen" },
  { value: "CREATED", label: "Erstellt" },
  { value: "UPDATED", label: "Aktualisiert" },
  { value: "DELETED", label: "Geloescht" },
  { value: "STATUS_CHANGED", label: "Status geaendert" },
  { value: "NOTE", label: "Notiz" },
  { value: "MEETING", label: "Meeting" },
  { value: "CALL", label: "Call" },
  { value: "EMAIL", label: "Email" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "OUTREACH_SENT", label: "Outreach gesendet" },
  { value: "OUTREACH_REPLY", label: "Outreach Antwort" },
  { value: "IMPULSE_ACCEPTED", label: "Impuls akzeptiert" },
  { value: "IMPULSE_RESOLVED", label: "Impuls geloest" },
  { value: "MILESTONE_REACHED", label: "Meilenstein erreicht" },
  { value: "DEPLOYED", label: "Deployed" },
];

const selectClass =
  "bg-dark-200 border border-border rounded-lg px-3 py-2 text-sm text-surface focus:outline-none focus:border-accent transition-colors duration-150 appearance-none cursor-pointer min-w-[160px]";

export function ActivityFilters({ clients, users }: ActivityFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentClientId = searchParams.get("clientId") ?? "";
  const currentKind = searchParams.get("kind") ?? "";
  const currentUserId = searchParams.get("userId") ?? "";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const hasActiveFilters = currentClientId || currentKind || currentUserId;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        className={selectClass}
        value={currentClientId}
        onChange={(e) => updateFilter("clientId", e.target.value)}
      >
        <option value="" className="bg-dark-200">
          Alle Kunden
        </option>
        {clients.map((c) => (
          <option key={c.id} value={c.id} className="bg-dark-200">
            {c.name}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={currentKind}
        onChange={(e) => updateFilter("kind", e.target.value)}
      >
        {kindOptions.map((o) => (
          <option key={o.value} value={o.value} className="bg-dark-200">
            {o.label}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={currentUserId}
        onChange={(e) => updateFilter("userId", e.target.value)}
      >
        <option value="" className="bg-dark-200">
          Alle Benutzer
        </option>
        {users.map((u) => (
          <option key={u.id} value={u.id} className="bg-dark-200">
            {u.name}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          onClick={() => router.push(pathname)}
          className={cn(
            "px-3 py-2 text-sm text-ink-muted hover:text-surface transition-colors duration-150",
            "border border-border/50 rounded-lg hover:border-border"
          )}
        >
          Filter zuruecksetzen
        </button>
      )}
    </div>
  );
}
