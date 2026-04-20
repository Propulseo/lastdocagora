"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "./admin-crud-helpers";

export async function createAppointmentAdmin(data: {
  professionalId: string;
  patientId: string;
  serviceId: string;
  date: string;
  time: string;
  durationMinutes: number;
  notes?: string;
}) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  // Get professional + verify active
  const { data: pro } = await admin.supabase
    .from("professionals")
    .select("user_id, verification_status")
    .eq("id", data.professionalId)
    .single();

  if (!pro) return { success: false, error: "Professional not found" };
  if (pro.verification_status === "suspended" || pro.verification_status === "rejected") {
    return { success: false, error: "PROFESSIONAL_NOT_ACTIVE" };
  }

  // Get patient + verify active
  const { data: patient } = await admin.supabase
    .from("patients")
    .select("user_id")
    .eq("id", data.patientId)
    .single();

  if (!patient) return { success: false, error: "Patient not found" };

  const { data: patientUser } = await admin.supabase
    .from("users")
    .select("status")
    .eq("id", patient.user_id)
    .single();
  if (patientUser?.status === "suspended") {
    return { success: false, error: "PATIENT_SUSPENDED" };
  }

  // Check for time slot conflicts
  const { data: conflicts } = await admin.supabase
    .from("appointments")
    .select("id")
    .eq("professional_id", data.professionalId)
    .eq("appointment_date", data.date)
    .not("status", "in", '("cancelled","rejected")')
    .limit(1);
  if (conflicts && conflicts.length > 0) {
    return { success: false, error: "SLOT_CONFLICT" };
  }

  const { error } = await admin.supabase.from("appointments").insert({
    professional_id: data.professionalId,
    patient_id: data.patientId,
    service_id: data.serviceId,
    professional_user_id: pro.user_id,
    patient_user_id: patient.user_id,
    appointment_date: data.date,
    appointment_time: data.time,
    duration_minutes: data.durationMinutes,
    status: "confirmed",
    created_via: "manual",
    notes: data.notes ?? null,
    created_by_user_id: admin.user.id,
    consultation_type: "in-person",
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/appointments");
  return { success: true };
}
