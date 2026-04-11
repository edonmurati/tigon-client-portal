import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantClasses = {
  primary:
    "bg-accent text-ink font-medium hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed",
  ghost:
    "bg-transparent text-surface hover:bg-dark-300 border border-border disabled:opacity-50 disabled:cursor-not-allowed",
  destructive:
    "bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2 text-sm rounded-xl gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center transition-colors duration-150 cursor-pointer",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
