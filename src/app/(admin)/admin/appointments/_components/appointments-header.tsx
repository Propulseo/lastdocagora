"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { AppointmentCreateModal } from "./appointment-create-modal";

interface AppointmentsHeaderProps {
  total: number;
  confirmed: number;
  pending: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

export function AppointmentsHeader({
  total,
  confirmed,
  pending,
  completed,
  cancelled,
  noShow,
}: AppointmentsHeaderProps) {
  const { t } = useAdminI18n();
  const [createOpen, setCreateOpen] = useState(false);

  const metrics = [
    { label: t.appointments.title, value: total, primary: true },
    { label: t.statuses.appointment.confirmed, value: confirmed },
    { label: t.statuses.appointment.pending ?? t.appointments.kpiPending, value: pending },
    { label: t.statuses.appointment.completed, value: completed },
    { label: t.statuses.appointment.cancelled, value: cancelled },
    { label: t.statuses.appointment.no_show, value: noShow },
  ];

  return (
    <div
      style={{ animation: "admin-fade-up 0.4s ease-out both" }}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {t.appointments.title}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t.appointments.description}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          size="sm"
          className="hidden sm:flex h-9"
        >
          <Plus className="size-3.5 mr-1.5" />
          {t.appointments.createAppointment}
        </Button>
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

      {/* Mobile create button */}
      <div className="mt-3 sm:hidden">
        <Button
          onClick={() => setCreateOpen(true)}
          className="w-full min-h-[44px]"
        >
          <Plus className="size-4 mr-1.5" />
          {t.appointments.createAppointment}
        </Button>
      </div>

      <AppointmentCreateModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
