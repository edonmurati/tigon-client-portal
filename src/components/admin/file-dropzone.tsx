"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface FileDropzoneProps {
  clientId?: string;
  projectId?: string;
  clients: { id: string; name: string }[];
  projects: { id: string; name: string; clientId?: string | null }[];
  onSuccess?: () => void;
}

export function FileDropzone({
  clientId: initialClientId,
  projectId: initialProjectId,
  clients,
  projects,
  onSuccess,
}: FileDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(initialClientId ?? "");
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId ?? "");
  const [category, setCategory] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredProjects = selectedClientId
    ? projects.filter((p) => p.clientId === selectedClientId)
    : projects;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0] ?? null;
    if (picked) setFile(picked);
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("file", file);
    if (selectedClientId) formData.append("clientId", selectedClientId);
    if (selectedProjectId) formData.append("projectId", selectedProjectId);
    if (category.trim()) formData.append("category", category.trim());
    if (displayName.trim()) formData.append("displayName", displayName.trim());

    try {
      const res = await fetch("/api/admin/dokumente", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Upload fehlgeschlagen");
      }

      setSuccess(true);
      setFile(null);
      setCategory("");
      setDisplayName("");
      if (inputRef.current) inputRef.current.value = "";
      onSuccess?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  function formatSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  }

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 w-full min-h-[180px] rounded-xl border-2 border-dashed cursor-pointer transition-colors duration-150",
          dragOver
            ? "border-accent bg-accent/5"
            : file
              ? "border-accent/40 bg-accent/5"
              : "border-border bg-dark-200 hover:border-ink-muted"
        )}
      >
        {file ? (
          <div className="flex flex-col items-center gap-2 px-6 text-center">
            <FileText size={28} className="text-accent" />
            <p className="text-sm font-medium text-surface truncate max-w-xs">{file.name}</p>
            <p className="text-xs text-ink-muted">{formatSize(file.size)}</p>
            <button
              type="button"
              onClick={clearFile}
              className="mt-1 inline-flex items-center gap-1 text-xs text-ink-muted hover:text-red-400 transition-colors"
            >
              <X size={12} />
              Entfernen
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 text-center">
            <Upload size={28} className={dragOver ? "text-accent" : "text-ink-muted"} />
            <p className="text-sm text-surface font-medium">
              Datei hierhin ziehen oder klicken
            </p>
            <p className="text-xs text-ink-muted">Alle Dateitypen bis 50 MB</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Metadata Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Kunde (optional)"
          value={selectedClientId}
          onChange={(e) => {
            setSelectedClientId(e.target.value);
            setSelectedProjectId("");
          }}
          options={clients.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Kein Kunde"
        />
        <Select
          label="Projekt (optional)"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          options={filteredProjects.map((p) => ({ value: p.id, label: p.name }))}
          placeholder="Kein Projekt"
          disabled={filteredProjects.length === 0}
        />
        <Input
          label="Kategorie (optional)"
          placeholder="z.B. Vertrag, Präsentation"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Input
          label="Anzeigename (optional)"
          placeholder="Überschreibt den Dateinamen"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
          Dokument erfolgreich hochgeladen.
        </p>
      )}

      <Button
        onClick={handleUpload}
        disabled={!file || loading}
        loading={loading}
        className="w-full sm:w-auto"
      >
        <Upload size={16} />
        {loading ? "Wird hochgeladen…" : "Hochladen"}
      </Button>
    </div>
  );
}
