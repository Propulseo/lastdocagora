"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAppointmentAdmin } from "@/app/(admin)/_actions/admin-crud-actions";
import { toast } from "sonner";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { createClient } from "@/lib/supabase/client";
import { generateSlots, filterPastSlots, type AvailabilityRange, type ExistingAppointment } from "@/lib/slots";

interface SimpleRecord {
  id: string;
  label: string;
}

interface ServiceRecord {
  id: string;
  label: string;
  professional_id: string;
  duration_minutes: number;
}

interface AppointmentCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppointmentCreateModal({
  open,
  onOpenChange,
}: AppointmentCreateModalProps) {
  const { t } = useAdminI18n();
  const [isPending, startTransition] = useTransition();

  const [patients, setPatients] = useState<SimpleRecord[]>([]);
  const [professionals, setProfessionals] = useState<SimpleRecord[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);

  const [patientId, setPatientId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [notes, setNotes] = useState("");

  // Available days (day_of_week numbers) for the selected professional
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  // Available time slots for the selected pro + date + duration
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Load patients, professionals, services on open
  useEffect(() => {
    if (!open) return;
    const supabase = createClient();

    supabase
      .from("patients")
      .select("id, user_id, users!patients_user_id_fkey(first_name, last_name, role, status)")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setPatients(
          (data ?? [])
            .filter((p) => {
              const u = p.users as unknown as { role: string; status: string | null } | null;
              return u && u.role === "patient" && u.status !== "suspended";
            })
            .map((p) => {
              const u = p.users as unknown as { first_name: string; last_name: string };
              return {
                id: p.id,
                label: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || `Patient #${p.id.slice(-5)}`,
              };
            })
        );
      });

    supabase
      .from("professionals")
      .select("id, specialty, users!professionals_user_id_fkey(first_name, last_name, role, status)")
      .eq("verification_status", "verified")
      .order("created_at", { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setProfessionals(
          (data ?? [])
            .filter((p) => {
              const u = p.users as unknown as { role: string; status: string | null } | null;
              return u && u.role === "professional" && u.status !== "suspended";
            })
            .map((p) => {
              const u = p.users as unknown as { first_name: string; last_name: string };
              return {
                id: p.id,
                label: `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || p.id.slice(-5),
              };
            })
        );
      });

    supabase
      .from("services")
      .select("id, name, professional_id, duration_minutes")
      .eq("is_active", true)
      .order("name")
      .limit(500)
      .then(({ data }) => {
        setServices(
          (data ?? []).map((s) => ({
            id: s.id,
            label: s.name,
            professional_id: s.professional_id,
            duration_minutes: s.duration_minutes,
          }))
        );
      });
  }, [open]);

  // When professional changes → fetch their available days
  useEffect(() => {
    if (!professionalId) {
      setAvailableDays([]);
      return;
    }
    const supabase = createClient();
    supabase
      .from("availability")
      .select("day_of_week, specific_date, is_recurring, is_blocked")
      .eq("professional_id", professionalId)
      .or("is_blocked.is.null,is_blocked.eq.false")
      .then(({ data }) => {
        const days = new Set<number>();
        for (const row of data ?? []) {
          days.add(row.day_of_week);
        }
        setAvailableDays(Array.from(days).sort());
      });
  }, [professionalId]);

  // When professional + date + duration change → compute available slots
  const fetchSlots = useCallback(async (proId: string, selectedDate: string, dur: number) => {
    if (!proId || !selectedDate) {
      setAvailableSlots([]);
      return;
    }

    setLoadingSlots(true);
    try {
      const supabase = createClient();
      const dateObj = new Date(selectedDate + "T00:00:00");
      const dayOfWeek = dateObj.getDay(); // 0=Sun, 6=Sat

      // Fetch availability windows for this day
      const { data: availRows } = await supabase
        .from("availability")
        .select("start_time, end_time, is_recurring, specific_date, day_of_week")
        .eq("professional_id", proId)
        .or("is_blocked.is.null,is_blocked.eq.false");

      const ranges: AvailabilityRange[] = (availRows ?? [])
        .filter((row) => {
          if (row.is_recurring) return row.day_of_week === dayOfWeek;
          return row.specific_date === selectedDate;
        })
        .map((row) => ({ start_time: row.start_time, end_time: row.end_time }));

      if (ranges.length === 0) {
        setAvailableSlots([]);
        setLoadingSlots(false);
        return;
      }

      // Fetch existing appointments for this pro on this date (excluding cancelled/rejected)
      const { data: apptRows } = await supabase
        .from("appointments")
        .select("appointment_time, duration_minutes")
        .eq("professional_id", proId)
        .eq("appointment_date", selectedDate)
        .not("status", "in", '("cancelled","rejected")');

      const existing: ExistingAppointment[] = (apptRows ?? []).map((a) => ({
        appointment_time: a.appointment_time,
        duration_minutes: a.duration_minutes || 30,
      }));

      const slots = generateSlots(ranges, existing, dur);
      const filtered = filterPastSlots(slots, selectedDate);
      setAvailableSlots(filtered);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots(professionalId, date, Number(duration) || 30);
    setTime(""); // reset time when slots change
  }, [professionalId, date, duration, fetchSlots]);

  const filteredServices = professionalId
    ? services.filter((s) => s.professional_id === professionalId)
    : services;

  function handleProfessionalChange(proId: string) {
    setProfessionalId(proId);
    setServiceId("");
    setDate("");
    setTime("");
  }

  function handleServiceChange(sid: string) {
    setServiceId(sid);
    const svc = services.find((s) => s.id === sid);
    if (svc) setDuration(String(svc.duration_minutes));
  }

  function handleDateChange(newDate: string) {
    if (!newDate) { setDate(""); return; }

    // Validate that the selected day matches the pro's availability
    const dateObj = new Date(newDate + "T00:00:00");
    const dayOfWeek = dateObj.getDay();
    if (availableDays.length > 0 && !availableDays.includes(dayOfWeek)) {
      toast.error(t.appointments.errors.noProfessionalAvailability);
      return;
    }
    setDate(newDate);
  }

  function resetForm() {
    setPatientId("");
    setProfessionalId("");
    setServiceId("");
    setDate("");
    setTime("");
    setDuration("30");
    setNotes("");
    setAvailableDays([]);
    setAvailableSlots([]);
  }

  function handleOpenChange(val: boolean) {
    if (!val) resetForm();
    onOpenChange(val);
  }

  function handleCreate() {
    if (!patientId || !professionalId || !serviceId || !date || !time) return;

    if (Number(duration) < 5) {
      toast.error(t.appointments.errors.durationTooShort);
      return;
    }

    startTransition(async () => {
      const result = await createAppointmentAdmin({
        professionalId,
        patientId,
        serviceId,
        date,
        time,
        durationMinutes: Number(duration),
        notes: notes || undefined,
      });
      if (result.success) {
        toast.success(t.appointments.appointmentCreated);
        handleOpenChange(false);
      } else {
        const createErrorMap: Record<string, string> = {
          PROFESSIONAL_NOT_ACTIVE: t.appointments.errors.proSuspended,
          PATIENT_SUSPENDED: t.appointments.errors.patientSuspended,
          DURATION_TOO_SHORT: t.appointments.errors.durationTooShort,
        };
        if (result.error === "SLOT_CONFLICT") {
          toast.error(t.appointments.errors.slotConflictWithSlots);
        } else {
          toast.error(createErrorMap[result.error ?? ""] ?? result.error ?? t.common.errorUpdating);
        }
      }
    });
  }

  // Day name helper for available days hint
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const availableDaysLabel = availableDays.map((d) => dayNames[d]).join(", ");

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="p-6 sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t.appointments.createAppointment}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{""}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="grid gap-4 py-4">
          {/* Patient */}
          <div className="space-y-2">
            <Label>{t.appointments.selectPatient}</Label>
            <Select value={patientId} onValueChange={setPatientId}>
              <SelectTrigger><SelectValue placeholder={t.appointments.selectPatient} /></SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Professional */}
          <div className="space-y-2">
            <Label>{t.appointments.selectProfessional}</Label>
            <Select value={professionalId} onValueChange={handleProfessionalChange}>
              <SelectTrigger><SelectValue placeholder={t.appointments.selectProfessional} /></SelectTrigger>
              <SelectContent>
                {professionals.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service */}
          <div className="space-y-2">
            <Label>{t.appointments.selectService}</Label>
            <Select
              value={serviceId}
              onValueChange={handleServiceChange}
              disabled={!professionalId}
            >
              <SelectTrigger><SelectValue placeholder={!professionalId ? t.appointments.errors.selectProFirst : t.appointments.selectService} /></SelectTrigger>
              <SelectContent>
                {filteredServices.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date — only after professional is selected */}
          <div className="space-y-2">
            <Label>{t.appointments.date}</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              disabled={!professionalId}
              min={new Date().toISOString().split("T")[0]}
            />
            {professionalId && availableDays.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {t.appointments.errors.availableDays}: {availableDaysLabel}
              </p>
            )}
            {professionalId && availableDays.length === 0 && (
              <p className="text-xs text-destructive">
                {t.appointments.errors.noProfessionalAvailability}
              </p>
            )}
          </div>

          {/* Time — dropdown with only available slots */}
          <div className="space-y-2">
            <Label>{t.appointments.time}</Label>
            <Select
              value={time}
              onValueChange={setTime}
              disabled={!date || availableSlots.length === 0}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingSlots
                      ? t.appointments.errors.loadingSlots
                      : !date
                        ? t.appointments.errors.selectDateFirst
                        : availableSlots.length === 0
                          ? t.appointments.errors.noSlotsAvailable
                          : t.appointments.time
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {date && !loadingSlots && availableSlots.length === 0 && (
              <p className="text-xs text-destructive">
                {t.appointments.errors.noSlotsAvailable}
              </p>
            )}
          </div>

          {/* Duration (read-only, driven by service) */}
          <div className="space-y-2">
            <Label>{t.appointments.duration}</Label>
            <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min={5} step={5} />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{t.appointments.notes}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>

        <ResponsiveDialogFooter>
          <Button variant="outline" className="min-h-[48px]" onClick={() => handleOpenChange(false)} disabled={isPending}>
            {t.common.cancel}
          </Button>
          <Button
            className="min-h-[48px]"
            onClick={handleCreate}
            disabled={isPending || !patientId || !professionalId || !serviceId || !date || !time}
          >
            {isPending ? t.common.saving : t.appointments.createAppointment}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
