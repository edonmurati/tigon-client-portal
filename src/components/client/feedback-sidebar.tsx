"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mic, MicOff, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImpulseType } from "@/generated/prisma";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { useAttachments } from "@/hooks/use-attachments";

import { VoiceConsentDialog } from "./voice-consent-dialog";
import { ImpulseTypeToggle } from "./impulse-type-toggle";
import { AttachmentPreviews } from "./attachment-previews";

interface FeedbackSidebarProps {
  projectId: string;
  projectName: string;
  areas: Array<{ id: string; name: string }>;
}

export function FeedbackSidebar({
  projectId,
  projectName,
  areas,
}: FeedbackSidebarProps) {
  const router = useRouter();

  // Form state
  const [type, setType] = useState<ImpulseType>("FEEDBACK");
  const [areaId, setAreaId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showConsentDialog, setShowConsentDialog] = useState(false);

  // Keep stable references to title/content for callbacks
  const titleRef = useRef(title);
  const contentRef = useRef(content);
  titleRef.current = title;
  contentRef.current = content;

  // Voice recorder
  const voice = useVoiceRecorder({
    lang: "de-DE",
    onFinalResult: useCallback((text: string) => {
      setInterimText("");
      setContent((prev) => {
        const updated = prev ? prev + " " + text : text;
        return updated;
      });
      setTitle((prev) => {
        if (prev) return prev;
        return text.trim().slice(0, 50);
      });
    }, []),
    onInterimResult: useCallback((text: string) => {
      setInterimText(text);
    }, []),
    onError: useCallback((error: string) => {
      setVoiceError(error);
      setTimeout(() => setVoiceError(null), 5000);
    }, []),
  });

  // Attachments
  const attachments = useAttachments({ maxFiles: 10, maxSizeMB: 50 });

  // Sidebar container ref for paste events
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;
    const handler = (e: ClipboardEvent) => attachments.handlePaste(e);
    el.addEventListener("paste", handler);
    return () => el.removeEventListener("paste", handler);
  }, [attachments.handlePaste]);

  // Drag-over handler for React (bridges to native signature)
  const handleReactDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
    },
    []
  );

  // Drop handler for React (bridges to native signature)
  const handleReactDrop = useCallback(
    (e: React.DragEvent) => {
      attachments.handleDrop(e.nativeEvent);
    },
    [attachments.handleDrop]
  );

  // Mic button click
  const handleMicClick = () => {
    if (voice.consentDenied) return;

    if (voice.hasConsent) {
      voice.toggle();
    } else {
      // consent is pending — show the dialog
      setShowConsentDialog(true);
    }
  };

  const handleConsentAccept = () => {
    setShowConsentDialog(false);
    voice.grantConsent();
    // start() will be called after re-render since hasConsent will now be true
    // Use a small timeout to ensure state propagated
    setTimeout(() => voice.start(), 50);
  };

  const handleConsentDecline = () => {
    setShowConsentDialog(false);
    voice.denyConsent();
  };

  const showMicButton =
    voice.isSupported && !voice.consentDenied;

  // Submit
  const handleSubmit = async () => {
    if (!title.trim() && !content.trim()) {
      setSubmitError("Bitte gib mindestens einen Titel oder eine Beschreibung ein.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("title", title.trim());
      formData.append("content", content.trim());
      if (areaId) formData.append("projectAreaId", areaId);
      attachments.files.forEach((f) => formData.append("files", f.file));

      const res = await fetch(`/api/client/projekte/${projectId}/impulse`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Fehler ${res.status}`);
      }

      const data = await res.json();
      setSubmitSuccess(true);

      setTimeout(() => {
        router.push(`/projekte/${projectId}/impulse/${data.impulse.id}`);
      }, 1000);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Unbekannter Fehler beim Senden."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const areaOptions = areas.map((a) => ({ value: a.id, label: a.name }));

  return (
    <>
      <VoiceConsentDialog
        open={showConsentDialog}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />

      <div
        ref={sidebarRef}
        className="h-full flex flex-col bg-dark-100 border-l border-border overflow-y-auto"
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border shrink-0">
          <a
            href={`/projekte/${projectId}`}
            className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-surface transition-colors duration-150 mb-3 min-h-[44px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Zurück zum Projekt
          </a>
          <h1 className="text-base font-semibold text-surface font-serif tracking-tightest">
            Feedback geben
          </h1>
          <p className="text-xs text-ink-muted mt-0.5 truncate">{projectName}</p>
        </div>

        {/* Form body */}
        <div className="flex-1 px-5 py-5 flex flex-col gap-5">
          {/* Type toggle */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">
              Art
            </span>
            <ImpulseTypeToggle value={type} onChange={setType} />
          </div>

          {/* Area selector */}
          {areas.length > 0 && (
            <Select
              label="Bereich"
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              options={areaOptions}
              placeholder="Keinen Bereich auswählen"
            />
          )}

          {/* Title */}
          <Input
            label="Titel"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Kurze Zusammenfassung…"
            className="min-h-[44px]"
          />

          {/* Content + mic */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-ink-muted uppercase tracking-wider">
                Beschreibung
              </label>
              {showMicButton && (
                <button
                  type="button"
                  onClick={handleMicClick}
                  title={voice.isRecording ? "Aufnahme stoppen" : "Spracheingabe starten"}
                  className={cn(
                    "inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150 cursor-pointer border",
                    voice.isRecording
                      ? "bg-accent border-accent animate-pulse text-ink"
                      : "bg-dark-300 border-border text-ink-muted hover:text-surface"
                  )}
                >
                  {voice.isRecording ? (
                    <MicOff className="w-3.5 h-3.5" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Beschreibe dein Feedback so detailliert wie möglich…"
              rows={5}
              className="min-h-[120px]"
            />
            {interimText && (
              <p className="text-xs text-ink-muted italic px-1">
                {interimText}
              </p>
            )}
            {voiceError && (
              <p className="text-xs text-red-400">{voiceError}</p>
            )}
          </div>

          {/* Attachments */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-ink-muted uppercase tracking-wider">
              Anhänge
            </span>
            <AttachmentPreviews
              files={attachments.files}
              error={attachments.error}
              onRemove={attachments.removeFile}
              onAddFiles={attachments.addFiles}
              onDragOver={handleReactDragOver}
              onDrop={handleReactDrop}
            />
          </div>

          {/* Errors / success */}
          {submitError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {submitError}
            </p>
          )}
          {submitSuccess && (
            <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
              Impuls gesendet. Du wirst weitergeleitet…
            </p>
          )}

          {/* Submit */}
          <Button
            variant="primary"
            size="lg"
            loading={isSubmitting}
            disabled={isSubmitting || submitSuccess}
            className="w-full min-h-[44px]"
            onClick={handleSubmit}
          >
            <Send className="w-4 h-4" />
            Impuls senden
          </Button>
        </div>
      </div>
    </>
  );
}
