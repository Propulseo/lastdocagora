import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const iconVariantStyles = {
  default: "bg-primary/10 text-primary",
  blue: "bg-blue-500/10 text-blue-500",
  green: "bg-emerald-500/10 text-emerald-500",
  amber: "bg-amber-500/10 text-amber-500",
  red: "bg-red-500/10 text-red-500",
} as const;

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  description?: string;
  trend?: "up" | "down" | "neutral";
  iconVariant?: keyof typeof iconVariantStyles;
  className?: string;
}

export function KPICard({
  icon: Icon,
  label,
  value,
  description,
  trend,
  iconVariant = "default",
  className,
}: KPICardProps) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground rounded-xl border p-5 shadow-[var(--shadow-card)] transition-[box-shadow] duration-[var(--transition-base)] hover:shadow-[var(--shadow-hover)]",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            iconVariantStyles[iconVariant]
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground text-sm leading-tight">{label}</p>
          <div className="flex items-baseline gap-2">
            <p
              className="text-2xl font-bold tabular-nums tracking-tight truncate"
              title={typeof value === "string" ? value : undefined}
            >
              {value}
            </p>
            {trend && trend !== "neutral" && (
              <span
                className={cn(
                  "flex items-center gap-0.5 text-xs font-medium",
                  trend === "up" && "text-emerald-600",
                  trend === "down" && "text-red-600"
                )}
              >
                {trend === "up" ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
              </span>
            )}
          </div>
          {description && (
            <p className="text-muted-foreground mt-0.5 text-xs">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
