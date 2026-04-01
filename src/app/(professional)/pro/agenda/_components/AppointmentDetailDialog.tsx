"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/shared/responsive-dialog";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { CancelAppointmentDialog } from "./CancelAppointmentDialog";
import { RejectAppointmentDialog } from "./RejectAppointmentDialog";
import { ProposeAlternativeDialog } from "./ProposeAlternativeDialog";
import { AppointmentDetailBody } from "./AppointmentDetailBody";
import type { Appointment } from "../_types/agenda";
import type { AttendanceStatus } from "@/types";

interface AppointmentDetailDialogProps {
  selected: Appointment | null;
  onClose: () => void;
  onMarkAttendance: (status: AttendanceStatus) => void;
  onStatusChange: (status: "confirmed" | "cancelled") => void;
  isUpdating: boolean;
  showCancelDialog: boolean;
  onShowCancelDialog: (show: boolean) => void;
  onCancelAppointment: (reason: string, notifyPatient: boolean) => void;
  showRejectDialog: boolean;
  onShowRejectDialog: (show: boolean) => void;
  onRejectAppointment: (reason: string, notifyPatient: boolean) => void;
  showProposeDialog: boolean;
  onShowProposeDialog: (show: boolean) => void;
  onProposeAlternative: (date: string, time: string, message: string) => void;
}

export function AppointmentDetailDialog({
  selected,
  onClose,
  onMarkAttendance,
  onStatusChange,
  isUpdating,
  showCancelDialog,
  onShowCancelDialog,
  onCancelAppointment,
  showRejectDialog,
  onShowRejectDialog,
  onRejectAppointment,
  showProposeDialog,
  onShowProposeDialog,
  onProposeAlternative,
}: AppointmentDetailDialogProps) {
  const { t } = useProfessionalI18n();

  return (
    <ResponsiveDialog open={!!selected} onOpenChange={() => onClose()}>
      <ResponsiveDialogContent className="p-6">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t.agenda.appointmentDetails}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        {selected && (
          <AppointmentDetailBody
            selected={selected}
            onMarkAttendance={onMarkAttendance}
            onStatusChange={onStatusChange}
            isUpdating={isUpdating}
            onShowCancelDialog={onShowCancelDialog}
            onShowRejectDialog={onShowRejectDialog}
            onShowProposeDialog={onShowProposeDialog}
          />
        )}

        <CancelAppointmentDialog
          open={showCancelDialog}
          onOpenChange={onShowCancelDialog}
          onConfirm={onCancelAppointment}
          isUpdating={isUpdating}
        />

        <RejectAppointmentDialog
          open={showRejectDialog}
          onOpenChange={onShowRejectDialog}
          onConfirm={onRejectAppointment}
          isUpdating={isUpdating}
        />

        <ProposeAlternativeDialog
          open={showProposeDialog}
          onOpenChange={onShowProposeDialog}
          onConfirm={onProposeAlternative}
          isUpdating={isUpdating}
        />
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
