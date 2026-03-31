"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
