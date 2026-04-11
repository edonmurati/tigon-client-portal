"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

export interface AttachmentFile {
  id: string;
  file: File;
  previewUrl: string | null;
}

export interface UseAttachmentsOptions {
  maxFiles?: number;
  maxSizeMB?: number;
}

export interface UseAttachmentsReturn {
  files: AttachmentFile[];
  error: string | null;
  addFiles: (fileList: FileList | File[]) => void;
  removeFile: (id: string) => void;
  clear: () => void;
  totalSize: number;
  handlePaste: (e: ClipboardEvent) => void;
  handleDrop: (e: DragEvent) => void;
}

function createAttachmentFile(file: File): AttachmentFile {
  return {
    id: crypto.randomUUID(),
    file,
    previewUrl: file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : null,
  };
}

function revokePreview(attachment: AttachmentFile): void {
  if (attachment.previewUrl) {
    URL.revokeObjectURL(attachment.previewUrl);
  }
}

export function useAttachments({
  maxFiles = 10,
  maxSizeMB = 50,
}: UseAttachmentsOptions = {}): UseAttachmentsReturn {
  const [files, setFiles] = useState<AttachmentFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (error === null) return;

    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    errorTimeoutRef.current = setTimeout(() => {
      setError(null);
    }, 5000);

    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [error]);

  // Revoke all preview URLs on unmount
  useEffect(() => {
    return () => {
      setFiles((current) => {
        current.forEach(revokePreview);
        return [];
      });
    };
  }, []);

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const incoming = Array.from(fileList);

      const maxBytes = maxSizeMB * 1024 * 1024;
      const oversized = incoming.filter((f) => f.size > maxBytes);

      if (oversized.length > 0) {
        setError(`Datei zu gross (max. ${maxSizeMB} MB)`);
      }

      const validFiles = incoming.filter((f) => f.size <= maxBytes);

      setFiles((current) => {
        const remaining = maxFiles - current.length;

        if (remaining <= 0) {
          setError(`Maximal ${maxFiles} Dateien erlaubt`);
          return current;
        }

        if (validFiles.length > remaining) {
          setError(`Maximal ${maxFiles} Dateien erlaubt`);
        }

        const toAdd = validFiles.slice(0, remaining).map(createAttachmentFile);
        return [...current, ...toAdd];
      });
    },
    [maxFiles, maxSizeMB]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((current) => {
      const target = current.find((f) => f.id === id);
      if (target) revokePreview(target);
      return current.filter((f) => f.id !== id);
    });
  }, []);

  const clear = useCallback(() => {
    setFiles((current) => {
      current.forEach(revokePreview);
      return [];
    });
  }, []);

  const totalSize = useMemo(
    () => files.reduce((sum, f) => sum + f.file.size, 0),
    [files]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        addFiles(imageFiles);
      }
    },
    [addFiles]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const droppedFiles = e.dataTransfer?.files;
      if (droppedFiles && droppedFiles.length > 0) {
        addFiles(droppedFiles);
      }
    },
    [addFiles]
  );

  return {
    files,
    error,
    addFiles,
    removeFile,
    clear,
    totalSize,
    handlePaste,
    handleDrop,
  };
}
