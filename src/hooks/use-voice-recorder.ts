"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Browser SpeechRecognition types not in standard lib
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

const CONSENT_KEY = "voice-consent";

export interface UseVoiceRecorderOptions {
  lang?: string;
  onInterimResult?: (text: string) => void;
  onFinalResult?: (text: string) => void;
  onError?: (error: string) => void;
}

export interface UseVoiceRecorderReturn {
  isRecording: boolean;
  isSupported: boolean;
  hasConsent: boolean;
  consentDenied: boolean;
  consentPending: boolean;
  grantConsent: () => void;
  denyConsent: () => void;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

function getConsentState(): { hasConsent: boolean; consentDenied: boolean } {
  if (typeof window === "undefined") {
    return { hasConsent: false, consentDenied: false };
  }
  const stored = localStorage.getItem(CONSENT_KEY);
  return {
    hasConsent: stored === "true",
    consentDenied: stored === "denied",
  };
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return (
    (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor })
      .SpeechRecognition ??
    (
      window as unknown as {
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      }
    ).webkitSpeechRecognition ??
    null
  );
}

function mapErrorToGerman(code: string): string {
  switch (code) {
    case "not-allowed":
      return "Mikrofonzugriff verweigert. Bitte erlauben Sie den Zugriff in den Browser-Einstellungen.";
    case "no-speech":
      return "Keine Sprache erkannt. Bitte sprechen Sie deutlicher.";
    case "network":
      return "Netzwerkfehler bei der Spracherkennung.";
    default:
      return "Fehler bei der Spracherkennung.";
  }
}

export function useVoiceRecorder({
  lang = "de-DE",
  onInterimResult,
  onFinalResult,
  onError,
}: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn {
  const isSupported = getSpeechRecognitionConstructor() !== null;

  const [isRecording, setIsRecording] = useState(false);
  const [hasConsent, setHasConsent] = useState(() => getConsentState().hasConsent);
  const [consentDenied, setConsentDenied] = useState(
    () => getConsentState().consentDenied
  );

  // Ref mirrors isRecording for use inside event handlers (avoids stale closure)
  const isRecordingRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Callbacks as refs so event handlers always see the latest version
  const onInterimResultRef = useRef(onInterimResult);
  const onFinalResultRef = useRef(onFinalResult);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onInterimResultRef.current = onInterimResult;
    onFinalResultRef.current = onFinalResult;
    onErrorRef.current = onError;
  });

  // Build the recognition instance once
  useEffect(() => {
    const Constructor = getSpeechRecognitionConstructor();
    if (!Constructor) return;

    const recognition = new Constructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          onFinalResultRef.current?.(transcript);
        } else {
          onInterimResultRef.current?.(transcript);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const message = mapErrorToGerman(event.error);
      onErrorRef.current?.(message);
      // Stop recording state on unrecoverable errors
      if (event.error === "not-allowed") {
        isRecordingRef.current = false;
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      // Restart if we're still supposed to be recording (handles silence pauses)
      if (isRecordingRef.current) {
        try {
          recognition.start();
        } catch {
          // Already started — ignore
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isRecordingRef.current = false;
      try {
        recognition.abort();
      } catch {
        // Ignore abort errors on cleanup
      }
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognitionRef.current = null;
    };
    // lang intentionally excluded: recreating on lang change would abort active sessions.
    // If lang needs to be dynamic, stop → change → start.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const grantConsent = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, "true");
    setHasConsent(true);
    setConsentDenied(false);
  }, []);

  const denyConsent = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, "denied");
    setHasConsent(false);
    setConsentDenied(true);
  }, []);

  const start = useCallback(() => {
    if (!isSupported || !hasConsent || isRecordingRef.current) return;
    isRecordingRef.current = true;
    setIsRecording(true);
    try {
      recognitionRef.current?.start();
    } catch {
      // start() throws if already running — safe to ignore
    }
  }, [isSupported, hasConsent]);

  const stop = useCallback(() => {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;
    setIsRecording(false);
    try {
      recognitionRef.current?.stop();
    } catch {
      // stop() throws if not running — safe to ignore
    }
  }, []);

  const toggle = useCallback(() => {
    if (isRecordingRef.current) {
      stop();
    } else {
      start();
    }
  }, [start, stop]);

  const consentPending = !hasConsent && !consentDenied;

  return {
    isRecording,
    isSupported,
    hasConsent,
    consentDenied,
    consentPending,
    grantConsent,
    denyConsent,
    start,
    stop,
    toggle,
  };
}
