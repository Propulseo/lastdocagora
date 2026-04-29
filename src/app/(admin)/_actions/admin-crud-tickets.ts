"use server";

import { revalidatePath } from "next/cache";
import { sanitizeDbError } from "@/lib/errors";
import { getServiceRoleClient, getAdminClient } from "./admin-crud-helpers";

export async function assignTicketToSelf(ticketId: string) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  const { error } = await admin.supabase
    .from("support_tickets")
    .update({ status: "in_progress" })
    .eq("id", ticketId);

  if (error) return { success: false, error: sanitizeDbError(error, "admin-tickets") };
  revalidatePath("/admin/support");
  return { success: true };
}

export async function deleteTicket(ticketId: string) {
  const admin = await getAdminClient();
  if (!admin) return { success: false, error: "Nao autorizado" };

  const supabaseAdmin = getServiceRoleClient();

  await supabaseAdmin
    .from("ticket_messages")
    .delete()
    .eq("ticket_id", ticketId);

  const { error } = await supabaseAdmin
    .from("support_tickets")
    .delete()
    .eq("id", ticketId);

  if (error) return { success: false, error: sanitizeDbError(error, "admin-tickets") };

  revalidatePath("/admin/support");
  return { success: true };
}
