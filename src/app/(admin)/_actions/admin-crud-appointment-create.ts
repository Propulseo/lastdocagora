"use server";

import { revalidatePath } from "next/cache";
import { MIN_DURATION_MINUTES } from "@/lib/appointments";
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

  // Rule 10: minimum duration
  if (data.durationMinutes < MIN_DURATION_MINUTES) {
    return { success: false, error: "DURATION_TOO_SHORT" };
  }

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

  // Check for actual time slot overlap with existing appointments
  const { data: existingAppts } = await admin.supabase
    .from("appointments")
    .select("appointment_time, duration_minutes")
    .eq("professional_id", data.professionalId)
    .eq("appointment_date", data.date)
    .not("status", "in", '("cancelled","rejected")');

  if (existingAppts && existingAppts.length > 0) {
    const [reqH, reqM] = data.time.split(":").map(Number);
    const reqStart = reqH * 60 + reqM;
    const reqEnd = reqStart + data.durationMinutes;

    const hasOverlap = existingAppts.some((c: { appointment_time: string; duration_minutes: number }) => {
      const [h, m] = c.appointment_time.split(":").map(Number);
      const start = h * 60 + m;
      const end = start + (c.duration_minutes || 30);
      return reqStart < end && reqEnd > start;
    });

    if (hasOverlap) {
      return { success: false, error: "SLOT_CONFLICT" };
    }
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
