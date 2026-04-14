"use server";

import { createClient } from "@/lib/supabase/server";
import { getProfessionalId } from "@/lib/auth";
import type {
  DetailResult,
  ConsultationNoteRow,
  EnhancedDetailResult,
} from "./types";

// ---------------------------------------------------------------------------
// Patient detail for drawer
// ---------------------------------------------------------------------------

export async function getPatientDetail(
  patientId: string,
): Promise<DetailResult> {
  const professionalId = await getProfessionalId();
  const supabase = await createClient();

  // 1) Patient profile
  const { data: patient } = await supabase
    .from("patients")
    .select(
      "first_name, last_name, email, date_of_birth, avatar_url, languages_spoken, insurance_provider",
    )
    .eq("id", patientId)
    .single();

  if (!patient) return { success: false, error: "patient_not_found" };

  // 2) Appointments with this professional
  const { data: appointments } = await supabase
    .from("appointments")
    .select("appointment_date, appointment_time, status, notes, services(name)")
    .eq("patient_id", patientId)
    .eq("professional_id", professionalId)
    .order("appointment_date", { ascending: false })
    .order("appointment_time", { ascending: false });

  const rows = appointments ?? [];

  const completedCount = rows.filter((r) => r.status === "completed").length;

  const sorted = [...rows].sort((a, b) =>
    a.appointment_date.localeCompare(b.appointment_date),
  );
  const firstConsultation = sorted[0]?.appointment_date ?? null;
  const lastConsultation = sorted.length
    ? sorted[sorted.length - 1].appointment_date
    : null;

  const recentAppointments = rows.slice(0, 5).map((r) => ({
    date: r.appointment_date,
    time: r.appointment_time,
    status: r.status,
    serviceName:
      r.services && !Array.isArray(r.services) ? r.services.name : null,
    notes: r.notes,
  }));

  return {
    success: true,
    data: {
      ...patient,
      completedCount,
      firstConsultation,
      lastConsultation,
      recentAppointments,
    },
  };
}

// ---------------------------------------------------------------------------
// Enhanced patient detail for upgraded drawer
// ---------------------------------------------------------------------------

export async function getPatientDetailEnhanced(
  patientId: string,
): Promise<EnhancedDetailResult> {
  const professionalId = await getProfessionalId();
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];

  // Parallel: patient profile + all appointments + upcoming + consultation notes
  const [patientResult, appointmentsResult, upcomingResult, notesResult] =
    await Promise.all([
      supabase
        .from("patients")
        .select(
          "first_name, last_name, email, date_of_birth, avatar_url, languages_spoken, insurance_provider, created_at",
        )
        .eq("id", patientId)
        .single(),
      supabase
        .from("appointments")
        .select(
          "id, appointment_date, appointment_time, status, notes, price, services(name), appointment_attendance(status, late_minutes)",
        )
        .eq("patient_id", patientId)
        .eq("professional_id", professionalId)
        .lte("appointment_date", today)
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: false }),
      supabase
        .from("appointments")
        .select(
          "id, appointment_date, appointment_time, status, services(name)",
        )
        .eq("patient_id", patientId)
        .eq("professional_id", professionalId)
        .gt("appointment_date", today)
        .in("status", ["confirmed", "pending"])
        .order("appointment_date", { ascending: true })
        .limit(5),
      (supabase as unknown as { from: (table: string) => ReturnType<typeof supabase.from> })
        .from("consultation_notes")
        .select(
          "id, content, follow_up_needed, follow_up_suggested_date, created_at, updated_at, appointment_id, appointments(appointment_date, appointment_time)",
        )
        .eq("patient_id", patientId)
        .eq("professional_id", professionalId)
        .order("created_at", { ascending: false }),
    ]);

  const patient = patientResult.data;
  if (!patient) return { success: false, error: "patient_not_found" };

  const rows = appointmentsResult.data ?? [];
  const upcoming = upcomingResult.data ?? [];
  const rawNotes = (notesResult.data ?? []) as unknown as Array<{
    id: string;
    content: string;
    follow_up_needed: boolean;
    follow_up_suggested_date: string | null;
    created_at: string;
    updated_at: string;
    appointment_id: string;
    appointments: { appointment_date: string; appointment_time: string } | null;
  }>;

  const completedCount = rows.filter((r) => r.status === "completed").length;

  const sorted = [...rows].sort((a, b) =>
    a.appointment_date.localeCompare(b.appointment_date),
  );
  const firstConsultation = sorted[0]?.appointment_date ?? null;
  const lastConsultation = sorted.length
    ? sorted[sorted.length - 1].appointment_date
    : null;

  // Attendance
  let attendPresent = 0;
  let attendTotal = 0;
  for (const r of rows) {
    const att = r.appointment_attendance;
    if (att && Array.isArray(att) && att.length > 0) {
      attendTotal++;
      const s = att[0].status;
      if (s === "present" || s === "late") attendPresent++;
    }
  }
  const attendanceRate =
    attendTotal > 0 ? Math.round((attendPresent / attendTotal) * 100) : 0;

  // Revenue
  let totalSpent = 0;
  let paidCount = 0;
  for (const r of rows) {
    const price = Number(r.price) || 0;
    if (price > 0 && r.status !== "cancelled") {
      totalSpent += price;
      paidCount++;
    }
  }
  const avgSpent = paidCount > 0 ? totalSpent / paidCount : 0;

  const allAppointments = rows.map((r) => {
    const att = r.appointment_attendance;
    let attendanceStatus: string | null = null;
    if (att && Array.isArray(att) && att.length > 0) {
      attendanceStatus = att[0].status;
    }
    return {
      id: r.id,
      date: r.appointment_date,
      time: r.appointment_time,
      status: r.status,
      serviceName:
        r.services && !Array.isArray(r.services) ? r.services.name : null,
      notes: r.notes,
      attendanceStatus,
    };
  });

  const upcomingAppointments = upcoming.map((r) => ({
    id: r.id,
    date: r.appointment_date,
    time: r.appointment_time,
    status: r.status,
    serviceName:
      r.services && !Array.isArray(r.services) ? r.services.name : null,
  }));

  const consultationNotes: ConsultationNoteRow[] = rawNotes.map((n) => ({
    id: n.id,
    content: n.content,
    follow_up_needed: n.follow_up_needed,
    follow_up_suggested_date: n.follow_up_suggested_date,
    created_at: n.created_at,
    updated_at: n.updated_at,
    appointment_id: n.appointment_id,
    appointment_date: n.appointments?.appointment_date ?? null,
    appointment_time: n.appointments?.appointment_time ?? null,
  }));

  return {
    success: true,
    data: {
      ...patient,
      completedCount,
      firstConsultation,
      lastConsultation,
      attendanceRate,
      attendanceTotal: attendTotal,
      totalSpent,
      avgSpent,
      allAppointments,
      upcomingAppointments,
      consultationNotes,
    },
  };
}
