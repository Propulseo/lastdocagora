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

export function AppointmentKpiStrip({ counts, labels }: AppointmentKpiStripProps) {
  const items = [
    { label: labels.kpiTotal, value: counts.total, color: "#374151" },
    { label: labels.kpiConfirmed, value: counts.confirmed, color: "#15803d" },
    { label: labels.kpiCancelled, value: counts.cancelled, color: "#dc2626" },
    { label: labels.kpiPending, value: counts.pending, color: "#854d0e" },
  ];
  return (
    <div className="flex items-center h-12 gap-6 px-4 rounded-lg border bg-[#f9fafb] overflow-x-auto">
      <div className="flex items-center gap-6 flex-nowrap min-w-max">
        {items.map((item, i) => (
          <div key={item.label} className="flex items-center gap-2">
            {i > 0 && <div className="w-px h-5 bg-[#e5e7eb]" />}
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] text-[#6b7280] whitespace-nowrap">{item.label}</span>
              <span className="text-[15px] font-semibold" style={{ color: item.color }}>{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
