import { Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-primary/5 blur-xl" />
        <div className="relative flex size-14 items-center justify-center rounded-2xl bg-muted/80 ring-1 ring-border/50">
          <Icon className="size-6 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
