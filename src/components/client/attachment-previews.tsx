"use client";

import { useRef } from "react";
import { Upload, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttachmentFile } from "@/hooks/use-attachments";

interface AttachmentPreviewsProps {
  files: AttachmentFile[];
  error: string | null;
  onRemove: (id: string) => void;
  onAddFiles: (files: FileList) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentPreviews({
  files,
  error,
  onRemove,
  onAddFiles,
  onDragOver,
  onDrop,
}: AttachmentPreviewsProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(e.target.files);
      // Reset so same file can be re-added after removal
      e.target.value = "";
    }
  };

  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);

  return (
    <div className="flex flex-col gap-2">
      {files.length === 0 ? (
        <div
          onDragOver={onDragOver}
          onDrop={onDrop}
          className="flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-xl px-4 py-6 bg-dark-200 text-center transition-colors duration-150 hover:border-accent/40"
        >
          <Upload className="w-5 h-5 text-ink-muted" />
          <p className="text-xs text-ink-muted">
            Dateien hier ablegen oder einfügen (Strg+V)
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs text-accent hover:text-accent-hover transition-colors duration-150 underline underline-offset-2 cursor-pointer min-h-[44px] px-3 flex items-center"
          >
            Dateien auswählen
          </button>
        </div>
      ) : (
        <>
          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {files.map((attachment) => (
              <div key={attachment.id} className="relative shrink-0">
                {attachment.previewUrl ? (
                  <img
                    src={attachment.previewUrl}
                    alt={attachment.file.name}
                    className="w-16 h-16 rounded-lg object-cover bg-dark-300"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-dark-200 border border-border flex flex-col items-center justify-center gap-1 px-1">
                    <FileText className="w-5 h-5 text-ink-muted shrink-0" />
                    <span className="text-[10px] text-ink-muted leading-tight truncate w-full text-center">
                      {attachment.file.name.length > 8
                        ? attachment.file.name.slice(0, 6) + "…"
                        : attachment.file.name}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(attachment.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-dark-100 border border-border flex items-center justify-center text-ink-muted hover:text-surface hover:bg-dark-300 transition-colors duration-150 cursor-pointer"
                  title="Entfernen"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* File count + size */}
          <p className="text-xs text-ink-muted">
            {files.length} {files.length === 1 ? "Datei" : "Dateien"} ·{" "}
            {formatBytes(totalSize)}
          </p>

          {/* Add more */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover",
              "transition-colors duration-150 cursor-pointer min-h-[44px] w-fit"
            )}
          >
            <Upload className="w-3.5 h-3.5" />
            Weitere Dateien auswählen
          </button>
        </>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
        tabIndex={-1}
      />
    </div>
  );
}
