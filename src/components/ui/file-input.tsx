"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileInputProps {
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  onChange: (file: File | null) => void;
  value?: File | null;
  className?: string;
}

export function FileInput({ label, accept, maxSizeMB = 50, onChange, value, className }: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > maxSizeMB * 1024 * 1024) {
      alert(`Datei ist zu groß. Maximum: ${maxSizeMB}MB`);
      return;
    }
    onChange(file);
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-ink-muted mb-1.5">{label}</label>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-dashed transition-colors",
          value
            ? "border-accent/40 bg-accent/5"
            : "border-border hover:border-ink-muted bg-dark-200"
        )}
      >
        <Upload size={16} className={value ? "text-accent" : "text-ink-muted"} />
        <span className={cn("text-sm truncate", value ? "text-surface" : "text-ink-muted")}>
          {value ? value.name : "Datei auswählen..."}
        </span>
        {value && (
          <span className="text-xs text-ink-muted ml-auto shrink-0">
            {(value.size / 1024 / 1024).toFixed(1)}MB
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
