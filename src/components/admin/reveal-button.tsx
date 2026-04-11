"use client";

import { useState, useEffect, useCallback } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface RevealButtonProps {
  credentialId: string;
}

const REVEAL_DURATION = 30; // seconds

export function RevealButton({ credentialId }: RevealButtonProps) {
  const [state, setState] = useState<"hidden" | "loading" | "revealed">("hidden");
  const [value, setValue] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REVEAL_DURATION);
  const [copied, setCopied] = useState(false);

  const hide = useCallback(() => {
    setState("hidden");
    setValue(null);
    setCountdown(REVEAL_DURATION);
  }, []);

  useEffect(() => {
    if (state !== "revealed") return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          hide();
          return REVEAL_DURATION;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state, hide]);

  async function handleReveal() {
    setState("loading");
    try {
      const res = await fetch(
        `/api/admin/zugangsdaten/${credentialId}/reveal`,
        { method: "POST", credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) {
        setState("hidden");
        return;
      }
      setValue(data.value);
      setCountdown(REVEAL_DURATION);
      setState("revealed");
    } catch {
      setState("hidden");
    }
  }

  async function handleCopy() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (state === "loading") {
    return (
      <div className="flex items-center gap-2 text-ink-muted text-sm">
        <Spinner size="sm" />
        <span>Entschlüsseln…</span>
      </div>
    );
  }

  if (state === "revealed" && value !== null) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <code className="flex-1 font-mono text-xs bg-dark-300 border border-border rounded-lg px-3 py-2 text-surface break-all select-all">
            {value}
          </code>
          <button
            onClick={handleCopy}
            className="shrink-0 p-1.5 text-ink-muted hover:text-surface transition-colors"
            title="Kopieren"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
        </div>
        <div className="flex items-center gap-3">
          {copied && (
            <span className="text-xs text-green-400">Kopiert!</span>
          )}
          <button
            onClick={hide}
            className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-surface transition-colors ml-auto"
          >
            <EyeOff size={12} />
            Verbergen ({countdown}s)
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleReveal}
      className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-surface transition-colors"
    >
      <Eye size={13} />
      Anzeigen
    </button>
  );
}
