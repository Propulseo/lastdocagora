"use server";

import { revalidatePath } from "next/cache";
import type { VerificationStatus } from "@/types";
import { sanitizeDbError } from "@/lib/errors";
import { getAdminClient } from "./admin-actions-helpers";

export async function updateUserStatus(userId: string, status: string) {
  const supabase = await getAdminClient();
  if (!supabase) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("users")
    .update({ status })
    .eq("id", userId);

  if (error) return { success: false, error: sanitizeDbError(error, "admin-user-status") };
  revalidatePath("/admin/users");
  return { success: true };
}

const VALID_VERIFICATION_STATUSES: VerificationStatus[] = ["pending", "verified", "rejected", "suspended"];

export async function updateVerificationStatus(
  professionalId: string,
  status: string
) {
  const supabase = await getAdminClient();
  if (!supabase) return { success: false, error: "Unauthorized" };

  // Validate status enum
  if (!VALID_VERIFICATION_STATUSES.includes(status as VerificationStatus)) {
    return { success: false, error: "INVALID_STATUS" };
  }

  // If verifying, require registration_number
  if (status === "verified") {
    const { data: pro } = await supabase
      .from("professionals")
      .select("registration_number")
      .eq("id", professionalId)
      .single();
    if (!pro?.registration_number?.trim()) {
      return { success: false, error: "MISSING_REGISTRATION_NUMBER" };
    }
  }

  const { error } = await supabase
    .from("professionals")
    .update({ verification_status: status })
    .eq("id", professionalId);

  if (error) return { success: false, error: sanitizeDbError(error, "admin-user-status") };
  revalidatePath("/admin/professionals");
  return { success: true };
}
