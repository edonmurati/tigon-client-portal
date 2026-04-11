import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "interactive";
  onClick?: () => void;
}

export function Card({ children, className, variant = "default", onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-dark-100 border border-border rounded-xl",
        variant === "interactive" &&
          "cursor-pointer hover:border-accent/40 hover:bg-dark-200 transition-colors duration-150",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-5 pt-5 pb-3", className)}>{children}</div>;
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("px-5 pb-5", className)}>{children}</div>;
}
