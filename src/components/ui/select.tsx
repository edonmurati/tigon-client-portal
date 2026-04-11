import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ label, error, className, id, options, placeholder, ...props }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-ink-muted uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          "bg-dark-200 border border-border rounded-xl px-4 py-2.5 text-sm text-surface",
          "focus:outline-none focus:border-accent transition-colors duration-150",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "appearance-none cursor-pointer",
          error && "border-red-500 focus:border-red-500",
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" className="bg-dark-200">
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-dark-200">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
