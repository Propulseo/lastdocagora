"use server";

import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { geocodeAddress } from "@/app/_actions/geocode";
import { sanitizeDbError } from "@/lib/errors";

// ---------------------------------------------------------------------------
// Schemas per section
// ---------------------------------------------------------------------------

const personalSchema = z.object({
  section: z.literal("personal"),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  phone: z.string().max(30).optional().or(z.literal("")),
});

const professionalSchema = z.object({
  section: z.literal("professional"),
  specialty: z.string().max(100).optional().or(z.literal("")),
  registration_number: z.string().max(100).optional().or(z.literal("")),
  practice_type: z.string().max(50).optional().or(z.literal("")),
  cabinet_name: z.string().max(100).optional().or(z.literal("")),
  subspecialties: z.string().max(500).optional().or(z.literal("")),
  years_experience: z.number().int().nonnegative().optional(),
  bio: z.string().max(1000).optional().or(z.literal("")),
  bio_pt: z.string().max(1000).optional().or(z.literal("")),
  bio_fr: z.string().max(1000).optional().or(z.literal("")),
  bio_en: z.string().max(1000).optional().or(z.literal("")),
});

const locationSchema = z.object({
  section: z.literal("location"),
  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  postal_code: z.string().max(20).optional().or(z.literal("")),
});

const languagesSchema = z.object({
  section: z.literal("languages"),
  languages_spoken: z.string().max(500).optional().or(z.literal("")),
});

const updateProfileSchema = z.discriminatedUnion("section", [
  personalSchema,
  professionalSchema,
  locationSchema,
  languagesSchema,
]);

type ActionResult =
  | { success: true; geocoded?: boolean }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Server action
// ---------------------------------------------------------------------------

export async function updateProfile(
  input: z.input<typeof updateProfileSchema>,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || user.role !== "professional") {
    return { success: false, error: "unauthorized" };
  }

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "validation_error" };
  }

  const data = parsed.data;
  const supabase = await createClient();

  // Get professional record id
  const { data: pro } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!pro) {
    return { success: false, error: "professional_not_found" };
  }

  if (data.section === "personal") {
    const { error } = await supabase
      .from("users")
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone || null,
      })
      .eq("id", user.id);

    if (error) return { success: false, error: sanitizeDbError(error, "pro-profile") };
  }

  if (data.section === "professional") {
    // Protected fields: specialty, registration_number → admin only
    // Protected fields: practice_type, years_experience → approval required
    // These are intentionally excluded from the update payload.
    const { error } = await supabase
      .from("professionals")
      .update({
        cabinet_name: data.cabinet_name || null,
        subspecialties: data.subspecialties
          ? data.subspecialties.split(",").map((s) => s.trim()).filter(Boolean)
          : null,
        bio: data.bio || null,
        bio_pt: data.bio_pt || null,
        bio_fr: data.bio_fr || null,
        bio_en: data.bio_en || null,
      })
      .eq("id", pro.id);

    if (error) return { success: false, error: sanitizeDbError(error, "pro-profile") };
  }

  if (data.section === "location") {
    const updatePayload: Record<string, unknown> = {
      address: data.address || null,
      city: data.city || null,
      postal_code: data.postal_code || null,
    };

    let geocoded = false;
    if (data.address || data.city) {
      const coords = await geocodeAddress(data.address, data.city, data.postal_code);
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

    if (error) return { success: false, error: sanitizeDbError(error, "pro-profile") };

    revalidatePath("/pro/profile");
    return { success: true, geocoded };
  }

  if (data.section === "languages") {
    const { error } = await supabase
      .from("professionals")
      .update({
        languages_spoken: data.languages_spoken
          ? data.languages_spoken.split(",").map((s) => s.trim()).filter(Boolean)
          : null,
      })
      .eq("id", pro.id);

    if (error) return { success: false, error: sanitizeDbError(error, "pro-profile") };
  }

  revalidatePath("/pro/profile");
  return { success: true };
}
