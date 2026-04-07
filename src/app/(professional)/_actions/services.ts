"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult =
  | { success: true; data?: Record<string, unknown> }
  | { success: false; error: string };

export async function createService(formData: {
  name: string;
  name_pt?: string | null;
  name_fr?: string | null;
  name_en?: string | null;
  description?: string;
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

  const { error } = await supabase.from("services").insert({
    name: namePt,
    name_pt: namePt,
    name_fr: formData.name_fr?.trim() || null,
    name_en: formData.name_en?.trim() || null,
    description: formData.description?.trim() || null,
    duration_minutes: formData.duration_minutes,
    is_active: formData.is_active,
    price: formData.price ?? 0,
    consultation_type: "in-person",
    professional_id: professional.id,
    professional_user_id: user.id,
  });

  if (error) return { success: false, error: error.message };

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

  const { error } = await supabase
    .from("services")
    .update({
      name: namePt,
      name_pt: namePt,
      name_fr: formData.name_fr?.trim() || null,
      name_en: formData.name_en?.trim() || null,
      description: formData.description?.trim() || null,
      duration_minutes: formData.duration_minutes,
      is_active: formData.is_active,
      price: formData.price ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", serviceId)
    .eq("professional_user_id", user.id);

  if (error) return { success: false, error: error.message };

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

  if (countError) return { success: false, error: countError.message };

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

  if (error) return { success: false, error: error.message };

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

  if (error) return { success: false, error: error.message };

  revalidatePath("/pro/services");
  return { success: true };
}
