"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import type { TopPro } from "../_lib/types";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function TopProfessionals({ data }: { data: TopPro[] }) {
  const { t } = useAdminI18n();
  const s = t.statistics;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold">{s.topProsTitle}</h3>
      </div>

      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{s.noData}</p>
      ) : (
        <div>
          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-[24px_1fr_1fr_80px_60px_80px] items-center gap-3 px-5 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50 border-b border-border">
            <span>{s.rank}</span>
            <span>{s.name}</span>
            <span>{s.specialty}</span>
            <span className="text-right">{s.appointments}</span>
            <span className="text-right">{s.rating}</span>
            <span>{s.city}</span>
          </div>

          {data.map((pro, i) => (
            <div
              key={i}
              className="grid grid-cols-[24px_1fr_1fr_80px_60px_80px] items-center gap-3 px-5 py-2.5 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
            >
              <span className="text-xs font-medium tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="size-6">
                  {pro.avatar_url && <AvatarImage src={pro.avatar_url} alt={pro.name} />}
                  <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-medium">
                    {getInitials(pro.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm truncate">{pro.name}</span>
              </div>
              <span className="text-sm text-muted-foreground truncate">
                {pro.specialty}
              </span>
              <span className="text-sm font-medium tabular-nums text-right">
                {pro.appointmentCount}
              </span>
              <span className="text-sm tabular-nums text-right text-muted-foreground">
                {pro.rating.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {pro.city}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
