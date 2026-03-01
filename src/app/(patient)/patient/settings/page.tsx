import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { PatientPageHeader } from "../../_components/patient-page-header"
import { SettingsForm } from "./_components/settings-form"

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const supabase = await createClient()

  const { data: settings } = await supabase
    .from("patient_settings")
    .select(
      `email_notifications, sms_notifications, appointment_reminders,
       marketing_emails, reminder_frequency, timezone, date_format,
       dark_mode, public_profile`
    )
    .eq("user_id", user.id)
    .single()

  return (
    <div className="space-y-6">
      <PatientPageHeader section="settings" />
      <SettingsForm settings={settings} userId={user.id} />
    </div>
  )
}
