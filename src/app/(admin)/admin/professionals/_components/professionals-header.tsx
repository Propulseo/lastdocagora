"use client";

import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface ProfessionalsHeaderProps {
  total: number;
  verified: number;
  pending: number;
  rejected: number;
  specialtyCount: number;
  cityCount: number;
}

export function ProfessionalsHeader({
  total,
  verified,
  pending,
  rejected,
  specialtyCount,
  cityCount,
}: ProfessionalsHeaderProps) {
  const { t } = useAdminI18n();

  const metrics = [
    { label: t.professionals.title, value: total, primary: true },
    { label: t.statuses.verification.verified, value: verified },
    { label: t.statuses.verification.pending, value: pending },
    { label: t.statuses.verification.rejected, value: rejected },
    { label: t.professionals.headerSpecialties, value: specialtyCount },
    { label: t.professionals.headerCities, value: cityCount },
  ];

  return (
    <div
      style={{ animation: "admin-fade-up 0.4s ease-out both" }}
    >
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">
          {t.professionals.title}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t.professionals.description}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {/* Desktop — horizontal */}
        <div className="hidden sm:flex">
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
                {m.primary ? "Total" : m.label}
              </p>
            </div>
          ))}
        </div>

        {/* Mobile — 3x2 grid */}
        <div className="grid grid-cols-3 sm:hidden">
          {metrics.map((m, i) => (
            <div
              key={m.label}
              className={`flex flex-col justify-center px-4 py-3 ${
                i % 3 !== 0 ? "border-l border-border" : ""
              } ${i >= 3 ? "border-t border-border" : ""}`}
            >
              <p className="text-lg font-semibold tabular-nums tracking-tight">
                {m.value}
              </p>
              <p className="text-[11px] font-medium text-muted-foreground">
                {m.primary ? "Total" : m.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
