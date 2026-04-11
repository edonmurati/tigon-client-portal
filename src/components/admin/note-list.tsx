"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoteTypeBadge } from "@/components/ui/badge";
import { NoteEditor } from "@/components/admin/note-editor";
import { timeAgo } from "@/lib/time";
import type { NoteType } from "@/generated/prisma";

interface NoteItem {
  id: string;
  type: NoteType;
  title: string;
  content: string;
  author: { name: string };
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface NoteListProps {
  notes: NoteItem[];
  clientId?: string;
  projectId?: string;
}

export function NoteList({ notes: initialNotes, clientId, projectId }: NoteListProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  async function handleDelete(noteId: string) {
    if (deletingId) return;
    if (!confirm("Notiz wirklich löschen?")) return;

    setDeletingId(noteId);
    try {
      const res = await fetch(`/api/admin/notizen/${noteId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        if (expandedId === noteId) setExpandedId(null);
      }
    } finally {
      setDeletingId(null);
    }
  }

  function handleEditSuccess() {
    setEditingId(null);
    router.refresh();
  }

  function handleNewSuccess() {
    setShowNewForm(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">
          {notes.length} {notes.length === 1 ? "Notiz" : "Notizen"}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowNewForm((v) => !v)}
        >
          <Plus size={14} />
          Neue Notiz
        </Button>
      </div>

      {/* New note form */}
      {showNewForm && (
        <NoteEditor
          clientId={clientId}
          projectId={projectId}
          onSuccess={handleNewSuccess}
          onCancel={() => setShowNewForm(false)}
        />
      )}

      {/* Notes list */}
      {notes.length === 0 && !showNewForm && (
        <p className="text-sm text-ink-muted py-4 text-center">Noch keine Notizen</p>
      )}

      {notes.map((note) => (
        <div
          key={note.id}
          className="bg-dark-200 border border-border rounded-xl overflow-hidden"
        >
          {/* Note header */}
          <div
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-dark-300/50 transition-colors"
            onClick={() =>
              setExpandedId((prev) => (prev === note.id ? null : note.id))
            }
          >
            <NoteTypeBadge type={note.type} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface truncate">{note.title}</p>
              <p className="text-xs text-ink-muted">
                {note.author.name} · {timeAgo(note.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingId((prev) => (prev === note.id ? null : note.id));
                  setExpandedId(null);
                }}
                className="p-1.5 text-ink-muted hover:text-surface transition-colors rounded-lg hover:bg-dark-300"
                title="Bearbeiten"
              >
                <Edit size={13} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(note.id);
                }}
                disabled={deletingId === note.id}
                className="p-1.5 text-ink-muted hover:text-red-400 transition-colors rounded-lg hover:bg-dark-300 disabled:opacity-50"
                title="Löschen"
              >
                <Trash2 size={13} />
              </button>
              {expandedId === note.id ? (
                <ChevronUp size={14} className="text-ink-muted" />
              ) : (
                <ChevronDown size={14} className="text-ink-muted" />
              )}
            </div>
          </div>

          {/* Expanded content */}
          {expandedId === note.id && (
            <div className="px-4 pb-4 border-t border-border">
              <p className="text-sm text-surface whitespace-pre-wrap pt-3 leading-relaxed">
                {note.content}
              </p>
            </div>
          )}

          {/* Inline edit form */}
          {editingId === note.id && (
            <div className="px-4 pb-4 border-t border-border pt-4">
              <NoteEditor
                note={note}
                onSuccess={handleEditSuccess}
                onCancel={() => setEditingId(null)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
