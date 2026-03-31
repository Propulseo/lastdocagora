"use server";

import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { geocodeAddress } from "@/app/_actions/geocode";

type ActionResult =
  | { success: true; geocoded?: boolean }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getAuthenticatedProfessional() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "professional" && user.role !== "admin")) {
    return null;
  }

  const supabase = await createClient();
  const { data: pro } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!pro) return null;
  return { user, pro, supabase };
}

// ---------------------------------------------------------------------------
// Step schemas
// ---------------------------------------------------------------------------

const step1Schema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  bio: z.string().max(500).optional().or(z.literal("")),
  registration_number: z.string().min(1).max(50),
  languages_spoken: z.string().max(500).optional().or(z.literal("")),
});

const step2Schema = z.object({
  specialty: z.string().min(1).max(100),
  subspecialties: z.string().max(500).optional().or(z.literal("")),
  years_experience: z.coerce.number().int().min(0).max(80).optional(),
  practice_type: z.string().max(50).optional().or(z.literal("")),
  consultation_types: z.array(z.string()).optional(),
  consultation_fee: z.coerce.number().min(0).optional(),
  third_party_payment: z.boolean().optional(),
  insurance_provider_ids: z.array(z.string()).optional(),
});

const step3ServiceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional().or(z.literal("")),
  duration_minutes: z.coerce.number().int().min(5).max(480),
  price: z.coerce.number().min(0),
  consultation_type: z.string().optional(),
});

const step3Schema = z.object({
  services: z.array(step3ServiceSchema).min(1),
});

const step4SlotSchema = z.object({
  day_of_week: z.coerce.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
});

const step4Schema = z.object({
  slots: z.array(step4SlotSchema).min(1),
});

const step5Schema = z.object({
  cabinet_name: z.string().max(100).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  postal_code: z.string().max(20).optional().or(z.literal("")),
});

// ---------------------------------------------------------------------------
// saveOnboardingStep
// ---------------------------------------------------------------------------

export async function saveOnboardingStep(
  step: number,
  data: unknown,
): Promise<ActionResult> {
  const auth = await getAuthenticatedProfessional();
  if (!auth) return { success: false, error: "unauthorized" };

  const { user, pro, supabase } = auth;

  try {
    if (step === 1) {
      const parsed = step1Schema.safeParse(data);
      if (!parsed.success) return { success: false, error: "validation_error" };
      const d = parsed.data;

      const { error: userErr } = await supabase
        .from("users")
        .update({
          first_name: d.first_name,
          last_name: d.last_name,
        })
        .eq("id", user.id);
      if (userErr) return { success: false, error: userErr.message };

      const { error: proErr } = await supabase
        .from("professionals")
        .update({
          bio: d.bio || null,
          registration_number: d.registration_number,
          languages_spoken: d.languages_spoken
            ? d.languages_spoken.split(",").map((s) => s.trim()).filter(Boolean)
            : null,
          onboarding_step: 2,
        })
        .eq("id", pro.id);
      if (proErr) return { success: false, error: proErr.message };
    }

    if (step === 2) {
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
        .eq("id", pro.id);
      if (error) return { success: false, error: error.message };

      // Update junction table
      await supabase
        .from("professional_insurances")
        .delete()
        .eq("professional_id", pro.id);

      if (providerIds.length > 0) {
        await supabase.from("professional_insurances").insert(
          providerIds.map((pid) => ({
            professional_id: pro.id,
            insurance_provider_id: pid,
          })),
        );
      }
    }

    if (step === 3) {
      const parsed = step3Schema.safeParse(data);
      if (!parsed.success) return { success: false, error: "validation_error" };
      const d = parsed.data;

      const servicesToInsert = d.services.map((s) => ({
        name: s.name.trim(),
        description: s.description?.trim() || null,
        duration_minutes: s.duration_minutes,
        price: s.price,
        consultation_type: s.consultation_type || "in-person",
        is_active: true,
        professional_id: pro.id,
        professional_user_id: user.id,
      }));

      const { error: svcErr } = await supabase
        .from("services")
        .insert(servicesToInsert);
      if (svcErr) return { success: false, error: svcErr.message };

      const { error: stepErr } = await supabase
        .from("professionals")
        .update({ onboarding_step: 4 })
        .eq("id", pro.id);
      if (stepErr) return { success: false, error: stepErr.message };
    }

    if (step === 4) {
      const parsed = step4Schema.safeParse(data);
      if (!parsed.success) return { success: false, error: "validation_error" };
      const d = parsed.data;

      const slotsToInsert = d.slots.map((s) => ({
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        is_recurring: true,
        professional_id: pro.id,
        professional_user_id: user.id,
      }));

      const { error: slotErr } = await supabase
        .from("availability")
        .insert(slotsToInsert);
      if (slotErr) return { success: false, error: slotErr.message };

      const { error: stepErr } = await supabase
        .from("professionals")
        .update({ onboarding_step: 5 })
        .eq("id", pro.id);
      if (stepErr) return { success: false, error: stepErr.message };
    }

    if (step === 5) {
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
        .eq("id", pro.id);
      if (error) return { success: false, error: error.message };

      return { success: true, geocoded };
    }

    if (step === 6) {
      const { error } = await supabase
        .from("professionals")
        .update({ onboarding_step: 7 })
        .eq("id", pro.id);
      if (error) return { success: false, error: error.message };
    }

    revalidatePath("/pro/onboarding");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// completeOnboarding
// ---------------------------------------------------------------------------

export async function completeOnboarding(): Promise<ActionResult> {
  const auth = await getAuthenticatedProfessional();
  if (!auth) return { success: false, error: "unauthorized" };

  const { pro, supabase } = auth;

  const { error } = await supabase
    .from("professionals")
    .update({
      onboarding_completed: true,
      onboarding_step: 7,
    })
    .eq("id", pro.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/pro");
  return { success: true };
}
