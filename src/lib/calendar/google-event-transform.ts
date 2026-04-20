import { createClient } from "@/lib/supabase/server";
import type { GoogleEvent } from "./google-types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function processEvent(
  supabase: SupabaseServerClient,
  calendarId: string,
  professionalUserId: string,
  externalCalendarId: string,
  event: GoogleEvent
): Promise<"upserted" | "deleted" | "skipped"> {
  if (event.status === "cancelled") {
    const { count } = await supabase
      .from("external_calendar_events")
      .delete({ count: "exact" })
      .eq("calendar_id", calendarId)
      .eq("external_event_id", event.id);
    return (count ?? 0) > 0 ? "deleted" : "skipped";
  }

  if (!event.start || !event.end) return "skipped";

  const allDay = !event.start.dateTime;
  const startsAt = event.start.dateTime ?? `${event.start.date}T00:00:00Z`;
  const endsAt = event.end.dateTime ?? `${event.end.date}T23:59:59Z`;

  const { error } = await supabase.from("external_calendar_events").upsert(
    {
      calendar_id: calendarId,
      professional_user_id: professionalUserId,
      provider: "google",
      external_calendar_id: externalCalendarId,
      external_event_id: event.id,
      title: event.summary ?? "(No title)",
      description: event.description ?? null,
      location: event.location ?? null,
      organizer: event.organizer?.email ?? null,
      starts_at: startsAt,
      ends_at: endsAt,
      all_day: allDay,
      status: event.status ?? "confirmed",
      raw: JSON.parse(JSON.stringify(event)),
    },
    { onConflict: "provider,external_calendar_id,external_event_id" }
  );

  return error ? "skipped" : "upserted";
}
