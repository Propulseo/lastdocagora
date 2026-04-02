"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ProNotification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean | null;
  related_id: string | null;
  created_at: string | null;
};

export async function getProNotifications(
  userId: string
): Promise<ProNotification[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) return [];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data } = await supabase
    .from("notifications")
    .select("id, user_id, title, message, type, is_read, related_id, created_at")
    .eq("user_id", userId)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(50);

  return (data as ProNotification[]) ?? [];
}

export async function markNotificationRead(
  notificationId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/pro");
  return { success: true };
}

export async function markAllProNotificationsRead(
  userId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) throw new Error("Non authentifié");

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw new Error(error.message);

  revalidatePath("/pro");
  return { success: true };
}
