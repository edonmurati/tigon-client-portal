"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { EntryCategory } from "@/generated/prisma";

interface ExistingEntry {
  id: string;
  category: EntryCategory;
  title: string;
  content: string;
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!note;

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
        ? { category, title: title.trim(), content: content.trim() }
        : {
            category,
            title: title.trim(),
            content: content.trim(),
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
      <Textarea
        label="Inhalt"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Inhalt... (Markdown wird unterstützt)"
        rows={4}
        required
        disabled={submitting}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex items-center justify-end gap-2">
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
    </form>
  );
}
