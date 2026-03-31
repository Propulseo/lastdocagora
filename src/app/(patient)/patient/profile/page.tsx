import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { ProfileClient } from "./_components/ProfileClient"

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const supabase = await createClient()

  const [{ data: profile }, { data: patient }] = await Promise.all([
    supabase
      .from("users")
      .select("first_name, last_name, email, phone, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("patients")
      .select(
        `first_name, last_name, email, phone, date_of_birth, address, city,
         postal_code, gender, avatar_url, languages_spoken, insurance_provider,
         insurance_provider_id, insurance_number,
         emergency_contact_name, emergency_contact_phone,
         emergency_contact_relationship`
      )
      .eq("user_id", user.id)
      .single(),
  ])

  return (
    <ProfileClient
      profile={profile}
      patient={patient}
      userId={user.id}
      userEmail={user.email}
    />
  )
}
