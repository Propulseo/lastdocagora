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

  // Check for time slot conflicts (Rule 6: return free slots)
  const { data: conflicts } = await admin.supabase
    .from("appointments")
    .select("appointment_time, duration_minutes")
    .eq("professional_id", data.professionalId)
    .eq("appointment_date", data.date)
    .not("status", "in", '("cancelled","rejected")');
  if (conflicts && conflicts.length > 0) {
    // Compute occupied intervals
    const occupied = conflicts.map((c: { appointment_time: string; duration_minutes: number }) => {
      const [h, m] = c.appointment_time.split(":").map(Number);
      const start = h * 60 + m;
      return { start, end: start + (c.duration_minutes || 30) };
    });
    // Generate free 30-min slots between 08:00-19:00
    const freeSlots: string[] = [];
    for (let t = 480; t <= 1110; t += 30) { // 480=08:00, 1110=18:30
      const slotEnd = t + 30;
      const hasConflict = occupied.some((o: { start: number; end: number }) => t < o.end && slotEnd > o.start);
      if (!hasConflict) {
        const hh = String(Math.floor(t / 60)).padStart(2, "0");
        const mm = String(t % 60).padStart(2, "0");
        freeSlots.push(`${hh}:${mm}`);
      }
    }
    return { success: false, error: "SLOT_CONFLICT", freeSlots };
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
