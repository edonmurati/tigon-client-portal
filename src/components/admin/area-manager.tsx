"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Area {
  id: string;
  name: string;
  sortOrder: number;
}

interface AreaManagerProps {
  projectId: string;
  initialAreas: Area[];
}

export function AreaManager({ projectId, initialAreas }: AreaManagerProps) {
  const [areas, setAreas] = useState<Area[]>(initialAreas);
  const [newAreaName, setNewAreaName] = useState("");
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newAreaName.trim() || adding) return;

    setAdding(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/projekte/${projectId}/areas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newAreaName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Fehler beim Hinzufügen");
        return;
      }
      setAreas((prev) => [...prev, data.area]);
      setNewAreaName("");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(areaId: string) {
    if (deletingId) return;
    setDeletingId(areaId);
    try {
      const res = await fetch(
        `/api/admin/projekte/${projectId}/areas?areaId=${areaId}`,
        { method: "DELETE", credentials: "include" }
      );
      if (res.ok) {
        setAreas((prev) => prev.filter((a) => a.id !== areaId));
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {/* Existing areas as chips */}
      {areas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {areas.map((area) => (
            <div
              key={area.id}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-200 border border-border rounded-full text-sm text-surface"
            >
              <span>{area.name}</span>
              <button
                onClick={() => handleDelete(area.id)}
                disabled={deletingId === area.id}
                className="text-ink-muted hover:text-red-400 transition-colors disabled:opacity-50 ml-1"
                aria-label={`${area.name} entfernen`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new area */}
      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <input
          value={newAreaName}
          onChange={(e) => setNewAreaName(e.target.value)}
          placeholder="Neuer Bereich..."
          className="flex-1 bg-dark-200 border border-border rounded-lg px-3 py-2 text-sm text-surface placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
          disabled={adding}
        />
        <Button type="submit" size="sm" loading={adding} disabled={!newAreaName.trim()}>
          <Plus size={14} />
          Hinzufügen
        </Button>
      </form>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
