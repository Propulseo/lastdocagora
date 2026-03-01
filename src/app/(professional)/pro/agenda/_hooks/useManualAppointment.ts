import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import type { Appointment } from "../_types/agenda";
import type { PatientOption, PatientMode } from "../_types/manual-appointment";

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function timeDiffInMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

function hasOverlap(
  appointments: Appointment[],
  date: string,
  start: string,
  end: string,
): boolean {
  return appointments.some((apt) => {
    if (apt.appointment_date !== date || apt.status === "cancelled") return false;
    const aptStart = apt.appointment_time.slice(0, 5);
    const aptEnd = addMinutesToTime(aptStart, apt.duration_minutes);
    return start < aptEnd && end > aptStart;
  });
}

interface UseManualAppointmentParams {
  open: boolean;
  professionalId: string;
  userId: string;
  selectedDate: string;
  initialStartTime: string;
  initialEndTime: string;
  appointments: Appointment[];
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function useManualAppointment({
  open,
  professionalId,
  userId,
  selectedDate,
  initialStartTime,
  initialEndTime,
  appointments,
  onOpenChange,
  onCreated,
}: UseManualAppointmentParams) {
  const { t } = useProfessionalI18n();
  const supabase = useMemo(() => createClient(), []);

  // Form fields
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const consultationType = "in-person";
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Patient selection
  const [patientMode, setPatientMode] = useState<PatientMode>("select");
  const [proPatients, setProPatients] = useState<PatientOption[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [patientFilter, setPatientFilter] = useState("");

  // New patient fields
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // Load pro's patients on open
  useEffect(() => {
    if (!open) return;

    setStartTime(initialStartTime);
    setEndTime(initialEndTime);
    setTitle("");
    setNotes("");
    setSelectedPatient(null);
    setPatientFilter("");
    setPatientMode("select");
    setNewFirstName("");
    setNewLastName("");
    setNewEmail("");
    setNewPhone("");
    setError("");

    async function loadProPatients() {
      setLoadingPatients(true);
      const { data } = await supabase
        .from("patients")
        .select("id, user_id, first_name, last_name, email")
        .order("first_name", { ascending: true });

      setProPatients((data as PatientOption[]) ?? []);
      setLoadingPatients(false);
    }

    loadProPatients();
  }, [open, initialStartTime, initialEndTime, supabase]);

  const filteredPatients = useMemo(() => {
    if (!patientFilter.trim()) return proPatients;
    const q = patientFilter.toLowerCase();
    return proPatients.filter(
      (p) =>
        p.first_name?.toLowerCase().includes(q) ||
        p.last_name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q),
    );
  }, [proPatients, patientFilter]);

  const togglePatientMode = useCallback(() => {
    setPatientMode((prev) => (prev === "select" ? "new" : "select"));
    setSelectedPatient(null);
    setError("");
  }, []);

  const handleSubmit = useCallback(async () => {
    setError("");

    if (!startTime || !endTime) return;
    if (startTime >= endTime) {
      setError(t.agenda.startBeforeEnd);
      return;
    }
    const duration = timeDiffInMinutes(startTime, endTime);
    if (duration < 30) {
      setError(t.agenda.startBeforeEnd);
      return;
    }

    if (hasOverlap(appointments, selectedDate, startTime, endTime)) {
      setError(t.agenda.overlapError);
      return;
    }

    setSaving(true);

    let patientId: string | null = selectedPatient?.id ?? null;
    let patientUserId: string | null = selectedPatient?.user_id ?? null;

    if (patientMode === "new") {
      if (!newFirstName.trim()) {
        setError(t.agenda.firstNameRequired);
        setSaving(false);
        return;
      }
      if (!newLastName.trim()) {
        setError(t.agenda.lastNameRequired);
        setSaving(false);
        return;
      }
      if (!newEmail.trim()) {
        setError(t.agenda.emailRequired);
        setSaving(false);
        return;
      }

      const { data: result, error: fnError } = await supabase.rpc(
        "create_patient_for_pro",
        {
          p_first_name: newFirstName.trim(),
          p_last_name: newLastName.trim(),
          p_email: newEmail.trim(),
          p_phone: newPhone.trim() || undefined,
        },
      );

      if (fnError) {
        setError(t.agenda.patientCreateError);
        setSaving(false);
        return;
      }

      const res = result as { patient_id: string; user_id: string; already_exists: boolean };
      patientId = res.patient_id;
      patientUserId = res.user_id;

      if (res.already_exists) {
        toast.info(t.agenda.patientAlreadyExists);
      }
    }

    const { error: insertError } = await supabase.from("appointments").insert({
      professional_id: professionalId,
      professional_user_id: userId,
      patient_id: patientId,
      patient_user_id: patientUserId,
      appointment_date: selectedDate,
      appointment_time: `${startTime}:00`,
      duration_minutes: duration,
      consultation_type: consultationType,
      status: "confirmed",
      created_via: "manual",
      title: title || null,
      notes: notes || null,
    });

    setSaving(false);

    if (insertError) {
      if (insertError.code === "23505") {
        setError(t.agenda.slotConflict);
      } else {
        toast.error(t.agenda.appointmentCreateError);
      }
      return;
    }

    toast.success(t.agenda.appointmentCreated);
    onOpenChange(false);
    onCreated();
  }, [
    startTime,
    endTime,
    title,
    notes,
    selectedPatient,
    patientMode,
    newFirstName,
    newLastName,
    newEmail,
    newPhone,
    appointments,
    selectedDate,
    professionalId,
    userId,
    supabase,
    onOpenChange,
    onCreated,
    t,
  ]);

  return {
    t,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    title,
    setTitle,
    notes,
    setNotes,
    saving,
    error,
    patientMode,
    togglePatientMode,
    loadingPatients,
    proPatients,
    filteredPatients,
    selectedPatient,
    setSelectedPatient,
    patientFilter,
    setPatientFilter,
    newFirstName,
    setNewFirstName,
    newLastName,
    setNewLastName,
    newEmail,
    setNewEmail,
    newPhone,
    setNewPhone,
    handleSubmit,
  };
}
