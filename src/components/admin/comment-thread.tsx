"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Role } from "@/generated/prisma";

interface Comment {
  id: string;
  content: string;
  createdAt: string | Date;
  author: {
    id: string;
    name: string;
    role: Role;
  };
}

interface CommentThreadProps {
  impulseId: string;
  initialComments: Comment[];
}

function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CommentThread({ impulseId, initialComments }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/impulse/${impulseId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Fehler beim Senden");
        return;
      }

      const data = await res.json();
      setComments((prev) => [...prev, data.comment]);
      setContent("");
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-sm text-ink-muted py-4">
          Noch keine Kommentare. Schreiben Sie die erste Antwort.
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const isAdmin = comment.author.role === "ADMIN";
            return (
              <div
                key={comment.id}
                className={cn(
                  "flex gap-3",
                  isAdmin ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                    isAdmin
                      ? "bg-accent/20 text-accent"
                      : "bg-dark-300 text-ink-muted"
                  )}
                >
                  {comment.author.name.charAt(0).toUpperCase()}
                </div>

                {/* Bubble */}
                <div
                  className={cn(
                    "max-w-[70%]",
                    isAdmin ? "items-end" : "items-start",
                    "flex flex-col gap-1"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-surface">
                      {comment.author.name}
                    </span>
                    {isAdmin && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent uppercase tracking-wider">
                        Admin
                      </span>
                    )}
                    <span className="text-[11px] text-ink-muted">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "px-4 py-3 rounded-xl text-sm text-surface whitespace-pre-wrap",
                      isAdmin
                        ? "bg-accent/10 border border-accent/20"
                        : "bg-dark-200 border border-border"
                    )}
                  >
                    {comment.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="space-y-3 pt-4 border-t border-border">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Antwort schreiben..."
          rows={4}
          className="w-full bg-dark-200 border border-border rounded-xl px-4 py-3 text-sm text-surface placeholder:text-ink-muted focus:outline-none focus:border-accent transition-colors resize-none"
          disabled={loading}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" loading={loading} disabled={!content.trim()}>
            Antwort senden
          </Button>
        </div>
      </form>
    </div>
  );
}
