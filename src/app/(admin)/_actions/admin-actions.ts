"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getServiceRoleClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") return null;
  return supabase;
}

export async function updateUserStatus(userId: string, status: string) {
  const supabase = await getAdminClient();
  if (!supabase) return { success: false, error: "Nao autorizado" };

  const { error } = await supabase
    .from("users")
    .update({ status })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/users");
  return { success: true };
}

export async function updateVerificationStatus(
  professionalId: string,
  status: string
) {
  const supabase = await getAdminClient();
  if (!supabase) return { success: false, error: "Nao autorizado" };

  const { error } = await supabase
    .from("professionals")
    .update({ verification_status: status })
    .eq("id", professionalId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/professionals");
  return { success: true };
}

export async function updateTicketStatus(ticketId: string, status: string) {
  const supabase = await getAdminClient();
  if (!supabase) return { success: false, error: "Nao autorizado" };

  const updateData: Record<string, string> = { status };
  if (status === "resolved") {
    updateData.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("support_tickets")
    .update(updateData)
    .eq("id", ticketId);

  if (error) return { success: false, error: error.message };

  // Notify the ticket owner about the status change
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("user_id, subject")
    .eq("id", ticketId)
    .single();

  if (ticket) {
    await supabase.from("notifications").insert({
      user_id: ticket.user_id,
      title: "Ticket atualizado",
      message: `O seu ticket "${ticket.subject}" foi atualizado para: ${status}`,
      type: "system",
    });
  }

  revalidatePath("/admin/support");
  return { success: true };
}

export async function replyToTicket(ticketId: string, content: string) {
  const supabase = await getAdminClient();
  if (!supabase) return { success: false, error: "Nao autorizado" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Nao autorizado" };

  const { error } = await supabase.from("ticket_messages").insert({
    ticket_id: ticketId,
    sender_id: user.id,
    content: content.trim(),
  });

  if (error) return { success: false, error: error.message };

  // Update ticket status to in_progress if it's open
  await supabase
    .from("support_tickets")
    .update({ status: "in_progress" })
    .eq("id", ticketId)
    .eq("status", "open");

  // Notify the ticket owner
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("user_id, subject")
    .eq("id", ticketId)
    .single();

  if (ticket) {
    await supabase.from("notifications").insert({
      user_id: ticket.user_id,
      title: "Nova resposta ao ticket",
      message: `O seu ticket "${ticket.subject}" recebeu uma resposta do suporte.`,
      type: "system",
    });
  }

  revalidatePath("/admin/support");
  return { success: true };
}

export async function updateSystemSetting(settingId: string, value: string) {
  const supabase = await getAdminClient();
  if (!supabase) return { success: false, error: "Nao autorizado" };

  const { error } = await supabase
    .from("system_settings")
    .update({ setting_value: value })
    .eq("id", settingId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function cancelAppointment(appointmentId: string) {
  const supabase = await getAdminClient();
  if (!supabase) return { success: false, error: "Nao autorizado" };

  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/appointments");
  return { success: true };
}

export async function toggleContentPublished(
  type: "page" | "faq",
  id: string,
  published: boolean
) {
  const supabase = await getAdminClient();
  if (!supabase) return { success: false, error: "Nao autorizado" };

  const table = type === "page" ? "content_pages" : "faqs";
  const { error } = await supabase
    .from(table)
    .update({ is_published: published })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/content");
  return { success: true };
}

export async function deleteUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Verify admin
  const supabase = await getAdminClient();
  if (!supabase) return { success: false, error: "Nao autorizado" };

  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();
  if (!adminUser) return { success: false, error: "Nao autorizado" };

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

  try {
    // --- Patient cleanup ---
    if (patientRecord) {
      const pid = patientRecord.id;
      await supabaseAdmin.from("patient_favorites").delete().eq("patient_id", pid);
      await supabaseAdmin.from("reviews").delete().eq("patient_id", pid);
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
      return { success: false, error: authError.message };
    }

    revalidatePath("/admin/users");
    revalidatePath("/admin/professionals");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
