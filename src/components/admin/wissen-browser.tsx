"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Plus, Pin, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { EntryCategoryBadge } from "@/components/ui/badge";
import { NoteEditor } from "@/components/admin/note-editor";
import { entryCategoryLabels } from "@/lib/constants";
import { timeAgo } from "@/lib/time";
import type { EntryCategory } from "@/generated/prisma";

type Entry = {
  id: string;
  title: string;
  content: string;
  category: EntryCategory;
  pinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string } | null;
  client: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
};

interface Props {
  entries: Entry[];
  clients: { id: string; name: string }[];
  initialCategory?: EntryCategory;
  initialClientId?: string;
  initialQuery: string;
}

export function WissenBrowser({
  entries,
  clients,
  initialCategory,
  initialClientId,
  initialQuery,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [isPending, startTransition] = useTransition();

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParam("q", query || null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Eintrag wirklich löschen?")) return;
    const res = await fetch(`/api/admin/notizen/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl text-surface tracking-tightest">
            Wissen
          </h1>
          <p className="text-ink-muted text-sm mt-1">
            {entries.length} {entries.length === 1 ? "Eintrag" : "Einträge"}
          </p>
        </div>
        <Button onClick={() => setShowNew((v) => !v)}>
          <Plus size={16} />
          {showNew ? "Abbrechen" : "Neuer Eintrag"}
        </Button>
      </div>

      {showNew && (
        <div className="mb-6">
          <NoteEditor
            onSuccess={() => {
              setShowNew(false);
              router.refresh();
            }}
            onCancel={() => setShowNew(false)}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <form onSubmit={onSearchSubmit} className="flex-1 min-w-[200px] relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen…"
            className="pl-9"
          />
        </form>
        <select
          value={initialClientId ?? ""}
          onChange={(e) => updateParam("clientId", e.target.value || null)}
          className="bg-dark-100 border border-border rounded-xl px-3 py-2 text-sm text-surface focus:border-accent outline-none"
        >
          <option value="">Alle Kunden</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={initialCategory ?? ""}
          onChange={(e) => updateParam("category", e.target.value || null)}
          className="bg-dark-100 border border-border rounded-xl px-3 py-2 text-sm text-surface focus:border-accent outline-none"
        >
          <option value="">Alle Kategorien</option>
          {Object.entries(entryCategoryLabels).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {/* Entries */}
      {entries.length === 0 ? (
        <div className="bg-dark-100 border border-border rounded-xl">
          <EmptyState
            icon={BookOpen}
            title="Keine Einträge gefunden"
            description={
              initialQuery || initialCategory || initialClientId
                ? "Andere Filter versuchen oder einen neuen Eintrag anlegen."
                : "Lege den ersten Wissenseintrag an."
            }
          />
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-dark-100 border border-border rounded-xl overflow-hidden"
            >
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-dark-200 transition-colors"
                onClick={() =>
                  setExpandedId((p) => (p === entry.id ? null : entry.id))
                }
              >
                {entry.pinned && <Pin size={12} className="text-accent shrink-0" />}
                <EntryCategoryBadge category={entry.category} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface truncate">
                    {entry.title}
                  </p>
                  <p className="text-xs text-ink-muted truncate">
                    {entry.author?.name ?? "—"}
                    {entry.client && <> · <Link href={`/admin/kunden/${entry.client.id}`} className="hover:text-accent">{entry.client.name}</Link></>}
                    {entry.project && <> · {entry.project.name}</>}
                    {" · "}{timeAgo(entry.updatedAt)}
                  </p>
                </div>
              </div>

              {expandedId === entry.id && (
                <div className="px-4 pb-4 border-t border-border">
                  <p className="text-sm text-surface whitespace-pre-wrap pt-3 leading-relaxed">
                    {entry.content}
                  </p>
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {entry.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-dark-300 text-ink-muted"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() =>
                        setEditingId((p) => (p === entry.id ? null : entry.id))
                      }
                      className="text-xs text-ink-muted hover:text-accent transition-colors"
                    >
                      Bearbeiten
                    </button>
                    <span className="text-ink-muted">·</span>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-xs text-ink-muted hover:text-red-400 transition-colors"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              )}

              {editingId === entry.id && (
                <div className="px-4 pb-4 border-t border-border pt-4">
                  <NoteEditor
                    note={entry}
                    onSuccess={() => {
                      setEditingId(null);
                      router.refresh();
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isPending && (
        <div className="fixed top-4 right-4 text-xs text-ink-muted bg-dark-100 border border-border rounded-lg px-3 py-1.5">
          Lade…
        </div>
      )}
    </div>
  );
}
