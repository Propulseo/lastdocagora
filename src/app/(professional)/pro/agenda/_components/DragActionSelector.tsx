"use client";

import { CalendarPlus, Clock } from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/shared/responsive-dialog";

interface DragActionSelectorProps {
  open: boolean;
  startTime: string;
  endTime: string;
  onCreateAppointment: () => void;
  onCreateAvailability: () => void;
  onClose: () => void;
}

export function DragActionSelector({
  open,
  startTime,
  endTime,
  onCreateAppointment,
  onCreateAvailability,
  onClose,
}: DragActionSelectorProps) {
  const { t } = useProfessionalI18n();

  return (
    <ResponsiveDialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <ResponsiveDialogContent className="max-w-xs p-0">
        <ResponsiveDialogHeader className="sr-only">
          <ResponsiveDialogTitle>{startTime} – {endTime}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <div className="p-2">
          <p className="mb-1.5 px-2 text-xs font-medium text-muted-foreground">
            {startTime} – {endTime}
          </p>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent focus:bg-accent focus:outline-none"
            onClick={onCreateAppointment}
          >
            <CalendarPlus className="h-4 w-4 shrink-0" />
            {t.agenda.createPatientAppointment}
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent focus:bg-accent focus:outline-none"
            onClick={onCreateAvailability}
          >
            <Clock className="h-4 w-4 shrink-0" />
            {t.agenda.openAvailabilitySlot}
          </button>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
