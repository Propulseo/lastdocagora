"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RADIUS } from "@/lib/design-tokens";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import type { Appointment } from "../_types/agenda";

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  confirmed: "default",
  pending: "secondary",
  completed: "outline",
  cancelled: "destructive",
  rejected: "destructive",
  "no-show": "destructive",
  no_show: "destructive",
};

interface MonthDayDetailDialogProps {
  selected: Appointment | null;
  onClose: () => void;
}

export function MonthDayDetailDialog({
  selected,
  onClose,
}: MonthDayDetailDialogProps) {
  const { t } = useProfessionalI18n();

  const statusLabel: Record<string, string> = {
    confirmed: t.common.status.confirmed,
    pending: t.common.status.pending,
    completed: t.common.status.completed,
    cancelled: t.common.status.cancelled,
    rejected: t.common.status.rejected,
    "no-show": t.common.status.noShow,
    no_show: t.common.status.noShow,
  };

  return (
    <Dialog open={!!selected} onOpenChange={() => onClose()}>
      <DialogContent className={RADIUS.card}>
        <DialogHeader>
          <DialogTitle>{t.agenda.appointmentDetails}</DialogTitle>
        </DialogHeader>
        {selected && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                {selected.patients?.first_name
                  ? `${selected.patients.first_name} ${selected.patients.last_name}`
                  : selected.title || t.agenda.manualAppointment}
              </p>
              <div className="flex items-center gap-2">
                {selected.created_via === "manual" && (
                  <Badge variant="outline">
                    {t.agenda.manualAppointment}
                  </Badge>
                )}
                <Badge
                  variant={statusVariant[selected.status] ?? "outline"}
                >
                  {statusLabel[selected.status] ?? selected.status}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">{t.agenda.time}</p>
                <p>{selected.appointment_time?.slice(0, 5)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t.agenda.duration}</p>
                <p>
                  {selected.duration_minutes} {t.common.min}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">{t.agenda.service}</p>
                <p>{selected.services?.name ?? "-"}</p>
              </div>
            </div>
            {selected.notes && (
              <div className="text-sm">
                <p className="text-muted-foreground">{t.agenda.notes}</p>
                <p>{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
