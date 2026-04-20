"use server";

import { revalidatePath } from "next/cache";
import { getServiceRoleClient, getAdminClient } from "./admin-crud-helpers";

export async function assignTicketToSelf(ticketId: string) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  const { error } = await admin.supabase
    .from("support_tickets")
    .update({ status: "in_progress" })
    .eq("id", ticketId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/support");
  return { success: true };
}

export async function deleteTicket(ticketId: string) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  const supabaseAdmin = getServiceRoleClient();

  // Fetch ticket info for notification before deletion
  const { data: ticket } = await supabaseAdmin
    .from("support_tickets")
    .select("user_id, subject")
    .eq("id", ticketId)
    .single();

  await supabaseAdmin
    .from("ticket_messages")
    .delete()
    .eq("ticket_id", ticketId);

  const { error } = await supabaseAdmin
    .from("support_tickets")
    .delete()
    .eq("id", ticketId);

  if (error) return { success: false, error: error.message };

  // Notify the ticket creator (skip if suspended)
  if (ticket?.user_id) {
    const { data: ticketUser } = await supabaseAdmin
      .from("users")
      .select("status")
      .eq("id", ticket.user_id)
      .single();
    if (ticketUser?.status !== "suspended") {
      await supabaseAdmin.from("notifications").insert({
        user_id: ticket.user_id,
        title: "Ticket deleted",
        message: `Your ticket "${ticket.subject}" has been deleted by an administrator.`,
        type: "ticket_updated",
        params: { subject: ticket.subject },
      });
    }
  }

  revalidatePath("/admin/support");
  return { success: true };
}
