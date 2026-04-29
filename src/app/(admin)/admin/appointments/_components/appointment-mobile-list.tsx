"use client";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Eye, MoreHorizontal, X as XIcon } from "lucide-react";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import type { AppointmentRow } from "./appointments-table";

interface AppointmentMobileListProps {
  data: AppointmentRow[];
  actionSheet: AppointmentRow | null;
  onOpenActionSheet: (row: AppointmentRow) => void;
  onCloseActionSheet: () => void;
  onCancel: (id: string) => void;
  onViewDetails: (row: AppointmentRow) => void;
}

export function AppointmentMobileList({
  data,
  actionSheet,
  onOpenActionSheet,
  onCloseActionSheet,
  onCancel,
  onViewDetails,
}: AppointmentMobileListProps) {
  const { t } = useAdminI18n();
  const dateLocale = t.common.dateLocale as "pt-PT" | "fr-FR";

  return (
    <>
      <div className="space-y-2 sm:hidden">
        {data.map((row) => {
          const shortDate = new Intl.DateTimeFormat(dateLocale, {
            day: "numeric",
            month: "short",
          }).format(new Date(row.date));
          return (
            <div
              key={row.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card shadow-sm p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-muted-foreground truncate">
                    {row.patient_name || t.appointments.deletedPatient}
                  </p>
                  <StatusBadge
                    type="appointment"
                    value={row.status}
                    labels={t.statuses.appointment}
                  />
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {row.professional_name !== "\u2014" ? row.professional_name : ""} · {shortDate} · {row.time}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px] shrink-0"
                onClick={() => onOpenActionSheet(row)}
                aria-label={t.mobile.actions}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </div>
          );
        })}
      </div>

      <Sheet
        open={!!actionSheet}
        onOpenChange={(open) => !open && onCloseActionSheet()}
      >
        <SheetContent side="bottom" className="pb-8">
          <SheetHeader>
            <SheetTitle>
              {actionSheet?.patient_name || t.appointments.deletedPatient}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-2 space-y-1">
            <button
              onClick={() => onViewDetails(actionSheet!)}
              className="flex h-14 w-full items-center gap-3 rounded-md px-4 text-sm hover:bg-accent transition-all active:scale-[0.98]"
            >
              <Eye className="size-5" />
              {t.appointments.viewDetails}
            </button>
            {actionSheet &&
              actionSheet.status !== "completed" &&
              actionSheet.status !== "cancelled" &&
              actionSheet.status !== "rejected" &&
              actionSheet.status !== "no-show" && (
                <button
                  onClick={() => onCancel(actionSheet.id)}
                  className="flex h-14 w-full items-center gap-3 rounded-md px-4 text-sm text-destructive hover:bg-destructive/10 transition-all active:scale-[0.98]"
                >
                  <XIcon className="size-5" />
                  {t.appointments.cancelAppointment}
                </button>
              )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
