"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sanitizeDbError } from "@/lib/errors";
import { translateService } from "@/lib/ai/translate-service";

type ActionResult =
  | { success: true; data?: Record<string, unknown> }
  | { success: false; error: string };

export async function createService(formData: {
  name: string;
  name_pt?: string | null;
  name_fr?: string | null;
  name_en?: string | null;
  description?: string;
  description_pt?: string | null;
  description_fr?: string | null;
  description_en?: string | null;
  duration_minutes: number;
  is_active: boolean;
  price?: number | null;
  sourceLocale?: "pt" | "fr" | "en";
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) return { success: false, error: "Professional not found" };

  const sourceLocale = formData.sourceLocale ?? "pt";
  const sourceName = formData.name.trim();
  const sourceDescription = formData.description?.trim() || null;

  // Manual values provided by the pro (these always win over translations)
  const manualNamePt = formData.name_pt?.trim() || null;
  const manualNameFr = formData.name_fr?.trim() || null;
  const manualNameEn = formData.name_en?.trim() || null;
  const manualDescPt = formData.description_pt?.trim() || null;
  const manualDescFr = formData.description_fr?.trim() || null;
  const manualDescEn = formData.description_en?.trim() || null;

  // Auto-translate missing locale columns
  const translations = await translateService({
    name: sourceName,
    description: sourceDescription,
    sourceLocale,
  });

  // Build locale columns: source locale uses formData.name, others use manual > translation > null
  const namePt =
    sourceLocale === "pt"
      ? sourceName
      : manualNamePt ?? translations?.name_pt ?? null;
  const nameFr =
    sourceLocale === "fr"
      ? sourceName
      : manualNameFr ?? translations?.name_fr ?? null;
  const nameEn =
    sourceLocale === "en"
      ? sourceName
      : manualNameEn ?? translations?.name_en ?? null;

  const descPt =
    sourceLocale === "pt"
      ? sourceDescription
      : manualDescPt ?? translations?.description_pt ?? null;
  const descFr =
    sourceLocale === "fr"
      ? sourceDescription
      : manualDescFr ?? translations?.description_fr ?? null;
  const descEn =
    sourceLocale === "en"
      ? sourceDescription
      : manualDescEn ?? translations?.description_en ?? null;

  // "name" column (legacy fallback) always uses PT value or source name
  const nameDefault = namePt ?? sourceName;

  const { error } = await supabase.from("services").insert({
    name: nameDefault,
    name_pt: namePt,
    name_fr: nameFr,
    name_en: nameEn,
    description: descPt,
    description_pt: descPt,
    description_fr: descFr,
    description_en: descEn,
    duration_minutes: formData.duration_minutes,
    is_active: formData.is_active,
    price: formData.price ?? 0,
    consultation_type: "in-person",
    professional_id: professional.id,
    professional_user_id: user.id,
  });

  if (error) return { success: false, error: sanitizeDbError(error, "pro-services") };

  revalidatePath("/pro/services");
  return { success: true };
}

export async function updateService(
  serviceId: string,
  formData: {
    name: string;
    name_pt?: string | null;
    name_fr?: string | null;
    name_en?: string | null;
    description?: string;
    description_pt?: string | null;
    description_fr?: string | null;
    description_en?: string | null;
    duration_minutes: number;
    is_active: boolean;
    price?: number | null;
    sourceLocale?: "pt" | "fr" | "en";
  }
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const sourceLocale = formData.sourceLocale ?? "pt";
  const sourceName = formData.name.trim();
  const sourceDescription = formData.description?.trim() || null;

  // Manual values provided by the pro (these always win over translations)
  const manualNamePt = formData.name_pt?.trim() || null;
  const manualNameFr = formData.name_fr?.trim() || null;
  const manualNameEn = formData.name_en?.trim() || null;
  const manualDescPt = formData.description_pt?.trim() || null;
  const manualDescFr = formData.description_fr?.trim() || null;
  const manualDescEn = formData.description_en?.trim() || null;

  // Auto-translate missing locale columns
  const translations = await translateService({
    name: sourceName,
    description: sourceDescription,
    sourceLocale,
  });

  // Build locale columns: source locale uses formData.name, others use manual > translation > null
  const namePt =
    sourceLocale === "pt"
      ? sourceName
      : manualNamePt ?? translations?.name_pt ?? null;
  const nameFr =
    sourceLocale === "fr"
      ? sourceName
      : manualNameFr ?? translations?.name_fr ?? null;
  const nameEn =
    sourceLocale === "en"
      ? sourceName
      : manualNameEn ?? translations?.name_en ?? null;

  const descPt =
    sourceLocale === "pt"
      ? sourceDescription
      : manualDescPt ?? translations?.description_pt ?? null;
  const descFr =
    sourceLocale === "fr"
      ? sourceDescription
      : manualDescFr ?? translations?.description_fr ?? null;
  const descEn =
    sourceLocale === "en"
      ? sourceDescription
      : manualDescEn ?? translations?.description_en ?? null;

  // "name" column (legacy fallback) always uses PT value or source name
  const nameDefault = namePt ?? sourceName;

  const { error } = await supabase
    .from("services")
    .update({
      name: nameDefault,
      name_pt: namePt,
      name_fr: nameFr,
      name_en: nameEn,
      description: descPt,
      description_pt: descPt,
      description_fr: descFr,
      description_en: descEn,
      duration_minutes: formData.duration_minutes,
      is_active: formData.is_active,
      price: formData.price ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", serviceId)
    .eq("professional_user_id", user.id);

  if (error) return { success: false, error: sanitizeDbError(error, "pro-services") };

  revalidatePath("/pro/services");
  return { success: true };
}

export async function getServiceLinkedCount(serviceId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("service_id", serviceId);
  return count ?? 0;
}

export async function deleteService(serviceId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // 1. Verify the service exists and belongs to this pro
  const { data: service } = await supabase
    .from("services")
    .select("id, professional_id")
    .eq("id", serviceId)
    .eq("professional_user_id", user.id)
    .single();

  if (!service) return { success: false, error: "Service not found" };

  // 2. Unlink appointments that reference this service
  await supabase
    .from("appointments")
    .update({ service_id: null })
    .eq("service_id", serviceId);

  // 3. Delete
  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId)
    .eq("professional_user_id", user.id);

  if (error) return { success: false, error: sanitizeDbError(error, "pro-services") };

  revalidatePath("/pro/services");
  return { success: true };
}

export async function deactivateService(
  serviceId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("services")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", serviceId)
    .eq("professional_user_id", user.id);

  if (error) return { success: false, error: sanitizeDbError(error, "pro-services") };

  revalidatePath("/pro/services");
  return { success: true };
}
