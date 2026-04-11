"use client";

import { useState, useRef, useCallback } from "react";
import { Monitor, RotateCw, ExternalLink } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

interface LivePreviewPanelProps {
  url: string | null;
  projectName: string;
}

export function LivePreviewPanel({ url, projectName }: LivePreviewPanelProps) {
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleRefresh = useCallback(() => {
    setLoadError(false);
    setReloadKey((k) => k + 1);
  }, []);

  const handleError = useCallback(() => {
    setLoadError(true);
  }, []);

  if (!url) {
    return (
      <div className="h-full flex items-center justify-center bg-dark-100 border border-border rounded-xl">
        <EmptyState
          icon={Monitor}
          title="Keine Live-Vorschau verfügbar"
          description="Für dieses Projekt wurde noch keine Live-URL eingerichtet."
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border border-border rounded-xl overflow-hidden bg-dark-100">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-dark-200 shrink-0">
        <div className="flex-1 min-w-0">
          <span className="text-xs text-ink-muted truncate block">{url}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 min-h-[36px] px-2"
          onClick={handleRefresh}
          title="Seite neu laden"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </Button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1 px-2 py-1.5 text-xs text-ink-muted hover:text-surface transition-colors duration-150 rounded-lg hover:bg-dark-300 border border-transparent hover:border-border"
          title="In neuem Tab öffnen"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">In neuem Tab öffnen</span>
        </a>
      </div>

      {/* iframe / error state */}
      <div className="flex-1 relative">
        {loadError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-dark-100 px-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-dark-300 flex items-center justify-center">
              <Monitor className="w-6 h-6 text-ink-muted" />
            </div>
            <p className="text-sm text-surface font-medium">
              Diese Website erlaubt keine Einbettung.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent hover:text-accent-hover underline underline-offset-2 transition-colors duration-150"
            >
              In neuem Tab öffnen
            </a>
          </div>
        ) : (
          <iframe
            key={reloadKey}
            ref={iframeRef}
            src={url}
            title={`Live-Vorschau: ${projectName}`}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onError={handleError}
          />
        )}
      </div>
    </div>
  );
}
