"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
}

interface DocumentFiltersProps {
  clients: Client[];
  categories: string[];
}

export function DocumentFilters({ clients, categories }: DocumentFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentClientId = searchParams.get("clientId") ?? "";
  const currentCategory = searchParams.get("category") ?? "";

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

  const hasActiveFilters = currentClientId || currentCategory;

  const clearFilters = () => {
    router.push(pathname);
  };

  const selectClass =
    "bg-dark-200 border border-border rounded-xl px-4 py-2 text-sm text-surface focus:outline-none focus:border-accent transition-colors duration-150 appearance-none cursor-pointer";

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {/* Client filter */}
      {clients.length > 0 && (
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
      )}

      {/* Category filter */}
      {categories.length > 0 && (
        <select
          className={selectClass}
          value={currentCategory}
          onChange={(e) => updateFilter("category", e.target.value)}
        >
          <option value="" className="bg-dark-200">
            Alle Kategorien
          </option>
          {categories.map((cat) => (
            <option key={cat} value={cat} className="bg-dark-200">
              {cat}
            </option>
          ))}
        </select>
      )}

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
