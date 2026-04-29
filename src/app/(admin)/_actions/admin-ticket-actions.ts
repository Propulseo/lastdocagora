"use server";

import { revalidatePath } from "next/cache";
import { sanitizeDbError } from "@/lib/errors";
import { getAdminClient } from "./admin-actions-helpers";
import {
  createNotification,
  getRecipientLocale,
  getNotificationMessages,
} from "@/lib/notifications";

export async function updateTicketStatus(
  ticketId: string,
  status: string,
  adminMessage?: string
) {
  const supabase = await getAdminClient();
  if (!supabase) return { success: false, error: "Unauthorized" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const updateData: Record<string, string> = { status };
  if (status === "resolved") {
    updateData.resolved_at = new Date().toISOString();
  }
  if (status === "awaiting_confirmation") {
    updateData.awaiting_confirmation_at = new Date().toISOString();
  }
  if (status === "closed") {
    updateData.closed_at = new Date().toISOString();
  }

  // Warning: closing without any admin reply
  let warning: string | undefined;
  if (status === "closed") {
    const { count } = await supabase
      .from("ticket_messages")
      .select("id", { count: "exact", head: true })
      .eq("ticket_id", ticketId)
      .eq("sender_id", user.id);
    if (!count || count === 0) {
      warning = "NO_REPLY_SENT";
    }
  }

  const { error } = await supabase
    .from("support_tickets")
    .update(updateData)
    .eq("id", ticketId);

  if (error) return { success: false, error: sanitizeDbError(error, "admin-ticket-actions") };

  // If admin sends a resolution message when setting awaiting_confirmation
  if (status === "awaiting_confirmation" && adminMessage?.trim()) {
    await supabase.from("ticket_messages").insert({
      ticket_id: ticketId,
      sender_id: user.id,
      content: adminMessage.trim(),
    });
  }

  revalidatePath("/admin/support");
  return { success: true, ...(warning ? { warning } : {}) };
}

export async function replyToTicket(ticketId: string, content: string) {
  const supabase = await getAdminClient();
  if (!supabase) return { success: false, error: "Unauthorized" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const { error } = await supabase.from("ticket_messages").insert({
    ticket_id: ticketId,
    sender_id: user.id,
    content: content.trim(),
  });

  if (error) return { success: false, error: sanitizeDbError(error, "admin-ticket-actions") };

  // Update ticket status to in_progress if it's open or closed (reopen)
  const { data: currentTicket } = await supabase
    .from("support_tickets")
    .select("status")
    .eq("id", ticketId)
    .single();

  if (currentTicket && (currentTicket.status === "open" || currentTicket.status === "closed")) {
    await supabase
      .from("support_tickets")
      .update({ status: "in_progress" })
      .eq("id", ticketId);
  }

  // In-app notification to ticket owner
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("user_id")
    .eq("id", ticketId)
    .single()

  if (ticket?.user_id) {
    const recipientLocale = await getRecipientLocale(ticket.user_id)
    const msg = getNotificationMessages(recipientLocale)
    createNotification({
      userId: ticket.user_id,
      type: "support",
      title: msg.ticketReply.title,
      message: content.trim().slice(0, 120),
      link: "/pro/support",
    })
  }

  revalidatePath("/admin/support");
  return { success: true };
}
