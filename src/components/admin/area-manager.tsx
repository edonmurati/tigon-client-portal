"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AreaManagerProps {
  projectId: string;
  initialAreas: string[];
}

export function AreaManager({ projectId, initialAreas }: AreaManagerProps) {
  const [areas, setAreas] = useState<string[]>(initialAreas);
  const [newAreaName, setNewAreaName] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveAreas(next: string[]) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/projekte/${projectId}/areas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ areas: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Fehler beim Speichern");
        return false;
      }
      setAreas(data.areas ?? next);
      return true;
    } finally {
      setPending(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newAreaName.trim();
    if (!name || pending) return;
    if (areas.includes(name)) {
      setError("Bereich existiert bereits");
      return;
    }
    const ok = await saveAreas([...areas, name]);
    if (ok) setNewAreaName("");
  }

  async function handleDelete(name: string) {
    if (pending) return;
    await saveAreas(areas.filter((a) => a !== name));
  }

  return (
    <div className="space-y-3">
      {areas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {areas.map((area) => (
            <div
              key={area}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-200 border border-border rounded-full text-sm text-surface"
            >
              <span>{area}</span>
              <button
                onClick={() => handleDelete(area)}
                disabled={pending}
                className="text-ink-muted hover:text-red-400 transition-colors disabled:opacity-50 ml-1"
                aria-label={`${area} entfernen`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex items-center gap-2">
        <input
          value={newAreaName}
          onChange={(e) => setNewAreaName(e.target.value)}
          placeholder="Neuer Bereich..."
          className="flex-1 bg-dark-200 border border-border rounded-lg px-3 py-2 text-sm text-surface placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors"
          disabled={pending}
        />
        <Button type="submit" size="sm" loading={pending} disabled={!newAreaName.trim()}>
          <Plus size={14} />
          Hinzufügen
        </Button>
      </form>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
