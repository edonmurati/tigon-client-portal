"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
}

interface ImpulseFiltersProps {
  clients: Client[];
}

const statusOptions = [
  { value: "", label: "Alle Status" },
  { value: "NEW", label: "Neu" },
  { value: "SEEN", label: "Gesehen" },
  { value: "IN_PROGRESS", label: "In Bearbeitung" },
  { value: "DONE", label: "Erledigt" },
];

const typeOptions = [
  { value: "", label: "Alle Typen" },
  { value: "FEEDBACK", label: "Feedback" },
  { value: "CHANGE_REQUEST", label: "Änderungswunsch" },
  { value: "QUESTION", label: "Frage" },
  { value: "IDEA", label: "Idee" },
];

export function ImpulseFilters({ clients }: ImpulseFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") ?? "";
  const currentType = searchParams.get("type") ?? "";
  const currentClientId = searchParams.get("clientId") ?? "";

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

  const hasActiveFilters = currentStatus || currentType || currentClientId;

  const clearFilters = () => {
    router.push(pathname);
  };

  const selectClass =
    "bg-dark-200 border border-border rounded-lg px-3 py-2 text-sm text-surface focus:outline-none focus:border-accent transition-colors duration-150 appearance-none cursor-pointer min-w-[160px]";

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

      {/* Status filter */}
      <select
        className={selectClass}
        value={currentStatus}
        onChange={(e) => updateFilter("status", e.target.value)}
      >
        {statusOptions.map((o) => (
          <option key={o.value} value={o.value} className="bg-dark-200">
            {o.label}
          </option>
        ))}
      </select>

      {/* Type filter */}
      <select
        className={selectClass}
        value={currentType}
        onChange={(e) => updateFilter("type", e.target.value)}
      >
        {typeOptions.map((o) => (
          <option key={o.value} value={o.value} className="bg-dark-200">
            {o.label}
          </option>
        ))}
      </select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
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
