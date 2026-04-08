"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
} from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RADIUS } from "@/lib/design-tokens";
import { useManualAppointment } from "../_hooks/useManualAppointment";
import { PatientPicker } from "./PatientPicker";
import type { Appointment } from "../_types/agenda";

interface CreateManualAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalId: string;
  userId: string;
  selectedDate: string;
  startTime: string;
  endTime: string;
  appointments: Appointment[];
  onCreated: () => void;
}

export function CreateManualAppointmentDialog({
  open,
  onOpenChange,
  professionalId,
  userId,
  selectedDate,
  startTime: initialStartTime,
  endTime: initialEndTime,
  appointments,
  onCreated,
}: CreateManualAppointmentDialogProps) {
  const form = useManualAppointment({
    open,
    professionalId,
    userId,
    selectedDate,
    initialStartTime,
    initialEndTime,
    appointments,
    onOpenChange,
    onCreated,
  });

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className={`sm:max-w-md p-6 ${RADIUS.card}`}>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{form.t.agenda.createAppointment}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground text-xs">
              {selectedDate}
            </Label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start-time">{form.t.agenda.startTime}</Label>
              <Input
                id="start-time"
                type="time"
                value={form.startTime}
                onChange={(e) => form.setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end-time">{form.t.agenda.endTime}</Label>
              <Input
                id="end-time"
                type="time"
                value={form.endTime}
                onChange={(e) => form.setEndTime(e.target.value)}
              />
            </div>
          </div>

          <PatientPicker
            patientMode={form.patientMode}
            onToggleMode={form.togglePatientMode}
            loadingPatients={form.loadingPatients}
            proPatients={form.proPatients}
            filteredPatients={form.filteredPatients}
            selectedPatient={form.selectedPatient}
            onSelectPatient={form.setSelectedPatient}
            patientFilter={form.patientFilter}
            onFilterChange={form.setPatientFilter}
            newFirstName={form.newFirstName}
            onFirstNameChange={form.setNewFirstName}
            newLastName={form.newLastName}
            onLastNameChange={form.setNewLastName}
            newEmail={form.newEmail}
            onEmailChange={form.setNewEmail}
            newPhone={form.newPhone}
            onPhoneChange={form.setNewPhone}
            t={form.t}
          />

          <div className="space-y-1.5">
            <Label htmlFor="apt-title">{form.t.agenda.titleLabel}</Label>
            <Input
              id="apt-title"
              value={form.title}
              onChange={(e) => form.setTitle(e.target.value)}
              placeholder={form.t.agenda.titlePlaceholder}
              maxLength={255}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="apt-notes">{form.t.agenda.notes}</Label>
            <Textarea
              id="apt-notes"
              value={form.notes}
              onChange={(e) => form.setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {form.error && (
            <p className="text-sm text-destructive">{form.error}</p>
          )}
        </div>

        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={form.saving}
          >
            {form.t.common.cancel}
          </Button>
          <Button onClick={form.handleSubmit} disabled={form.saving}>
            {form.saving ? form.t.common.saving : form.t.agenda.save}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
