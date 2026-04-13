"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

function normalize(tag: string): string {
  return tag.trim().toLowerCase().replace(/\s+/g, "-");
}

export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Tag hinzufügen…",
  disabled,
  label,
}: TagInputProps) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const normalizedDraft = normalize(draft);
  const filtered = normalizedDraft
    ? suggestions
        .filter((s) => s.includes(normalizedDraft) && !value.includes(s))
        .slice(0, 8)
    : suggestions.filter((s) => !value.includes(s)).slice(0, 8);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    setHighlight(0);
  }, [draft, open]);

  function addTag(raw: string) {
    const n = normalize(raw);
    if (!n) return;
    if (value.includes(n)) {
      setDraft("");
      return;
    }
    onChange([...value, n]);
    setDraft("");
  }

  function removeTag(t: string) {
    onChange(value.filter((v) => v !== t));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (open && filtered[highlight]) {
        addTag(filtered[highlight]);
      } else {
        addTag(draft);
      }
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === "ArrowDown" && open && filtered.length) {
      e.preventDefault();
      setHighlight((h) => (h + 1) % filtered.length);
    } else if (e.key === "ArrowUp" && open && filtered.length) {
      e.preventDefault();
      setHighlight((h) => (h - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-ink-muted">{label}</label>
      )}
      <div ref={wrapperRef} className="relative">
        <div
          className={cn(
            "flex flex-wrap items-center gap-1.5 min-h-[40px] px-2 py-1.5",
            "bg-dark-100 border border-border rounded-xl",
            "focus-within:border-accent transition-colors",
            disabled && "opacity-50"
          )}
        >
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-dark-300 text-surface"
            >
              #{tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                disabled={disabled}
                aria-label={`Tag ${tag} entfernen`}
                className="text-ink-muted hover:text-red-400 transition-colors"
              >
                <X size={10} />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={value.length === 0 ? placeholder : ""}
            disabled={disabled}
            className="flex-1 min-w-[120px] bg-transparent text-sm text-surface placeholder:text-ink-muted outline-none"
          />
        </div>

        {open && filtered.length > 0 && (
          <div className="absolute z-10 left-0 right-0 mt-1 bg-dark-100 border border-border rounded-xl overflow-hidden shadow-xl max-h-56 overflow-y-auto">
            {filtered.map((s, i) => (
              <button
                type="button"
                key={s}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(s);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-xs transition-colors",
                  i === highlight
                    ? "bg-dark-300 text-accent"
                    : "text-surface hover:bg-dark-200"
                )}
              >
                #{s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
