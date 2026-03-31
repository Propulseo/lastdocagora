"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { markAttendance } from "./attendance";

type WalkInResult =
  | { success: true; appointmentId: string }
  | { success: false; error: string };

export async function createWalkIn(formData: {
  patientName: string;
  serviceId: string;
  scheduledTime: string;
  phone?: string;
  email?: string;
  notes?: string;
}): Promise<WalkInResult> {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Get professional id
  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) return { success: false, error: "Professional not found" };

  // Look up service for duration and price
  const { data: service } = await supabase
    .from("services")
    .select("id, duration_minutes, price, consultation_type")
    .eq("id", formData.serviceId)
    .eq("professional_id", professional.id)
    .single();

  if (!service) return { success: false, error: "Service not found" };

  // Try to find existing patient by email if provided
  let patientId: string | null = null;
  let patientUserId: string | null = null;

  if (formData.email) {
    const { data: existingPatient } = await supabase
      .from("patients")
      .select("id, user_id")
      .eq("email", formData.email)
      .limit(1)
      .maybeSingle();

    if (existingPatient) {
      patientId = existingPatient.id;
      patientUserId = existingPatient.user_id;
    }
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const now = new Date().toISOString();

  // Insert appointment
  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      appointment_date: todayStr,
      appointment_time: formData.scheduledTime,
      duration_minutes: service.duration_minutes,
      status: "confirmed",
      created_via: "walk_in",
      title: formData.patientName.trim(),
      patient_id: patientId,
      patient_user_id: patientUserId,
      professional_id: professional.id,
      professional_user_id: user.id,
      service_id: service.id,
      price: service.price ?? 0,
      consultation_type: service.consultation_type ?? "in-person",
      notes: formData.notes?.trim() || null,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  // Auto-mark attendance as "present"
  await markAttendance(appointment.id, "present");

  revalidatePath("/pro/agenda");
  revalidatePath("/pro/today");

  return { success: true, appointmentId: appointment.id };
}
