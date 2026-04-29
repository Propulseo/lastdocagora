"use server";

import { revalidatePath } from "next/cache";
import { hasFutureAppointments } from "@/lib/admin-guards";
import { sanitizeDbError } from "@/lib/errors";
import { getServiceRoleClient, getAdminClient } from "./admin-actions-helpers";

export async function updateSystemSetting(settingId: string, value: string) {
  const supabase = await getAdminClient();
  if (!supabase) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("system_settings")
    .update({ setting_value: value })
    .eq("id", settingId);

  if (error) return { success: false, error: sanitizeDbError(error, "admin-delete") };
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function cancelAppointment(appointmentId: string) {
  const supabase = await getAdminClient();
  if (!supabase) return { success: false, error: "Unauthorized" };

  // Fetch current status
  const { data: appt } = await supabase
    .from("appointments")
    .select("status")
    .eq("id", appointmentId)
    .single();

  if (!appt) return { success: false, error: "Appointment not found" };

  // Guard: only pending or confirmed can be cancelled
  if (!["pending", "confirmed"].includes(appt.status)) {
    return { success: false, error: "APPOINTMENT_CANCEL_BLOCKED" };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled", cancelled_at: now, updated_at: now })
    .eq("id", appointmentId);

  if (error) return { success: false, error: sanitizeDbError(error, "admin-delete") };

  revalidatePath("/admin/appointments");
  return { success: true };
}

export async function toggleContentPublished(
  type: "page" | "faq",
  id: string,
  published: boolean
) {
  const supabase = await getAdminClient();
  if (!supabase) return { success: false, error: "Unauthorized" };

  const table = type === "page" ? "content_pages" : "faqs";
  const { error } = await supabase
    .from(table)
    .update({ is_published: published })
    .eq("id", id);

  if (error) return { success: false, error: sanitizeDbError(error, "admin-delete") };
  revalidatePath("/admin/content");
  return { success: true };
}

export async function deleteUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Verify admin
  const supabase = await getAdminClient();
  if (!supabase) return { success: false, error: "Unauthorized" };

  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();
  if (!adminUser) return { success: false, error: "Unauthorized" };

  // 2. Guard self-deletion
  if (userId === adminUser.id) {
    return { success: false, error: "self_deletion" };
  }

  // 3. Service role client (bypass RLS + auth.admin)
  const supabaseAdmin = getServiceRoleClient();

  // 4. Lookup user role
  const { data: userRecord } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();
  if (!userRecord) return { success: false, error: "User not found" };

  // Guard: cannot delete the last admin
  if (userRecord.role === "admin") {
    const { count } = await supabaseAdmin
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) <= 1) {
      return { success: false, error: "LAST_ADMIN" };
    }
  }

  // 5. Lookup patient / professional IDs
  const { data: patientRecord } = await supabaseAdmin
    .from("patients")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: proRecord } = await supabaseAdmin
    .from("professionals")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  // Guard: block deletion if user has future pending/confirmed appointments
  if (patientRecord) {
    const hasFuture = await hasFutureAppointments("patient", patientRecord.id, supabaseAdmin);
    if (hasFuture) return { success: false, error: "HAS_FUTURE_APPOINTMENTS" };
  }
  if (proRecord) {
    const hasFuture = await hasFutureAppointments("professional", proRecord.id, supabaseAdmin);
    if (hasFuture) return { success: false, error: "HAS_FUTURE_APPOINTMENTS" };
  }

  try {
    // --- Patient cleanup ---
    if (patientRecord) {
      const pid = patientRecord.id;
      await supabaseAdmin.from("patient_favorites").delete().eq("patient_id", pid);
      // Anonymize approved reviews instead of deleting (RGPD — preserve professional ratings)
      await supabaseAdmin
        .from("reviews")
        .update({ is_anonymous: true, patient_id: null, patient_user_id: null, updated_at: new Date().toISOString() })
        .eq("patient_id", pid)
        .eq("status", "approved");
      // Delete non-approved reviews (pending/rejected have no public value)
      await supabaseAdmin
        .from("reviews")
        .delete()
        .eq("patient_id", pid);
      await supabaseAdmin.from("payments").delete().eq("patient_id", pid);
      await supabaseAdmin.from("documents").delete().eq("patient_id", pid);
      await supabaseAdmin
        .from("appointments")
        .update({ patient_id: null })
        .eq("patient_id", pid);
      await supabaseAdmin.from("patients").delete().eq("id", pid);
    }

    // --- Professional cleanup ---
    if (proRecord) {
      const profId = proRecord.id;
      await supabaseAdmin.from("appointment_attendance").delete().eq("professional_id", profId);
      await supabaseAdmin.from("appointment_notifications").delete().eq("professional_id", profId);
      await supabaseAdmin.from("appointment_ratings").delete().eq("professional_id", profId);
      await supabaseAdmin
        .from("appointments")
        .update({ professional_id: null })
        .eq("professional_id", profId);
      await supabaseAdmin.from("availability").delete().eq("professional_id", profId);
      await supabaseAdmin.from("calendar_connections").delete().eq("professional_id", profId);
      await supabaseAdmin.from("reminder_rules").delete().eq("professional_id", profId);
      await supabaseAdmin.from("message_templates").delete().eq("professional_id", profId);
      await supabaseAdmin.from("professional_insurances").delete().eq("professional_id", profId);
      await supabaseAdmin.from("patient_favorites").delete().eq("professional_id", profId);
      await supabaseAdmin.from("reviews").delete().eq("professional_id", profId);
      await supabaseAdmin.from("payments").delete().eq("professional_id", profId);
      await supabaseAdmin.from("documents").delete().eq("professional_id", profId);
      await supabaseAdmin.from("services").delete().eq("professional_id", profId);
      await supabaseAdmin
        .from("patients")
        .update({ created_by_professional_id: null })
        .eq("created_by_professional_id", profId);
      await supabaseAdmin.from("professionals").delete().eq("id", profId);
    }

    // --- Common cleanup (all roles) ---
    // Delete ticket messages sent by this user
    await supabaseAdmin.from("ticket_messages").delete().eq("sender_id", userId);
    // Delete ticket messages on tickets owned by this user
    const { data: userTickets } = await supabaseAdmin
      .from("support_tickets")
      .select("id")
      .eq("user_id", userId);
    if (userTickets && userTickets.length > 0) {
      const ticketIds = userTickets.map((t) => t.id);
      await supabaseAdmin.from("ticket_messages").delete().in("ticket_id", ticketIds);
    }
    await supabaseAdmin.from("support_tickets").delete().eq("user_id", userId);
    await supabaseAdmin.from("notifications").delete().eq("user_id", userId);
    await supabaseAdmin.from("patient_settings").delete().eq("user_id", userId);
    await supabaseAdmin.from("professional_settings").delete().eq("user_id", userId);
    await supabaseAdmin.from("users").delete().eq("id", userId);

    // Delete from auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      return { success: false, error: sanitizeDbError(authError, "admin-delete-auth") };
    }

    revalidatePath("/admin/users");
    revalidatePath("/admin/professionals");
    return { success: true };
  } catch {
    return { success: false, error: "operation_failed" };
  }
}
