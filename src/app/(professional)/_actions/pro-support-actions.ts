"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sanitizeDbError } from "@/lib/errors";

type ActionResult =
  | { success: true; data?: Record<string, unknown> }
  | { success: false; error: string };

async function getProClient() {
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

  if (profile?.role !== "professional") return null;
  return { supabase, userId: user.id };
}

export async function createTicket(
  subject: string,
  message: string
): Promise<ActionResult> {
  const client = await getProClient();
  if (!client) return { success: false, error: "Not authorized" };

  const { supabase, userId } = client;

  const { data: ticket, error: ticketError } = await supabase
    .from("support_tickets")
    .insert({
      user_id: userId,
      subject,
      description: message,
      status: "open",
      priority: "medium",
    })
    .select("id")
    .single();

  if (ticketError || !ticket)
    return { success: false, error: ticketError?.message ?? "Failed to create ticket" };

  const { error: msgError } = await supabase.from("ticket_messages").insert({
    ticket_id: ticket.id,
    sender_id: userId,
    content: message,
  });

  if (msgError)
    return { success: false, error: msgError.message };

  revalidatePath("/pro/support");
  return { success: true };
}

export async function sendMessage(
  ticketId: string,
  content: string
): Promise<ActionResult> {
  const client = await getProClient();
  if (!client) return { success: false, error: "Not authorized" };

  const { supabase, userId } = client;

  // Verify ownership
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id")
    .eq("id", ticketId)
    .eq("user_id", userId)
    .single();

  if (!ticket) return { success: false, error: "Ticket not found" };

  const { error: msgError } = await supabase.from("ticket_messages").insert({
    ticket_id: ticketId,
    sender_id: userId,
    content,
  });

  if (msgError) return { success: false, error: msgError.message };

  await supabase
    .from("support_tickets")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", ticketId);

  revalidatePath("/pro/support");
  return { success: true };
}

export async function confirmTicketResolved(
  ticketId: string
): Promise<ActionResult> {
  const client = await getProClient();
  if (!client) return { success: false, error: "Not authorized" };

  const { supabase, userId } = client;

  // Verify ownership and status
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, status, user_id")
    .eq("id", ticketId)
    .eq("user_id", userId)
    .single();

  if (!ticket) return { success: false, error: "Ticket not found" };
  if (ticket.status !== "awaiting_confirmation")
    return { success: false, error: "Ticket is not awaiting confirmation" };

  const { error } = await supabase
    .from("support_tickets")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
    })
    .eq("id", ticketId);

  if (error) return { success: false, error: sanitizeDbError(error, "pro-support") };

  // Insert confirmation message
  await supabase.from("ticket_messages").insert({
    ticket_id: ticketId,
    sender_id: userId,
    content: "Problema confirmado como resolvido pelo utilizador.",
  });

  revalidatePath("/pro/support");
  return { success: true };
}

export async function reopenTicket(
  ticketId: string,
  reason: string
): Promise<ActionResult> {
  const client = await getProClient();
  if (!client) return { success: false, error: "Not authorized" };

  const { supabase, userId } = client;

  // Verify ownership
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, status, user_id")
    .eq("id", ticketId)
    .eq("user_id", userId)
    .single();

  if (!ticket) return { success: false, error: "Ticket not found" };

  const { error } = await supabase
    .from("support_tickets")
    .update({ status: "open" })
    .eq("id", ticketId);

  if (error) return { success: false, error: sanitizeDbError(error, "pro-support") };

  // Insert reopen message with reason
  await supabase.from("ticket_messages").insert({
    ticket_id: ticketId,
    sender_id: userId,
    content: reason.trim(),
  });

  revalidatePath("/pro/support");
  revalidatePath("/admin/support");
  return { success: true };
}
