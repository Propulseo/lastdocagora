"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfessionalId } from "@/lib/auth";

type ActionResult =
  | { success: true; data?: Record<string, unknown> }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Patient detail for drawer
// ---------------------------------------------------------------------------

export type PatientDetail = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  languages_spoken: string[] | null;
  insurance_provider: string | null;
  completedCount: number;
  firstConsultation: string | null;
  lastConsultation: string | null;
  recentAppointments: {
    date: string;
    time: string;
    status: string;
    serviceName: string | null;
    notes: string | null;
  }[];
};

type DetailResult =
  | { success: true; data: PatientDetail }
  | { success: false; error: string };

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

export type PatientDetailEnhanced = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  languages_spoken: string[] | null;
  insurance_provider: string | null;
  created_at: string | null;
  completedCount: number;
  firstConsultation: string | null;
  lastConsultation: string | null;
  attendanceRate: number;
  attendanceTotal: number;
  totalSpent: number;
  avgSpent: number;
  allAppointments: {
    id: string;
    date: string;
    time: string;
    status: string;
    serviceName: string | null;
    notes: string | null;
    attendanceStatus: string | null;
  }[];
  upcomingAppointments: {
    id: string;
    date: string;
    time: string;
    status: string;
    serviceName: string | null;
  }[];
  consultationNotes: {
    id: string;
    content: string;
    follow_up_needed: boolean;
    follow_up_suggested_date: string | null;
    created_at: string;
    updated_at: string;
    appointment_id: string;
    appointment_date: string | null;
    appointment_time: string | null;
  }[];
};

type EnhancedDetailResult =
  | { success: true; data: PatientDetailEnhanced }
  | { success: false; error: string };

export async function getPatientDetailEnhanced(
  patientId: string,
): Promise<EnhancedDetailResult> {
  const professionalId = await getProfessionalId();
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];

  // Parallel: patient profile + all appointments + upcoming
  const [patientResult, appointmentsResult, upcomingResult] = await Promise.all(
    [
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
    ],
  );

  const patient = patientResult.data;
  if (!patient) return { success: false, error: "patient_not_found" };

  // Fetch consultation notes for this patient
  const fromNotes = (supabase.from as unknown as (table: string) => ReturnType<typeof supabase.from>);
  const { data: notesData } = await fromNotes("consultation_notes")
    .select("id, content, follow_up_needed, follow_up_suggested_date, created_at, updated_at, appointment_id")
    .eq("patient_id", patientId)
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false }) as unknown as { data: { id: string; content: string; follow_up_needed: boolean; follow_up_suggested_date: string | null; created_at: string; updated_at: string; appointment_id: string }[] | null };

  const rows = appointmentsResult.data ?? [];
  const upcoming = upcomingResult.data ?? [];

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

  // Map notes with appointment date/time
  const appointmentMap = new Map(rows.map((r) => [r.id, { date: r.appointment_date, time: r.appointment_time }]));
  const consultationNotes = (notesData ?? []).map((n) => {
    const apt = appointmentMap.get(n.appointment_id);
    return {
      ...n,
      appointment_date: apt?.date ?? null,
      appointment_time: apt?.time ?? null,
    };
  });

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

export async function createPatient(formData: {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase.rpc("create_patient_for_pro", {
    p_first_name: formData.first_name.trim(),
    p_last_name: formData.last_name.trim(),
    p_email: formData.email.trim(),
    p_phone: formData.phone?.trim() || undefined,
  });

  if (error) return { success: false, error: error.message };

  const result = data as { patient_id: string; user_id: string; already_exists: boolean };

  revalidatePath("/pro/patients");
  return {
    success: true,
    data: {
      patient_id: result.patient_id,
      already_exists: result.already_exists,
    },
  };
}

export async function updatePatient(
  patientId: string,
  formData: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  }
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("patients")
    .update({
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email?.trim() || null,
      phone: formData.phone?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", patientId);

  if (error) return { success: false, error: error.message };

  // Also update the users table to keep names in sync
  const { data: patient } = await supabase
    .from("patients")
    .select("user_id")
    .eq("id", patientId)
    .single();

  if (patient) {
    await supabase
      .from("users")
      .update({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone?.trim() || null,
      })
      .eq("id", patient.user_id);
  }

  revalidatePath("/pro/patients");
  return { success: true };
}


export async function removePatient(patientId: string): Promise<ActionResult> {
  const professionalId = await getProfessionalId();
  const supabase = await createClient();

  // Verify the patient exists
  const { data: patient } = await supabase
    .from("patients")
    .select("id, created_by_professional_id")
    .eq("id", patientId)
    .single();

  if (!patient) return { success: false, error: "patient_not_found" };

  // Clear ownership if this pro created the patient
  if (patient.created_by_professional_id === professionalId) {
    const { error } = await supabase
      .from("patients")
      .update({ created_by_professional_id: null })
      .eq("id", patientId)
      .eq("created_by_professional_id", professionalId);

    if (error) {
      if (error.code === "23503") return { success: false, error: "linked_data" };
      if (error.code === "42501") return { success: false, error: "permission_denied" };
      return { success: false, error: error.message };
    }
  }

  // Hide patient from this pro's list via RPC (avoids typed client issues)
  const { error: hideError } = await (supabase.rpc as unknown as (fn: string, params: Record<string, string>) => Promise<{ error: { code: string; message: string } | null }>)("hide_patient_for_pro", {
    p_professional_id: professionalId,
    p_patient_id: patientId,
  });

  if (hideError) {
    if (hideError.code === "42501") return { success: false, error: "permission_denied" };
    return { success: false, error: hideError.message };
  }

  revalidatePath("/pro/patients");
  return { success: true };
}
