"use client";

import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface UsersHeaderProps {
  total: number;
  patients: number;
  professionals: number;
  admins: number;
  active: number;
  suspended: number;
}

export function UsersHeader({
  total,
  patients,
  professionals,
  admins,
  active,
  suspended,
}: UsersHeaderProps) {
  const { t } = useAdminI18n();

  const metrics = [
    { label: t.users.title, value: total, primary: true },
    { label: t.statuses.role.patient, value: patients },
    { label: t.statuses.role.professional, value: professionals },
    { label: t.statuses.role.admin, value: admins },
    { label: t.statuses.userStatus.active, value: active },
    { label: t.statuses.userStatus.suspended, value: suspended },
  ];

  return (
    <div
      style={{ animation: "admin-fade-up 0.4s ease-out both" }}
    >
      {/* Title */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">
          {t.users.title}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t.users.description}
        </p>
      </div>

      {/* Metrics strip */}
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
