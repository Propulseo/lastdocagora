"use client";

import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { translateSpecialty } from "@/locales/patient/specialties";
import type { SpecialtyCount } from "../_lib/types";

export function SpecialtyChart({ data }: { data: SpecialtyCount[] }) {
  const { t, locale } = useAdminI18n();
  const s = t.statistics;

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold">{s.topSpecialtiesTitle}</h3>
      </div>

      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">{s.noData}</p>
      ) : (
        <div className="px-5 py-4 space-y-3">
          {data.map((d, i) => {
            const label = translateSpecialty(d.specialty, locale) ?? d.specialty;
            const pct = (d.count / maxCount) * 100;
            return (
              <div key={d.specialty} className="flex items-center gap-3">
                <span className="text-xs tabular-nums text-muted-foreground/40 w-4 text-right shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm text-muted-foreground w-28 shrink-0 truncate" title={label}>
                  {label}
                </span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground/20 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs font-medium tabular-nums w-6 text-right shrink-0">
                  {d.count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
