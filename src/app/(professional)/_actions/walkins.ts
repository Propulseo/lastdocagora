"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { markAttendance } from "./attendance";
import { toLocalDateStr } from "../pro/agenda/_lib/date-utils";
import { format, addDays } from "date-fns";

export type SlotInfo = { slot_start: string; slot_end: string };
type DaySlots = { date: string; slots: SlotInfo[] };
type WalkInSlotsResult =
  | {
      success: true;
      today: SlotInfo[];
      nextDays: DaySlots[];
      currentSlot: string | null;
    }
  | { success: false; error: string };

export async function getWalkInSlots(
  professionalId: string
): Promise<WalkInSlotsResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const now = new Date();
  const todayStr = toLocalDateStr(now);
  const nowTime = format(now, "HH:mm");

  // Fetch today's slots
  const { data: todayRaw, error: todayErr } = await supabase.rpc(
    "get_available_slots",
    { p_date: todayStr, p_professional_id: professionalId }
  );

  if (todayErr) return { success: false, error: todayErr.message };

  const allTodaySlots = (todayRaw as SlotInfo[]) ?? [];

  // Filter out past slots, keep current + future
  const todaySlots = allTodaySlots.filter(
    (s) => s.slot_end.slice(0, 5) > nowTime
  );

  // Identify "now" slot — slot whose interval contains current time
  let currentSlot: string | null = null;
  for (const s of todaySlots) {
    if (s.slot_start.slice(0, 5) <= nowTime && s.slot_end.slice(0, 5) > nowTime) {
      currentSlot = s.slot_start;
      break;
    }
  }

  // If no slots today, look ahead up to 7 days (max 3 days with availability)
  const nextDays: DaySlots[] = [];
  if (todaySlots.length === 0) {
    for (let i = 1; i <= 7 && nextDays.length < 3; i++) {
      const d = addDays(now, i);
      const dateStr = toLocalDateStr(d);
      const { data } = await supabase.rpc("get_available_slots", {
        p_date: dateStr,
        p_professional_id: professionalId,
      });
      const slots = (data as SlotInfo[]) ?? [];
      if (slots.length > 0) {
        nextDays.push({ date: dateStr, slots });
      }
    }
  }

  return { success: true, today: todaySlots, nextDays, currentSlot };
}

type WalkInResult =
  | { success: true; appointmentId: string }
  | { success: false; error: string };

export async function createWalkIn(formData: {
  patientName: string;
  serviceId: string;
  scheduledTime: string;
  scheduledDate?: string;
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

  const todayStr = formData.scheduledDate ?? toLocalDateStr(new Date());
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
