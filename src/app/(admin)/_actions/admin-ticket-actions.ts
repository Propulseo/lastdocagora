"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "./admin-actions-helpers";

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

  if (error) return { success: false, error: error.message };

  // If admin sends a resolution message when setting awaiting_confirmation
  if (status === "awaiting_confirmation" && adminMessage?.trim()) {
    await supabase.from("ticket_messages").insert({
      ticket_id: ticketId,
      sender_id: user.id,
      content: adminMessage.trim(),
    });
  }

  // Notify the ticket owner about the status change
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("user_id, subject")
    .eq("id", ticketId)
    .single();

  if (ticket) {
    // Skip notification if user is suspended
    const { data: ticketUser } = await supabase
      .from("users")
      .select("status")
      .eq("id", ticket.user_id)
      .single();

    if (ticketUser?.status !== "suspended") {
      const isResolved = status === "awaiting_confirmation";
      const notifType = isResolved ? "ticket_resolved" : "ticket_updated";
      const notificationTitle = isResolved ? "Ticket resolved" : "Ticket updated";
      const notificationMessage = isResolved
        ? `Your ticket "${ticket.subject}" has been resolved. Please confirm.`
        : `Your ticket "${ticket.subject}" has been updated to: ${status}`;

      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: ticket.user_id,
        title: notificationTitle,
        message: notificationMessage,
        type: notifType,
        params: { subject: ticket.subject, status },
      });
      if (notifError) {
        console.error("[updateTicketStatus] Failed to insert notification:", notifError.message);
      }
    }
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

  if (error) return { success: false, error: error.message };

  // Update ticket status to in_progress if it's open or closed (reopen)
  const { data: currentTicket } = await supabase
    .from("support_tickets")
    .select("user_id, subject, status")
    .eq("id", ticketId)
    .single();

  if (currentTicket && (currentTicket.status === "open" || currentTicket.status === "closed")) {
    await supabase
      .from("support_tickets")
      .update({ status: "in_progress" })
      .eq("id", ticketId);
  }

  // Notify the ticket owner (skip if suspended)
  if (currentTicket) {
    const { data: ticketUser } = await supabase
      .from("users")
      .select("status")
      .eq("id", currentTicket.user_id)
      .single();

    if (ticketUser?.status !== "suspended") {
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: currentTicket.user_id,
        title: "New ticket reply",
        message: `Your ticket "${currentTicket.subject}" received a support reply.`,
        type: "ticket_reply",
        params: { subject: currentTicket.subject },
      });
      if (notifError) {
        console.error("[replyToTicket] Failed to insert notification:", notifError.message);
      }
    }
  }

  revalidatePath("/admin/support");
  return { success: true };
}
