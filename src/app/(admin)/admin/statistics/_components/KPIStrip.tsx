"use client";

import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import type { StatisticsData } from "../_lib/types";

interface KPIStripProps {
  kpis: StatisticsData["kpis"];
}

export function KPIStrip({ kpis }: KPIStripProps) {
  const { t } = useAdminI18n();
  const s = t.statistics;

  const delta = (n: number) => (n >= 0 ? `+${n}` : String(n));

  const metrics = [
    {
      label: s.kpiTotalUsers,
      value: kpis.totalUsers,
      sub: s.newOnPeriod.replace("{count}", delta(kpis.usersDelta)),
      primary: true,
    },
    {
      label: s.kpiPatients,
      value: kpis.totalPatients,
      sub: s.newOnPeriod.replace("{count}", String(kpis.newPatients)),
    },
    {
      label: s.kpiProfessionals,
      value: kpis.totalProfessionals,
      sub: `${kpis.verifiedPros} ${s.verified.toLowerCase()}`,
    },
    {
      label: s.kpiAppointments,
      value: kpis.totalAppointments,
      sub: s.thisMonth.replace("{count}", String(kpis.periodAppointments)),
    },
    {
      label: s.kpiActivityRate,
      value: `${kpis.activityRate}%`,
      sub: s.activePros.replace("{rate}", String(kpis.activityRate)),
    },
    {
      label: s.kpiCompletionRate,
      value: `${kpis.completionRate}%`,
      sub: s.completedRate.replace("{rate}", String(kpis.completionRate)),
    },
  ];

  return (
    <div
      className="overflow-hidden rounded-lg border border-border bg-card"
      style={{ animation: "admin-fade-up 0.4s ease-out both", animationDelay: "80ms" }}
    >
      {/* Desktop — horizontal strip */}
      <div className="hidden lg:flex">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={`flex flex-1 flex-col justify-center px-5 py-4 ${
              i > 0 ? "border-l border-border" : ""
            }`}
          >
            <p
              className={`tabular-nums tracking-tight font-semibold ${
                m.primary ? "text-2xl" : "text-xl"
              }`}
            >
              {m.value}
            </p>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              {m.label}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/50">
              {m.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Tablet — 2 rows of 3 */}
      <div className="hidden sm:block lg:hidden">
        <div className="flex">
          {metrics.slice(0, 3).map((m, i) => (
            <div
              key={m.label}
              className={`flex flex-1 flex-col justify-center px-5 py-4 ${
                i > 0 ? "border-l border-border" : ""
              }`}
            >
              <p className="text-xl font-semibold tabular-nums tracking-tight">
                {m.value}
              </p>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                {m.label}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground/50">
                {m.sub}
              </p>
            </div>
          ))}
        </div>
        <div className="flex border-t border-border">
          {metrics.slice(3).map((m, i) => (
            <div
              key={m.label}
              className={`flex flex-1 flex-col justify-center px-5 py-4 ${
                i > 0 ? "border-l border-border" : ""
              }`}
            >
              <p className="text-xl font-semibold tabular-nums tracking-tight">
                {m.value}
              </p>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                {m.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile — 2 col grid */}
      <div className="grid grid-cols-2 sm:hidden">
        {metrics.map((m, i) => (
          <div
            key={m.label}
            className={`flex flex-col justify-center px-4 py-3 ${
              i % 2 !== 0 ? "border-l border-border" : ""
            } ${i >= 2 ? "border-t border-border" : ""}`}
          >
            <p className="text-lg font-semibold tabular-nums tracking-tight">
              {m.value}
            </p>
            <p className="text-[11px] font-medium text-muted-foreground">
              {m.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
