import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHADOW, RADIUS, TYPE } from "@/lib/design-tokens";

const iconVariantStyles = {
  default: "bg-primary/10 text-primary",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
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
        "bg-card text-card-foreground p-5 transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
        RADIUS.card,
        SHADOW.card,
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center",
            RADIUS.element,
            iconVariantStyles[iconVariant]
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className={TYPE.label}>{label}</p>
          <div className="flex items-baseline gap-2">
            <p
              className={cn(TYPE.kpi_number, "tabular-nums truncate")}
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
