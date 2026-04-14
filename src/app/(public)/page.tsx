import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LandingPage } from "./_components/landing-page"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    const role = userData?.role
    if (role === "admin") redirect("/admin/dashboard")
    if (role === "professional") redirect("/pro/dashboard")
    if (role === "patient") redirect("/patient/dashboard")
  }

  return <LandingPage />
}
