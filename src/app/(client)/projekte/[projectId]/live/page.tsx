"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Monitor, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { LivePreviewPanel } from "@/components/client/live-preview-panel";
import { FeedbackSidebar } from "@/components/client/feedback-sidebar";

interface ProjectData {
  id: string;
  name: string;
  liveUrl: string | null;
  areas: Array<{ id: string; name: string }>;
}

type MobileView = "preview" | "feedback";

export default function LiveFeedbackPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileView, setMobileView] = useState<MobileView>("feedback");

  useEffect(() => {
    if (!projectId) return;

    fetch(`/api/client/projekte/${projectId}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then((data: ProjectData) => {
        setProject(data);
      })
      .catch(() => {
        // Leave project as null — shows empty state
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <EmptyState
          icon={Monitor}
          title="Projekt nicht gefunden"
          description="Dieses Projekt existiert nicht oder du hast keinen Zugriff."
          action={{ label: "Zur Übersicht", href: "/projekte" }}
        />
      </div>
    );
  }

  if (!project.liveUrl) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <EmptyState
          icon={Monitor}
          title="Keine Live-Vorschau eingerichtet"
          description="Für dieses Projekt ist keine Live-Vorschau eingerichtet."
          action={{
            label: "Impuls ohne Vorschau erstellen",
            href: `/projekte/${projectId}/impulse/neu`,
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-3.5rem)]">
      {/* Desktop: side by side */}
      <div className="hidden md:flex h-full">
        {/* Preview — 70% */}
        <div className="flex-[7] min-w-0 p-3 pr-1.5">
          <LivePreviewPanel url={project.liveUrl} projectName={project.name} />
        </div>

        {/* Sidebar — 30% */}
        <div className="flex-[3] min-w-0 min-w-[280px] max-w-sm p-3 pl-1.5">
          <div className="h-full rounded-xl overflow-hidden border border-border">
            <FeedbackSidebar
              projectId={projectId}
              projectName={project.name}
              areas={project.areas}
            />
          </div>
        </div>
      </div>

      {/* Mobile: single-panel toggle */}
      <div className="flex md:hidden h-full relative">
        {/* Preview panel */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-200",
            mobileView === "preview"
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          )}
        >
          <div className="h-full p-3 pb-16">
            <LivePreviewPanel url={project.liveUrl} projectName={project.name} />
          </div>
        </div>

        {/* Feedback panel */}
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-200",
            mobileView === "feedback"
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          )}
        >
          <div className="h-full pb-16">
            <FeedbackSidebar
              projectId={projectId}
              projectName={project.name}
              areas={project.areas}
            />
          </div>
        </div>

        {/* Floating toggle pill */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center bg-dark-200 border border-border rounded-full p-1 shadow-lg gap-1">
          <button
            type="button"
            onClick={() => setMobileView("preview")}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-medium transition-colors duration-150 cursor-pointer min-h-[44px]",
              mobileView === "preview"
                ? "bg-dark-300 text-surface"
                : "text-ink-muted hover:text-surface"
            )}
          >
            <Monitor className="w-4 h-4" />
            Vorschau
          </button>
          <button
            type="button"
            onClick={() => setMobileView("feedback")}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-medium transition-colors duration-150 cursor-pointer min-h-[44px]",
              mobileView === "feedback"
                ? "bg-dark-300 text-surface"
                : "text-ink-muted hover:text-surface"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            Feedback
          </button>
        </div>
      </div>
    </div>
  );
}
