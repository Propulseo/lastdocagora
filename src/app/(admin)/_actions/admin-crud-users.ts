"use server";

import { revalidatePath } from "next/cache";
import { cancelFutureAppointments } from "@/lib/admin-guards";
import { sanitizeDbError } from "@/lib/errors";
import { getServiceRoleClient, getAdminClient } from "./admin-crud-helpers";

export async function updateUserAdmin(
  userId: string,
  data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    language?: string;
    // Professional-specific
    specialty?: string;
    registration_number?: string;
    consultation_fee?: number;
    bio?: string;
    languages_spoken?: string[];
    address?: string;
    city?: string;
    postal_code?: string;
    // Patient-specific
    insurance_provider?: string;
  }
) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  const { supabase } = admin;

  // Guard: email uniqueness
  if (data.email) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", data.email)
      .neq("id", userId)
      .maybeSingle();
    if (existing) return { success: false, error: "EMAIL_ALREADY_EXISTS" };
  }

  // Update users table
  const userFields: Record<string, unknown> = {};
  if (data.first_name !== undefined) userFields.first_name = data.first_name;
  if (data.last_name !== undefined) userFields.last_name = data.last_name;
  if (data.email !== undefined) userFields.email = data.email;
  if (data.phone !== undefined) userFields.phone = data.phone;
  if (data.language !== undefined) userFields.language = data.language;

  if (Object.keys(userFields).length > 0) {
    const { error } = await supabase
      .from("users")
      .update(userFields)
      .eq("id", userId);
    if (error) return { success: false, error: sanitizeDbError(error, "admin-users") };
  }

  // Check role for role-specific updates
  const { data: userRecord } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (userRecord?.role === "professional") {
    const proFields: Record<string, unknown> = {};
    if (data.specialty !== undefined) proFields.specialty = data.specialty;
    if (data.registration_number !== undefined)
      proFields.registration_number = data.registration_number;
    if (data.consultation_fee !== undefined)
      proFields.consultation_fee = data.consultation_fee;
    if (data.bio !== undefined) proFields.bio = data.bio;
    if (data.languages_spoken !== undefined)
      proFields.languages_spoken = data.languages_spoken;
    if (data.address !== undefined) proFields.address = data.address;
    if (data.city !== undefined) proFields.city = data.city;
    if (data.postal_code !== undefined) proFields.postal_code = data.postal_code;

    if (Object.keys(proFields).length > 0) {
      const { error } = await supabase
        .from("professionals")
        .update(proFields)
        .eq("user_id", userId);
      if (error) return { success: false, error: sanitizeDbError(error, "admin-users") };
    }
  }

  if (userRecord?.role === "patient") {
    const patientFields: Record<string, unknown> = {};
    if (data.insurance_provider !== undefined)
      patientFields.insurance_provider = data.insurance_provider;
    if (data.phone !== undefined) patientFields.phone = data.phone;
    if (data.address !== undefined) patientFields.address = data.address;
    if (data.city !== undefined) patientFields.city = data.city;

    if (Object.keys(patientFields).length > 0) {
      const { error } = await supabase
        .from("patients")
        .update(patientFields)
        .eq("user_id", userId);
      if (error) return { success: false, error: sanitizeDbError(error, "admin-users") };
    }
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function banUser(userId: string) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  if (userId === admin.user.id)
    return { success: false, error: "cannot_ban_self" };

  const supabaseAdmin = getServiceRoleClient();

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { ban_duration: "876600h" }
  );
  if (authError) return { success: false, error: sanitizeDbError(authError, "admin-users-auth") };

  const { error } = await supabaseAdmin
    .from("users")
    .update({ status: "suspended" })
    .eq("id", userId);
  if (error) return { success: false, error: sanitizeDbError(error, "admin-users") };

  // Cascade: cancel future appointments for this user
  const { data: patientRecord } = await supabaseAdmin
    .from("patients")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (patientRecord) {
    await cancelFutureAppointments(
      "patient", patientRecord.id, supabaseAdmin,
      "Patient account suspended — appointment cancelled."
    );
  }
  const { data: proRecord } = await supabaseAdmin
    .from("professionals")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (proRecord) {
    await cancelFutureAppointments(
      "professional", proRecord.id, supabaseAdmin,
      "Professional account suspended — appointment cancelled."
    );
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function unbanUser(userId: string) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  const supabaseAdmin = getServiceRoleClient();

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { ban_duration: "none" }
  );
  if (authError) return { success: false, error: sanitizeDbError(authError, "admin-users-auth") };

  const { error } = await supabaseAdmin
    .from("users")
    .update({ status: "active" })
    .eq("id", userId);
  if (error) return { success: false, error: sanitizeDbError(error, "admin-users") };

  revalidatePath("/admin/users");
  return { success: true };
}

export async function getAdminSearchResults(query: string) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado", data: [] };

  if (!query || query.trim().length < 2)
    return { success: true, data: [] };

  const search = query.trim();

  const { data, error } = await admin.supabase
    .from("users")
    .select("id, first_name, last_name, email, role, status, avatar_url")
    .or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
    )
    .order("first_name")
    .limit(10);

  if (error) return { success: false, error: sanitizeDbError(error, "admin-search"), data: [] };
  return { success: true, data: data ?? [] };
}
