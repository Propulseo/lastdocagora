"use client";

import { StatusBadge } from "@/components/shared/status-badge";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from "@/components/shared/responsive-dialog";
import {
  Calendar,
  Clock,
  Stethoscope,
  User,
  MapPin,
  FileText,
  Tag,
  Shield,
} from "lucide-react";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import type { AppointmentRow } from "./appointments-table";

interface AppointmentDetailModalProps {
  appointment: AppointmentRow | null;
  onClose: () => void;
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}

export function AppointmentDetailModal({
  appointment,
  onClose,
}: AppointmentDetailModalProps) {
  const { t } = useAdminI18n();
  const d = t.appointments.detail;
  const dateLocale = t.common.dateLocale as "pt-PT" | "fr-FR" | "en-US";

  if (!appointment) {
    return (
      <ResponsiveDialog open={false} onOpenChange={() => onClose()}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{d.title}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription className="sr-only">
              {d.title}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    );
  }

  const formattedDate = new Intl.DateTimeFormat(dateLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(appointment.date));

  const formattedPrice =
    appointment.price != null
      ? new Intl.NumberFormat(dateLocale, {
          style: "currency",
          currency: "EUR",
        }).format(appointment.price)
      : appointment.service_price != null
        ? new Intl.NumberFormat(dateLocale, {
            style: "currency",
            currency: "EUR",
          }).format(appointment.service_price)
        : null;

  const createdViaLabel =
    appointment.created_via === "patient_booking"
      ? d.createdViaPatient
      : appointment.created_via === "manual"
        ? d.createdViaManual
        : appointment.created_via === "walk_in"
          ? d.createdViaWalkIn
          : appointment.created_via ?? "—";

  const attendanceLabel = appointment.attendance_status
    ? ({
        waiting: d.attendanceWaiting,
        present: d.attendancePresent,
        absent: d.attendanceAbsent,
        late: d.attendanceLate,
        cancelled: d.attendanceCancelled,
      }[appointment.attendance_status] ?? appointment.attendance_status)
    : null;

  const formatTimestamp = (ts: string | null) => {
    if (!ts) return null;
    return new Intl.DateTimeFormat(dateLocale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(ts));
  };

  const isWalkIn = appointment.created_via === "walk_in";
  const isCancelled = appointment.status === "cancelled";
  const isRejected = appointment.status === "rejected";

  return (
    <ResponsiveDialog
      open={!!appointment}
      onOpenChange={(open) => !open && onClose()}
    >
      <ResponsiveDialogContent className="sm:max-w-lg p-6">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            {d.title}
            <span className="text-xs font-mono text-muted-foreground">
              #{appointment.id.slice(0, 8)}
            </span>
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="sr-only">
            {d.title} #{appointment.id.slice(0, 8)}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="mt-4 space-y-5">
          {/* Status row */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              type="appointment"
              value={appointment.status}
              labels={t.statuses.appointment}
            />
            {attendanceLabel && (
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
                {d.attendanceStatus}: {attendanceLabel}
              </span>
            )}
            {isWalkIn && (
              <span className="inline-flex items-center rounded-full border border-amber-400 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                Walk-in
              </span>
            )}
          </div>

          {/* Patient — RGPD */}
          <div className="rounded-lg border p-3 space-y-1">
            <div className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {appointment.patient_name || t.appointments.deletedPatient}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="size-3" />
              {d.rgpdNote}
            </div>
          </div>

          {/* Professional */}
          <div className="flex items-center gap-2">
            <Stethoscope className="size-4 text-muted-foreground" />
            <span className="text-sm">{appointment.professional_name}</span>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            <InfoItem
              icon={Calendar}
              label={d.dateTime}
              value={`${formattedDate} · ${appointment.time}`}
            />
            <InfoItem
              icon={Clock}
              label={d.duration}
              value={
                appointment.duration_minutes
                  ? `${appointment.duration_minutes} ${d.minutes}`
                  : "—"
              }
            />
            <InfoItem
              icon={Tag}
              label={d.service}
              value={appointment.service_name ?? d.noService}
            />
            {formattedPrice && (
              <InfoItem icon={Tag} label={d.price} value={formattedPrice} />
            )}
            <InfoItem
              icon={Stethoscope}
              label={d.consultationType}
              value={
                appointment.consultation_type === "in-person"
                  ? d.inPerson
                  : (appointment.consultation_type ?? "—")
              }
            />
            <InfoItem
              icon={MapPin}
              label={d.location}
              value={appointment.location ?? d.noLocation}
            />
            <InfoItem
              icon={FileText}
              label={d.createdVia}
              value={createdViaLabel}
            />
            {appointment.created_at && (
              <InfoItem
                icon={Calendar}
                label={d.createdAt}
                value={formatTimestamp(appointment.created_at)}
              />
            )}
          </div>

          {/* Conditional: cancelled */}
          {isCancelled && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1">
              {appointment.cancelled_at && (
                <p className="text-xs text-muted-foreground">
                  {d.cancelledAt}: {formatTimestamp(appointment.cancelled_at)}
                </p>
              )}
              {appointment.cancellation_reason && (
                <p className="text-sm">
                  <span className="font-medium">{d.cancellationReason}:</span>{" "}
                  {appointment.cancellation_reason}
                </p>
              )}
            </div>
          )}

          {/* Conditional: rejected */}
          {isRejected && appointment.rejection_reason && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-sm">
                <span className="font-medium">{d.rejectionReason}:</span>{" "}
                {appointment.rejection_reason}
              </p>
            </div>
          )}

          {/* Conditional: professional notes */}
          {appointment.notes && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {d.professionalNotes}
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {appointment.notes}
              </p>
            </div>
          )}

          {/* Metadata footer */}
          {appointment.decided_at && (
            <p className="text-xs text-muted-foreground">
              {d.decidedAt}: {formatTimestamp(appointment.decided_at)}
            </p>
          )}
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
