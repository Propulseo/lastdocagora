"use server"

import { createClient } from "@/lib/supabase/server"

export async function updateUserLocale(locale: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from("users").update({ language: locale }).eq("id", user.id)
}
