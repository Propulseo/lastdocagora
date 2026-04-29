"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sanitizeDbError } from "@/lib/errors";

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

  const namePt = (formData.name_pt ?? formData.name).trim();

  const descPt = (formData.description_pt ?? formData.description)?.trim() || null;

  const { error } = await supabase.from("services").insert({
    name: namePt,
    name_pt: namePt,
    name_fr: formData.name_fr?.trim() || null,
    name_en: formData.name_en?.trim() || null,
    description: descPt,
    description_pt: descPt,
    description_fr: formData.description_fr?.trim() || null,
    description_en: formData.description_en?.trim() || null,
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
  }
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const namePt = (formData.name_pt ?? formData.name).trim();

  const descPt = (formData.description_pt ?? formData.description)?.trim() || null;

  const { error } = await supabase
    .from("services")
    .update({
      name: namePt,
      name_pt: namePt,
      name_fr: formData.name_fr?.trim() || null,
      name_en: formData.name_en?.trim() || null,
      description: descPt,
      description_pt: descPt,
      description_fr: formData.description_fr?.trim() || null,
      description_en: formData.description_en?.trim() || null,
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

  // 2. Check if service has linked appointments (FK constraint blocks deletion)
  const { count, error: countError } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("service_id", serviceId);

  if (countError) return { success: false, error: sanitizeDbError(countError, "pro-services") };

  if (count && count > 0) {
    return {
      success: false,
      error: `APPOINTMENTS_LINKED:${count}`,
    };
  }

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
