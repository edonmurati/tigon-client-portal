"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { TagInput } from "@/components/ui/tag-input";
import { MarkdownView } from "@/components/ui/markdown-view";
import { cn } from "@/lib/utils";
import type { EntryCategory } from "@/generated/prisma";

interface ExistingEntry {
  id: string;
  category: EntryCategory;
  title: string;
  content: string;
  tags?: string[];
  pinned?: boolean;
}

interface NoteEditorProps {
  clientId?: string;
  projectId?: string;
  note?: ExistingEntry;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CATEGORY_OPTIONS = [
  { value: "MEETING_NOTE", label: "Meeting" },
  { value: "DECISION", label: "Entscheidung" },
  { value: "IDEA", label: "Idee" },
  { value: "RESEARCH", label: "Research" },
  { value: "HANDOFF", label: "Handoff" },
  { value: "PLAN", label: "Plan" },
  { value: "SPEC", label: "Spec" },
  { value: "CHANGELOG", label: "Changelog" },
  { value: "PLAYBOOK", label: "Playbook" },
  { value: "SOP", label: "SOP" },
  { value: "INSIGHT", label: "Insight" },
  { value: "JOURNAL", label: "Journal" },
  { value: "OTHER", label: "Sonstige" },
];

type Mode = "write" | "preview";

export function NoteEditor({
  clientId,
  projectId,
  note,
  onSuccess,
  onCancel,
}: NoteEditorProps) {
  const router = useRouter();
  const [category, setCategory] = useState<EntryCategory>(
    note?.category ?? "MEETING_NOTE"
  );
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [tags, setTags] = useState<string[]>(note?.tags ?? []);
  const [pinned, setPinned] = useState<boolean>(note?.pinned ?? false);
  const [mode, setMode] = useState<Mode>("write");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const isEdit = !!note;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/notizen/tags", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.tags) {
          setSuggestions(d.tags.map((t: { tag: string }) => t.tag));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      const url = isEdit
        ? `/api/admin/notizen/${note.id}`
        : "/api/admin/notizen";
      const method = isEdit ? "PATCH" : "POST";
      const body = isEdit
        ? {
            category,
            title: title.trim(),
            content: content.trim(),
            tags,
            pinned,
          }
        : {
            category,
            title: title.trim(),
            content: content.trim(),
            tags,
            pinned,
            ...(clientId ? { clientId } : {}),
            ...(projectId ? { projectId } : {}),
          };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Fehler beim Speichern");
        return;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 bg-dark-200 border border-border rounded-xl p-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="Kategorie"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(e) => setCategory(e.target.value as EntryCategory)}
          disabled={submitting}
        />
        <Input
          label="Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titel..."
          required
          disabled={submitting}
        />
      </div>

      <TagInput
        label="Tags"
        value={tags}
        onChange={setTags}
        suggestions={suggestions}
        disabled={submitting}
      />

      {/* Write / Preview Tabs */}
      <div>
        <div className="flex items-center gap-1 mb-2">
          <button
            type="button"
            onClick={() => setMode("write")}
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg transition-colors",
              mode === "write"
                ? "bg-dark-300 text-accent"
                : "text-ink-muted hover:text-surface"
            )}
          >
            Schreiben
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            disabled={!content.trim()}
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg transition-colors",
              mode === "preview"
                ? "bg-dark-300 text-accent"
                : "text-ink-muted hover:text-surface",
              !content.trim() && "opacity-40 cursor-not-allowed"
            )}
          >
            Vorschau
          </button>
          <span className="ml-auto text-[10px] text-ink-muted">
            Markdown + GFM
          </span>
        </div>

        {mode === "write" ? (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Inhalt... (Markdown wird unterstützt)"
            rows={8}
            required
            disabled={submitting}
          />
        ) : (
          <div className="min-h-[200px] bg-dark-100 border border-border rounded-xl px-4 py-3">
            {content.trim() ? (
              <MarkdownView content={content} />
            ) : (
              <p className="text-xs text-ink-muted italic">Nichts zu zeigen.</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPinned((p) => !p)}
          disabled={submitting}
          className={cn(
            "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors",
            pinned
              ? "bg-accent/15 text-accent border border-accent/30"
              : "text-ink-muted hover:text-surface border border-border"
          )}
        >
          <Pin size={12} className={pinned ? "fill-accent" : ""} />
          {pinned ? "Angepinnt" : "Anpinnen"}
        </button>

        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={submitting}
            >
              Abbrechen
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            loading={submitting}
            disabled={!title.trim() || !content.trim()}
          >
            {isEdit ? "Speichern" : "Eintrag erstellen"}
          </Button>
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}
