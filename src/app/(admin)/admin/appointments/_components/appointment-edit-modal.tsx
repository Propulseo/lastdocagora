"use client";

import { useState, useTransition } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { updateAppointmentDateTimeAdmin } from "@/app/(admin)/_actions/admin-crud-actions";
import { toast } from "sonner";
import { resolveErrorMessage } from "@/lib/error-messages";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface AppointmentEditModalProps {
  appointmentId: string | null;
  currentDate: string;
  currentTime: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppointmentEditModal({
  appointmentId,
  currentDate,
  currentTime,
  open,
  onOpenChange,
}: AppointmentEditModalProps) {
  const { t } = useAdminI18n();
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState(currentDate);
  const [time, setTime] = useState(currentTime);
  const [force, setForce] = useState(false);

  function handleOpenChange(val: boolean) {
    if (val) {
      setDate(currentDate);
      setTime(currentTime);
      setForce(false);
    }
    onOpenChange(val);
  }

  function handleSave() {
    if (!appointmentId) return;
    startTransition(async () => {
      const result = await updateAppointmentDateTimeAdmin(appointmentId, date, time, force);
      if (result.success) {
        toast.success(t.appointments.appointmentUpdated);
        onOpenChange(false);
      } else if (result.error === "conflict") {
        toast.error(t.appointments.conflictWarning);
      } else {
        toast.error(resolveErrorMessage(result.error, t.common.errorUpdating));
      }
    });
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="p-6 sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t.appointments.editDateTime}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{""}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>{t.appointments.date}</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t.appointments.time}</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="force" checked={force} onCheckedChange={(v) => setForce(v === true)} />
            <Label htmlFor="force" className="text-sm">{t.appointments.forceConflict}</Label>
          </div>
        </div>

        <ResponsiveDialogFooter>
          <Button variant="outline" className="min-h-[48px]" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t.common.cancel}
          </Button>
          <Button className="min-h-[48px]" onClick={handleSave} disabled={isPending}>
            {isPending ? t.common.saving : t.common.save}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
