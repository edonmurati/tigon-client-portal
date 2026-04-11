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

const entityTypeOptions = [
  { value: "", label: "Alle Typen" },
  { value: "Credential", label: "Zugangsdaten" },
  { value: "Document", label: "Dokumente" },
  { value: "Note", label: "Notizen" },
  { value: "ContactPerson", label: "Kontakte" },
  { value: "ServerEntry", label: "Server" },
  { value: "Impulse", label: "Impulse" },
  { value: "Client", label: "Kunden" },
  { value: "Project", label: "Projekte" },
];

const selectClass =
  "bg-dark-200 border border-border rounded-lg px-3 py-2 text-sm text-surface focus:outline-none focus:border-accent transition-colors duration-150 appearance-none cursor-pointer min-w-[160px]";

export function ActivityFilters({ clients, users }: ActivityFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentClientId = searchParams.get("clientId") ?? "";
  const currentEntityType = searchParams.get("entityType") ?? "";
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

  const hasActiveFilters = currentClientId || currentEntityType || currentUserId;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Client filter */}
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

      {/* Entity type filter */}
      <select
        className={selectClass}
        value={currentEntityType}
        onChange={(e) => updateFilter("entityType", e.target.value)}
      >
        {entityTypeOptions.map((o) => (
          <option key={o.value} value={o.value} className="bg-dark-200">
            {o.label}
          </option>
        ))}
      </select>

      {/* User filter */}
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

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={() => router.push(pathname)}
          className={cn(
            "px-3 py-2 text-sm text-ink-muted hover:text-surface transition-colors duration-150",
            "border border-border/50 rounded-lg hover:border-border"
          )}
        >
          Filter zurücksetzen
        </button>
      )}
    </div>
  );
}
