"use client";

import { useState, useTransition } from "react";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { cancelAppointment } from "@/app/(admin)/_actions/admin-actions";
import {
  updateAppointmentStatusAdmin,
  updateAttendanceAdmin,
  deleteAppointmentAdmin,
} from "@/app/(admin)/_actions/admin-crud-actions";
import { toast } from "sonner";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { AppointmentMobileList } from "./appointment-mobile-list";
import { AppointmentDetailModal } from "./appointment-detail-modal";
import { AppointmentEditModal } from "./appointment-edit-modal";
import { buildAppointmentColumns } from "./appointment-table-columns";
import type { AppointmentStatus, AttendanceStatus } from "@/types";

export interface AppointmentRow {
  id: string;
  patient_name: string;
  patient_avatar_url: string | null;
  professional_name: string;
  professional_avatar_url: string | null;
  date: string;
  time: string;
  status: string;
  duration_minutes?: number | null;
  created_via: string | null;
  created_at: string | null;
  consultation_type: string | null;
  location: string | null;
  price: number | null;
  notes: string | null;
  cancellation_reason: string | null;
  rejection_reason: string | null;
  cancelled_at: string | null;
  decided_at: string | null;
  service_name: string | null;
  service_price: number | null;
  attendance_status: string | null;
}

interface AppointmentsTableProps {
  data: AppointmentRow[];
}

export function AppointmentsTable({ data }: AppointmentsTableProps) {
  const { t } = useAdminI18n();
  const dateLocale = t.common.dateLocale as "pt-PT" | "fr-FR";
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionSheet, setActionSheet] = useState<AppointmentRow | null>(null);
  const [detailRow, setDetailRow] = useState<AppointmentRow | null>(null);
  const [editTarget, setEditTarget] = useState<{ id: string; date: string; time: string } | null>(null);

  function handleCancel(id: string) {
    setActionSheet(null);
    setConfirmCancel(id);
  }

  function executeCancel() {
    if (!confirmCancel) return;
    startTransition(async () => {
      const result = await cancelAppointment(confirmCancel);
      if (result.success) {
        toast.success(t.appointments.appointmentCancelled);
      } else {
        toast.error(result.error ?? t.common.errorUpdating);
      }
      setConfirmCancel(null);
    });
  }

  const errorMap: Record<string, string> = {
    INVALID_TRANSITION: t.appointments.errors?.invalidTransition ?? "Invalid transition",
    ATTENDANCE_CANCELLED_BLOCKED: t.appointments.errors?.attendanceCancelledBlocked ?? "Attendance blocked",
    APPOINTMENT_NOT_STARTED: t.appointments.errors?.appointmentNotStarted ?? "Appointment not started",
    ATTENDANCE_LOCKED_PRESENT: t.appointments.errors?.attendanceLockedPresent ?? "Attendance locked",
    DELETE_PRESENT_BLOCKED: t.appointments.errors?.deletePresentBlocked ?? "Delete blocked",
    APPOINTMENT_IMMUTABLE: t.appointments.errors?.editBlockedAttendance ?? "Edit blocked",
  };

  function mapError(error?: string | null): string {
    return (error && errorMap[error]) || error || t.common.errorUpdating;
  }

  function executeDelete() {
    if (!confirmDelete) return;
    startTransition(async () => {
      const result = await deleteAppointmentAdmin(confirmDelete);
      if (result.success) {
        toast.success(t.appointments.appointmentDeleted);
      } else {
        toast.error(mapError(result.error));
      }
      setConfirmDelete(null);
    });
  }

  function handleStatusChange(appointmentId: string, status: string) {
    startTransition(async () => {
      const result = await updateAppointmentStatusAdmin(appointmentId, status as AppointmentStatus);
      if (result.success) {
        toast.success(t.appointments.appointmentUpdated);
      } else {
        toast.error(mapError(result.error));
      }
    });
  }

  function handleAttendanceChange(appointmentId: string, status: string) {
    startTransition(async () => {
      const result = await updateAttendanceAdmin(appointmentId, status as AttendanceStatus);
      if (result.success) {
        toast.success(t.appointments.appointmentUpdated);
      } else {
        toast.error(mapError(result.error));
      }
    });
  }

  const statusLabels = t.statuses.appointment as Record<string, string>;
  const attendanceLabels = t.statuses.attendance as Record<string, string>;

  const columns = buildAppointmentColumns(
    {
      tablePatient: t.appointments.tablePatient,
      tableProfessional: t.appointments.tableProfessional,
      dateAndTime: t.appointments.dateAndTime,
      changeAttendance: t.appointments.changeAttendance,
      viewDetails: t.appointments.viewDetails,
      editDateTime: t.appointments.editDateTime,
      cancelAppointment: t.appointments.cancelAppointment,
      deleteAppointment: t.appointments.deleteAppointment,
      deletedPatient: t.appointments.deletedPatient,
      commonStatus: t.common.status,
      commonActions: t.common.actions,
      dateLocale,
      statusLabels,
      attendanceLabels,
    },
    {
      onStatusChange: handleStatusChange,
      onAttendanceChange: handleAttendanceChange,
      onCancel: handleCancel,
      onViewDetails: setDetailRow,
      onEdit: setEditTarget,
      onDelete: setConfirmDelete,
    },
  );

  return (
    <div className="space-y-4">
      <AppointmentMobileList
        data={data}
        actionSheet={actionSheet}
        onOpenActionSheet={setActionSheet}
        onCloseActionSheet={() => setActionSheet(null)}
        onCancel={handleCancel}
        onViewDetails={(row) => { setActionSheet(null); setDetailRow(row); }}
      />

      <div className="hidden sm:block">
        <DataTable
          columns={columns}
          data={data}
          rowKey={(row) => row.id}
          emptyTitle={t.appointments.emptyTitle}
          emptyDescription={t.common.noResultsHint}
          variant="admin"
        />
      </div>

      <ConfirmDialog
        open={!!confirmCancel}
        onOpenChange={(open) => !open && setConfirmCancel(null)}
        title={t.appointments.confirmCancelTitle}
        description={t.appointments.confirmCancelDesc}
        confirmLabel={t.appointments.cancelAppointment}
        cancelLabel={t.common.cancel}
        loadingLabel={t.common.processing}
        variant="destructive"
        loading={isPending}
        onConfirm={executeCancel}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title={t.appointments.deleteConfirmTitle}
        description={t.appointments.deleteConfirmDesc}
        confirmLabel={t.appointments.deleteAppointment}
        cancelLabel={t.common.cancel}
        loadingLabel={t.common.processing}
        variant="destructive"
        loading={isPending}
        onConfirm={executeDelete}
      />

      <AppointmentDetailModal
        appointment={detailRow}
        onClose={() => setDetailRow(null)}
      />

      {editTarget && (
        <AppointmentEditModal
          appointmentId={editTarget.id}
          currentDate={editTarget.date}
          currentTime={editTarget.time}
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
        />
      )}
    </div>
  );
}
