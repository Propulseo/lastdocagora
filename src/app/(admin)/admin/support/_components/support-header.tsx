"use client";

import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface SupportHeaderProps {
  total: number;
  open: number;
  inProgress: number;
  awaitingConfirmation: number;
  resolved: number;
  closed: number;
}

export function SupportHeader({
  total,
  open,
  inProgress,
  awaitingConfirmation,
  resolved,
  closed,
}: SupportHeaderProps) {
  const { t } = useAdminI18n();

  const metrics = [
    { label: t.support.title, value: total, primary: true },
    { label: t.statuses.ticket.open, value: open },
    { label: t.statuses.ticket.in_progress, value: inProgress },
    { label: (t.statuses.ticket as Record<string, string>).awaiting_confirmation ?? "Awaiting", value: awaitingConfirmation },
    { label: t.statuses.ticket.resolved, value: resolved },
    { label: t.statuses.ticket.closed, value: closed },
  ];

  return (
    <div style={{ animation: "admin-fade-up 0.4s ease-out both" }}>
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">
          {t.support.title}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t.support.description}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {/* Desktop — horizontal */}
        <div className="hidden sm:flex">
          {metrics.map((m, i) => (
            <div
              key={i}
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
              key={i}
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
