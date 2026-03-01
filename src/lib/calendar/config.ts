import { createClient } from "@/lib/supabase/server";

export interface CalendarConfig {
  googleClientId: string;
  googleClientSecret: string;
  encryptionKey: string;
  appUrl: string;
}

/**
 * Reads Google Calendar config from system_settings (admin panel),
 * with fallback to environment variables.
 */
export async function getCalendarConfig(): Promise<CalendarConfig | null> {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("system_settings")
    .select("setting_key, setting_value")
    .in("setting_key", [
      "google_client_id",
      "google_client_secret",
      "google_calendar_encryption_key",
    ]);

  const map = new Map(
    (settings ?? []).map((s) => [s.setting_key, s.setting_value as string])
  );

  const googleClientId =
    map.get("google_client_id") || process.env.GOOGLE_CLIENT_ID || "";
  const googleClientSecret =
    map.get("google_client_secret") || process.env.GOOGLE_CLIENT_SECRET || "";
  const encryptionKey =
    map.get("google_calendar_encryption_key") ||
    process.env.CALENDAR_ENCRYPTION_KEY ||
    "";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  if (!googleClientId || !googleClientSecret || !encryptionKey || !appUrl) {
    return null;
  }

  return { googleClientId, googleClientSecret, encryptionKey, appUrl };
}
