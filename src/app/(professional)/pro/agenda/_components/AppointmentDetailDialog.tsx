"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, UserCheck, UserMinus, UserX } from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import type { Appointment } from "../_types/agenda";
import type { AttendanceStatus } from "@/types";

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  confirmed: "default",
  pending: "secondary",
  completed: "outline",
  cancelled: "destructive",
  "no-show": "destructive",
  no_show: "destructive",
};

interface AppointmentDetailDialogProps {
  selected: Appointment | null;
  onClose: () => void;
  onMarkAttendance: (status: AttendanceStatus) => void;
  onStatusChange: (status: "confirmed" | "cancelled") => void;
  isUpdating: boolean;
}

export function AppointmentDetailDialog({
  selected,
  onClose,
  onMarkAttendance,
  onStatusChange,
  isUpdating,
}: AppointmentDetailDialogProps) {
  const { t } = useProfessionalI18n();

  const statusLabel: Record<string, string> = {
    confirmed: t.common.status.confirmed,
    pending: t.common.status.pending,
    completed: t.common.status.completed,
    cancelled: t.common.status.cancelled,
    "no-show": t.common.status.noShow,
    no_show: t.common.status.noShow,
  };

  const selectedAttendance =
    selected?.appointment_attendance?.status ?? "waiting";
  const canMark =
    selected &&
    selected.status !== "cancelled" &&
    selected.status !== "no-show" &&
    selected.status !== "no_show";

  const canConfirm = selected?.status === "pending";
  const canCancel =
    selected &&
    (selected.status === "pending" || selected.status === "confirmed");

  const attendanceActions = [
    {
      status: "present" as AttendanceStatus,
      label: t.agenda.attendance.statusPresent,
      icon: UserCheck,
      activeClass: "bg-green-600 hover:bg-green-700 text-white",
    },
    {
      status: "late" as AttendanceStatus,
      label: t.agenda.attendance.statusLate,
      icon: UserMinus,
      activeClass: "bg-amber-500 hover:bg-amber-600 text-white",
    },
    {
      status: "absent" as AttendanceStatus,
      label: t.agenda.attendance.statusAbsent,
      icon: UserX,
      activeClass: "bg-red-600 hover:bg-red-700 text-white",
    },
  ];

  return (
    <Dialog open={!!selected} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.agenda.appointmentDetails}</DialogTitle>
        </DialogHeader>
        {selected && (
          <div className="space-y-4">
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
              <div>
                <p className="text-muted-foreground">{t.agenda.type}</p>
                <p className="capitalize">{selected.consultation_type}</p>
              </div>
            </div>
            {selected.notes && (
              <div className="text-sm">
                <p className="text-muted-foreground">{t.agenda.notes}</p>
                <p>{selected.notes}</p>
              </div>
            )}

            {/* ── Confirm / Cancel actions ── */}
            {(canConfirm || canCancel) && (
              <div className="flex gap-2 border-t pt-4">
                {canConfirm && (
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                    disabled={isUpdating}
                    onClick={() => onStatusChange("confirmed")}
                  >
                    <CheckCircle className="h-4 w-4" />
                    {t.common.status.confirmed}
                  </Button>
                )}
                {canCancel && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 gap-1.5"
                    disabled={isUpdating}
                    onClick={() => onStatusChange("cancelled")}
                  >
                    <XCircle className="h-4 w-4" />
                    {t.common.status.cancelled}
                  </Button>
                )}
              </div>
            )}

            {/* ── Attendance marking ── */}
            {canMark && (
              <div className="border-t pt-4">
                <p className="mb-3 text-sm font-medium">
                  {t.agenda.attendance.markAttendance}
                </p>
                <div className="flex gap-2">
                  {attendanceActions.map((action) => {
                    const Icon = action.icon;
                    const isActive = selectedAttendance === action.status;
                    return (
                      <Button
                        key={action.status}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className={`flex-1 gap-1.5 ${isActive ? action.activeClass : ""}`}
                        disabled={isUpdating}
                        onClick={() => onMarkAttendance(action.status)}
                      >
                        <Icon className="h-4 w-4" />
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
