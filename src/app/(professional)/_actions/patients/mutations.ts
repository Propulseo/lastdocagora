"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfessionalId } from "@/lib/auth";
import { sanitizeDbError } from "@/lib/errors";
import type { ActionResult } from "./types";

export async function createPatient(formData: {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data, error } = await supabase.rpc("create_patient_for_pro", {
    p_first_name: formData.first_name.trim(),
    p_last_name: formData.last_name.trim(),
    p_email: formData.email.trim(),
    p_phone: formData.phone?.trim() || undefined,
  });

  if (error) return { success: false, error: sanitizeDbError(error, "pro-patients-create") };

  const result = data as { patient_id: string; user_id: string; already_exists: boolean };

  revalidatePath("/pro/patients");
  return {
    success: true,
    data: {
      patient_id: result.patient_id,
      already_exists: result.already_exists,
    },
  };
}

export async function updatePatient(
  patientId: string,
  formData: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  }
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("patients")
    .update({
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email?.trim() || null,
      phone: formData.phone?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", patientId);

  if (error) return { success: false, error: sanitizeDbError(error, "pro-patients-update") };

  // Also update the users table to keep names in sync
  const { data: patient } = await supabase
    .from("patients")
    .select("user_id")
    .eq("id", patientId)
    .single();

  if (patient) {
    await supabase
      .from("users")
      .update({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone?.trim() || null,
      })
      .eq("id", patient.user_id);
  }

  revalidatePath("/pro/patients");
  return { success: true };
}

export async function removePatient(patientId: string): Promise<ActionResult> {
  const professionalId = await getProfessionalId();
  const supabase = await createClient();

  // Verify the patient exists and belongs to this professional
  const { data: patient } = await supabase
    .from("patients")
    .select("id, created_by_professional_id")
    .eq("id", patientId)
    .single();

  if (!patient) return { success: false, error: "patient_not_found" };

  if (patient.created_by_professional_id !== professionalId) {
    return { success: false, error: "not_owned" };
  }

  // Remove ownership link — patient record stays intact for other professionals
  const { error } = await supabase
    .from("patients")
    .update({ created_by_professional_id: null })
    .eq("id", patientId)
    .eq("created_by_professional_id", professionalId);

  if (error) {
    if (error.code === "23503") return { success: false, error: "linked_data" };
    if (error.code === "42501") return { success: false, error: "permission_denied" };
    return { success: false, error: sanitizeDbError(error, "pro-patients-remove") };
  }

  revalidatePath("/pro/patients");
  return { success: true };
}
