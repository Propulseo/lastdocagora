"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

type ActionResult = { success: true } | { success: false; error: string };

export type InsuranceProvider = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  display_order: number;
};

export async function getInsuranceProviders(): Promise<InsuranceProvider[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("insurance_providers")
    .select("id, name, slug, logo_url, is_active, display_order")
    .eq("is_active", true)
    .order("display_order");
  return (data ?? []) as InsuranceProvider[];
}

export async function updateProfessionalInsurances(
  providerIds: string[],
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "professional" && user.role !== "admin")) {
    return { success: false, error: "unauthorized" };
  }

  const supabase = await createClient();

  const { data: pro } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!pro) return { success: false, error: "professional_not_found" };

  // Delete existing
  await supabase
    .from("professional_insurances")
    .delete()
    .eq("professional_id", pro.id);

  // Insert new rows
  if (providerIds.length > 0) {
    const rows = providerIds.map((pid) => ({
      professional_id: pro.id,
      insurance_provider_id: pid,
    }));
    const { error: insErr } = await supabase
      .from("professional_insurances")
      .insert(rows);
    if (insErr) return { success: false, error: insErr.message };
  }

  // Backward compat: update legacy insurances_accepted array
  if (providerIds.length > 0) {
    const { data: providers } = await supabase
      .from("insurance_providers")
      .select("name")
      .in("id", providerIds);
    const names = (providers ?? []).map((p) => p.name);
    await supabase
      .from("professionals")
      .update({ insurances_accepted: names })
      .eq("id", pro.id);
  } else {
    await supabase
      .from("professionals")
      .update({ insurances_accepted: null })
      .eq("id", pro.id);
  }

  revalidatePath("/pro/profile");
  return { success: true };
}
