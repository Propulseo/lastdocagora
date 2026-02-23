import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/shared/page-header"
import { SettingsForm } from "./_components/settings-form"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: settings } = await supabase
    .from("patient_settings")
    .select(
      `email_notifications, sms_notifications, appointment_reminders,
       marketing_emails, reminder_frequency, timezone, date_format,
       dark_mode, public_profile, share_medical_history`
    )
    .eq("user_id", user.id)
    .single()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerir as suas preferências e privacidade."
      />
      <SettingsForm settings={settings} userId={user.id} />
    </div>
  )
}
