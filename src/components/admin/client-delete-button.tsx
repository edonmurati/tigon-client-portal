"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function ClientDeleteButton({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = window.confirm(
      `"${clientName}" wirklich löschen? Der Kunde wird archiviert (soft-delete) und ist über die DB wiederherstellbar.`
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/kunden/${clientId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Fehler beim Löschen");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-ink-muted hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
      title="Kunde löschen"
    >
      <Trash2 size={14} />
    </button>
  );
}
