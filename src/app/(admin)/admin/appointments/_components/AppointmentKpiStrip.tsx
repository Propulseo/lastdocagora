export interface StatusCounts {
  total: number;
  confirmed: number;
  cancelled: number;
  pending: number;
}

interface KpiLabels {
  kpiTotal: string;
  kpiConfirmed: string;
  kpiCancelled: string;
  kpiPending: string;
}

interface AppointmentKpiStripProps {
  counts: StatusCounts;
  labels: KpiLabels;
}

const items = [
  { key: "kpiTotal" as const, valueColor: "text-foreground" },
  { key: "kpiConfirmed" as const, valueColor: "text-emerald-700 dark:text-emerald-400" },
  { key: "kpiCancelled" as const, valueColor: "text-red-600 dark:text-red-400" },
  { key: "kpiPending" as const, valueColor: "text-amber-700 dark:text-amber-400" },
] as const;

const countKeys = ["total", "confirmed", "cancelled", "pending"] as const;

export function AppointmentKpiStrip({ counts, labels }: AppointmentKpiStripProps) {
  return (
    <div className="flex items-center h-12 gap-6 px-4 rounded-lg border border-border bg-muted/50 overflow-x-auto">
      <div className="flex items-center gap-6 flex-nowrap min-w-max">
        {items.map((item, i) => (
          <div key={item.key} className="flex items-center gap-2">
            {i > 0 && <div className="w-px h-5 bg-border" />}
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] text-muted-foreground whitespace-nowrap">{labels[item.key]}</span>
              <span className={`text-[15px] font-semibold tabular-nums ${item.valueColor}`}>
                {counts[countKeys[i]]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
