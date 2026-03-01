import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getProfessionalId } from "@/lib/auth";
import { SettingsClient } from "./_components/SettingsClient";

export default async function SettingsPage() {
  // Validate professional exists + get user.id for settings query
  const [user, _professionalId] = await Promise.all([
    getCurrentUser(),
    getProfessionalId(),
  ]);

  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("professional_settings")
    .select("*")
    .eq("user_id", user!.id)
    .single();

  const currentSettings = {
    auto_confirm: settings?.auto_confirm ?? false,
    notify_new_appointments: settings?.notify_new_appointments ?? true,
    notify_cancellations: settings?.notify_cancellations ?? true,
    notify_reminders: settings?.notify_reminders ?? true,
    patient_reminders: settings?.patient_reminders ?? true,
    channel_email: settings?.channel_email ?? true,
    channel_sms: settings?.channel_sms ?? false,
    default_duration_minutes: settings?.default_duration_minutes ?? 30,
    min_booking_hours: settings?.min_booking_hours ?? 24,
  };

  return <SettingsClient settings={currentSettings} />;
}
