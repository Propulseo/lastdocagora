"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle, XCircle, CalendarClock, Lock, UserCheck, UserMinus, UserX } from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { canMarkNonPresent } from "../_lib/agenda-constants";
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
  rejected: "destructive",
  "no-show": "destructive",
  no_show: "destructive",
};

interface AppointmentDetailBodyProps {
  selected: Appointment;
  onMarkAttendance: (status: AttendanceStatus) => void;
  onStatusChange: (status: "confirmed" | "cancelled") => void;
  isUpdating: boolean;
  onShowCancelDialog: (show: boolean) => void;
  onShowRejectDialog: (show: boolean) => void;
  onShowProposeDialog: (show: boolean) => void;
}

export function AppointmentDetailBody({
  selected,
  onMarkAttendance,
  onStatusChange,
  isUpdating,
  onShowCancelDialog,
  onShowRejectDialog,
  onShowProposeDialog,
}: AppointmentDetailBodyProps) {
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

  const selectedAttendance =
    selected.appointment_attendance?.status ?? "waiting";
  const canMark =
    selected.status !== "cancelled" &&
    selected.status !== "rejected" &&
    selected.status !== "pending" &&
    selected.status !== "no-show" &&
    selected.status !== "no_show";
  const canConfirm = selected.status === "pending";
  const canCancel =
    selected.status === "pending" || selected.status === "confirmed";

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-medium">
          {selected.patients?.first_name
            ? `${selected.patients.first_name} ${selected.patients.last_name}`
            : selected.title || t.agenda.manualAppointment}
        </p>
        <div className="flex items-center gap-2">
          {selected.created_via === "walk_in" && (
            <Badge className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">
              Walk-in
            </Badge>
          )}
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

      {canConfirm && (
        <div className="flex flex-col sm:flex-row gap-2 border-t pt-4 w-full">
          <Button
            className="w-full sm:flex-1 gap-1.5 min-h-[48px] bg-green-600 hover:bg-green-700 text-white"
            disabled={isUpdating}
            onClick={() => onStatusChange("confirmed")}
          >
            <CheckCircle className="h-4 w-4" />
            {t.agenda.acceptAppointment}
          </Button>
          <Button
            variant="outline"
            className="w-full sm:flex-1 gap-1.5 min-h-[48px] sm:order-3"
            disabled={isUpdating}
            onClick={() => onShowProposeDialog(true)}
          >
            <CalendarClock className="h-4 w-4" />
            {t.agenda.propose.button}
          </Button>
          <Button
            variant="destructive"
            className="w-full sm:flex-1 gap-1.5 min-h-[48px] sm:order-2"
            disabled={isUpdating}
            onClick={() => onShowRejectDialog(true)}
          >
            <XCircle className="h-4 w-4" />
            {t.agenda.rejectAppointment}
          </Button>
        </div>
      )}

      {!canConfirm && canCancel && (
        <div className="flex gap-2 border-t pt-4">
          <Button
            variant="destructive"
            size="sm"
            className="flex-1 gap-1.5 min-h-[48px]"
            disabled={isUpdating}
            onClick={() => onShowCancelDialog(true)}
          >
            <XCircle className="h-4 w-4" />
            {t.agenda.cancellation.title}
          </Button>
        </div>
      )}

      {canMark && (
        <div className="border-t pt-4">
          <p className="mb-3 text-sm font-medium">
            {t.agenda.attendance.markAttendance}
          </p>
          <TooltipProvider>
            <div className="flex gap-2">
              {attendanceActions.map((action) => {
                const Icon = action.icon;
                const isActive = selectedAttendance === action.status;
                const isLocked = selectedAttendance === "present" && action.status !== "present";
                const isTooEarly = (action.status === "absent" || action.status === "late") && !isLocked && !isActive && !canMarkNonPresent(selected);
                const tooEarlyTooltip = action.status === "absent"
                  ? t.agenda.attendance.absentTooEarly
                  : t.agenda.attendance.lateTooEarly;
                const btn = (
                  <Button
                    key={action.status}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className={`flex-1 gap-1.5 min-h-[48px] ${isActive ? action.activeClass : ""}`}
                    disabled={isUpdating || isLocked || isTooEarly}
                    onClick={() => onMarkAttendance(action.status)}
                  >
                    {isActive && selectedAttendance === "present" ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    {action.label}
                  </Button>
                );
                if (isLocked) {
                  return (
                    <Tooltip key={action.status}>
                      <TooltipTrigger asChild>
                        <span className="flex-1">{btn}</span>
                      </TooltipTrigger>
                      <TooltipContent>{t.agenda.attendance.lockedTooltip}</TooltipContent>
                    </Tooltip>
                  );
                }
                if (isTooEarly) {
                  return (
                    <Tooltip key={action.status}>
                      <TooltipTrigger asChild>
                        <span className="flex-1">{btn}</span>
                      </TooltipTrigger>
                      <TooltipContent>{tooEarlyTooltip}</TooltipContent>
                    </Tooltip>
                  );
                }
                return btn;
              })}
            </div>
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
