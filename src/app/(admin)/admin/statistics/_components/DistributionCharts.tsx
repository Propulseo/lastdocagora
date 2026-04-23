"use client";

import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import type { StatisticsData } from "../_lib/types";

function BarRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-24 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-foreground/20 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">{value}</span>
      <span className="text-[10px] tabular-nums text-muted-foreground/50 w-8 text-right">{pct}%</span>
    </div>
  );
}

interface DistributionChartsProps {
  proStatus: StatisticsData["proStatus"];
  bookingChannel: StatisticsData["bookingChannel"];
}

export function DistributionCharts({ proStatus, bookingChannel }: DistributionChartsProps) {
  const { t } = useAdminI18n();
  const s = t.statistics;

  const proTotal = proStatus.verified + proStatus.pending + proStatus.rejected;
  const channelTotal = bookingChannel.patient + bookingChannel.manual;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {/* Pro Status */}
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold mb-3">{s.proStatusTitle}</h3>
        <div className="space-y-2.5">
          <BarRow label={s.verified} value={proStatus.verified} total={proTotal} />
          <BarRow label={s.pending} value={proStatus.pending} total={proTotal} />
          <BarRow label={s.rejected} value={proStatus.rejected} total={proTotal} />
        </div>
      </div>

      {/* Booking Channel */}
      <div className="px-5 py-4">
        <h3 className="text-sm font-semibold mb-3">{s.bookingChannelTitle}</h3>
        <div className="space-y-2.5">
          <BarRow label={s.patientBooking} value={bookingChannel.patient} total={channelTotal} />
          <BarRow label={s.manualBooking} value={bookingChannel.manual} total={channelTotal} />
        </div>
      </div>
    </div>
  );
}
