import type { SupabaseClient } from "@supabase/supabase-js";
import { geocodeAddress } from "@/app/_actions/geocode";
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
} from "./onboarding-schemas";

type ActionResult =
  | { success: true; geocoded?: boolean }
  | { success: false; error: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supabase = SupabaseClient<any, "public", any>;

export async function handleStep1(
  data: unknown,
  userId: string,
  proId: string,
  supabase: Supabase,
): Promise<ActionResult> {
  const parsed = step1Schema.safeParse(data);
  if (!parsed.success) return { success: false, error: "validation_error" };
  const d = parsed.data;

  const { error: userErr } = await supabase
    .from("users")
    .update({
      first_name: d.first_name,
      last_name: d.last_name,
    })
    .eq("id", userId);
  if (userErr) return { success: false, error: userErr.message };

  const { error: proErr } = await supabase
    .from("professionals")
    .update({
      bio: d.bio || null,
      bio_pt: d.bio_pt || null,
      bio_fr: d.bio_fr || null,
      bio_en: d.bio_en || null,
      registration_number: d.registration_number,
      languages_spoken: d.languages_spoken
        ? d.languages_spoken.split(",").map((s) => s.trim()).filter(Boolean)
        : null,
      onboarding_step: 2,
    })
    .eq("id", proId);
  if (proErr) return { success: false, error: proErr.message };

  return { success: true };
}

export async function handleStep2(
  data: unknown,
  proId: string,
  supabase: Supabase,
): Promise<ActionResult> {
  const parsed = step2Schema.safeParse(data);
  if (!parsed.success) return { success: false, error: "validation_error" };
  const d = parsed.data;

  const providerIds = d.insurance_provider_ids ?? [];

  // Resolve provider names for backward compat
  let insuranceNames: string[] | null = null;
  if (providerIds.length > 0) {
    const { data: providers } = await supabase
      .from("insurance_providers")
      .select("name")
      .in("id", providerIds);
    insuranceNames = (providers ?? []).map((p) => p.name);
  }

  const { error } = await supabase
    .from("professionals")
    .update({
      specialty: d.specialty,
      subspecialties: d.subspecialties
        ? d.subspecialties.split(",").map((s) => s.trim()).filter(Boolean)
        : null,
      years_experience: d.years_experience ?? null,
      practice_type: d.practice_type || null,
      consultation_fee: d.consultation_fee ?? null,
      third_party_payment: d.third_party_payment ?? false,
      insurances_accepted: insuranceNames,
      onboarding_step: 3,
    })
    .eq("id", proId);
  if (error) return { success: false, error: error.message };

  // Update junction table
  await supabase
    .from("professional_insurances")
    .delete()
    .eq("professional_id", proId);

  if (providerIds.length > 0) {
    await supabase.from("professional_insurances").insert(
      providerIds.map((pid) => ({
        professional_id: proId,
        insurance_provider_id: pid,
      })),
    );
  }

  return { success: true };
}

export async function handleStep3(
  data: unknown,
  proId: string,
  userId: string,
  supabase: Supabase,
): Promise<ActionResult> {
  const parsed = step3Schema.safeParse(data);
  if (!parsed.success) return { success: false, error: "validation_error" };
  const d = parsed.data;

  const servicesToInsert = d.services.map((s) => ({
    name: s.name.trim(),
    name_pt: s.name.trim(),
    name_fr: s.name_fr?.trim() || null,
    name_en: s.name_en?.trim() || null,
    description: s.description?.trim() || null,
    duration_minutes: s.duration_minutes,
    price: s.price,
    consultation_type: s.consultation_type || "in-person",
    is_active: true,
    professional_id: proId,
    professional_user_id: userId,
  }));

  const { error: svcErr } = await supabase
    .from("services")
    .insert(servicesToInsert);
  if (svcErr) return { success: false, error: svcErr.message };

  const { error: stepErr } = await supabase
    .from("professionals")
    .update({ onboarding_step: 4 })
    .eq("id", proId);
  if (stepErr) return { success: false, error: stepErr.message };

  return { success: true };
}

export async function handleStep4(
  data: unknown,
  proId: string,
  userId: string,
  supabase: Supabase,
): Promise<ActionResult> {
  const parsed = step4Schema.safeParse(data);
  if (!parsed.success) return { success: false, error: "validation_error" };
  const d = parsed.data;

  const slotsToInsert = d.slots.map((s) => ({
    day_of_week: s.day_of_week,
    start_time: s.start_time,
    end_time: s.end_time,
    is_recurring: true,
    professional_id: proId,
    professional_user_id: userId,
  }));

  const { error: slotErr } = await supabase
    .from("availability")
    .insert(slotsToInsert);
  if (slotErr) return { success: false, error: slotErr.message };

  const { error: stepErr } = await supabase
    .from("professionals")
    .update({ onboarding_step: 5 })
    .eq("id", proId);
  if (stepErr) return { success: false, error: stepErr.message };

  return { success: true };
}

export async function handleStep5(
  data: unknown,
  proId: string,
  supabase: Supabase,
): Promise<ActionResult> {
  const parsed = step5Schema.safeParse(data);
  if (!parsed.success) return { success: false, error: "validation_error" };
  const d = parsed.data;

  const updatePayload: Record<string, unknown> = {
    cabinet_name: d.cabinet_name || null,
    address: d.address || null,
    city: d.city || null,
    postal_code: d.postal_code || null,
    onboarding_step: 6,
  };

  let geocoded = false;
  if (d.address || d.city) {
    const coords = await geocodeAddress(d.address, d.city, d.postal_code);
    if (coords) {
      updatePayload.latitude = coords.latitude;
      updatePayload.longitude = coords.longitude;
      geocoded = true;
    }
  }

  const { error } = await supabase
    .from("professionals")
    .update(updatePayload)
    .eq("id", proId);
  if (error) return { success: false, error: error.message };

  return { success: true, geocoded };
}

export async function handleStep6(
  proId: string,
  supabase: Supabase,
): Promise<ActionResult> {
  const { error } = await supabase
    .from("professionals")
    .update({ onboarding_step: 7 })
    .eq("id", proId);
  if (error) return { success: false, error: error.message };

  return { success: true };
}
