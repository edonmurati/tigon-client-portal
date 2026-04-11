"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { NoteType } from "@/generated/prisma";

interface ExistingNote {
  id: string;
  type: NoteType;
  title: string;
  content: string;
}

interface NoteEditorProps {
  clientId?: string;
  projectId?: string;
  note?: ExistingNote;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const NOTE_TYPE_OPTIONS = [
  { value: "MEETING", label: "Meeting" },
  { value: "CALL", label: "Anruf" },
  { value: "EMAIL", label: "E-Mail" },
  { value: "INTERNAL", label: "Intern" },
];

export function NoteEditor({
  clientId,
  projectId,
  note,
  onSuccess,
  onCancel,
}: NoteEditorProps) {
  const router = useRouter();
  const [type, setType] = useState<NoteType>(note?.type ?? "INTERNAL");
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
        ? { type, title: title.trim(), content: content.trim() }
        : {
            type,
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
          label="Typ"
          options={NOTE_TYPE_OPTIONS}
          value={type}
          onChange={(e) => setType(e.target.value as NoteType)}
          disabled={submitting}
        />
        <Input
          label="Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Notiz-Titel..."
          required
          disabled={submitting}
        />
      </div>
      <Textarea
        label="Inhalt"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Notiz-Inhalt... (Markdown wird unterstützt)"
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
          {isEdit ? "Speichern" : "Notiz erstellen"}
        </Button>
      </div>
    </form>
  );
}
