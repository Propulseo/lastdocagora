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

export async function deletePatient(patientId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Check if patient has appointments (prevent deletion if so)
  const { count } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("patient_id", patientId);

  if (count && count > 0) {
    return {
      success: false,
      error: "Cannot delete patient with existing appointments",
    };
  }

  // Get user_id before deleting patient
  const { data: patient } = await supabase
    .from("patients")
    .select("user_id")
    .eq("id", patientId)
    .single();

  if (!patient) return { success: false, error: "Patient not found" };

  // Delete patient record
  const { error } = await supabase.from("patients").delete().eq("id", patientId);
  if (error) return { success: false, error: error.message };

  // Delete orphaned user record (only if role is patient and no other patient record)
  const { count: otherPatients } = await supabase
    .from("patients")
    .select("id", { count: "exact", head: true })
    .eq("user_id", patient.user_id);

  if (!otherPatients || otherPatients === 0) {
    await supabase.from("users").delete().eq("id", patient.user_id).eq("role", "patient");
  }

  revalidatePath("/pro/patients");
  return { success: true };
}
