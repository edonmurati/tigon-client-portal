import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-dark-300 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-ink-muted" />
        </div>
      )}
      <p className="text-sm font-medium text-surface mb-1">{title}</p>
      {description && <p className="text-xs text-ink-muted max-w-xs">{description}</p>}
      {action && (
        <div className="mt-4">
          {action.href ? (
            <a href={action.href}>
              <Button size="sm">{action.label}</Button>
            </a>
          ) : (
            <Button size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
