import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-ink-muted uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "bg-dark-200 border border-border rounded-xl px-4 py-2.5 text-sm text-surface placeholder:text-ink-muted",
          "focus:outline-none focus:border-accent transition-colors duration-150",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-red-500 focus:border-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
