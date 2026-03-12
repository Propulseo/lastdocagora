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

  const { error } = await supabase
    .from("support_tickets")
    .update({ status })
    .eq("id", ticketId);

  if (error) return { success: false, error: error.message };
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
