import { createClient } from "@/lib/supabase/server";
import { getCalendarConfig } from "@/lib/calendar/config";
import { getValidAccessToken } from "./google-token";
import { processEvent } from "./google-event-transform";
import type { GoogleEventsResponse, SyncResult } from "./google-types";

export type { SyncResult } from "./google-types";

const GOOGLE_EVENTS_URL =
  "https://www.googleapis.com/calendar/v3/calendars";

/**
 * Sync events from a single Google calendar.
 * Uses incremental sync via syncToken when available.
 */
export async function syncGoogleCalendar(
  calendarId: string
): Promise<SyncResult> {
  const config = await getCalendarConfig();
  if (!config) {
    return { upserted: 0, deleted: 0, error: "Calendar not configured" };
  }

  const supabase = await createClient();

  const { data: calendar } = await supabase
    .from("calendar_calendars")
    .select(
      `id, external_calendar_id, connection_id, professional_user_id,
       calendar_connections!inner (
         id, access_token_encrypted, refresh_token_encrypted, expires_at, revoked_at
       )`
    )
    .eq("id", calendarId)
    .single();

  if (!calendar) {
    return { upserted: 0, deleted: 0, error: "Calendar not found" };
  }

  const conn = calendar.calendar_connections as unknown as {
    id: string;
    access_token_encrypted: string;
    refresh_token_encrypted: string;
    expires_at: string;
    revoked_at: string | null;
  };

  if (conn.revoked_at) {
    return { upserted: 0, deleted: 0, error: "Connection revoked" };
  }

  const accessToken = await getValidAccessToken(conn, config);
  if (!accessToken) {
    await supabase.from("calendar_sync_state").upsert(
      {
        calendar_id: calendarId,
        professional_user_id: calendar.professional_user_id,
        provider: "google",
        last_error: "Failed to get valid access token",
      },
      { onConflict: "calendar_id" }
    );
    return { upserted: 0, deleted: 0, error: "Token refresh failed" };
  }

  // Get existing sync state
  const { data: syncState } = await supabase
    .from("calendar_sync_state")
    .select("sync_token")
    .eq("calendar_id", calendarId)
    .single();

  let upserted = 0;
  let deleted = 0;
  let pageToken: string | undefined;
  let newSyncToken: string | undefined;

  try {
    do {
      const params = new URLSearchParams({
        maxResults: "250",
        singleEvents: "true",
      });

      if (syncState?.sync_token) {
        params.set("syncToken", syncState.sync_token);
      } else {
        const timeMin = new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString();
        params.set("timeMin", timeMin);
      }

      if (pageToken) params.set("pageToken", pageToken);

      const eventsUrl = `${GOOGLE_EVENTS_URL}/${encodeURIComponent(
        calendar.external_calendar_id
      )}/events?${params.toString()}`;

      const res = await fetch(eventsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.status === 410) {
        // Sync token expired — clear and retry full sync
        await supabase.from("calendar_sync_state").upsert(
          {
            calendar_id: calendarId,
            professional_user_id: calendar.professional_user_id,
            provider: "google",
            sync_token: null,
            last_error: null,
          },
          { onConflict: "calendar_id" }
        );
        await supabase
          .from("external_calendar_events")
          .delete()
          .eq("calendar_id", calendarId);
        return syncGoogleCalendar(calendarId);
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Google API error ${res.status}: ${errText}`);
      }

      const data: GoogleEventsResponse = await res.json();

      if (data.items) {
        for (const event of data.items) {
          const result = await processEvent(
            supabase,
            calendarId,
            calendar.professional_user_id,
            calendar.external_calendar_id,
            event
          );
          if (result === "upserted") upserted++;
          else if (result === "deleted") deleted++;
        }
      }

      pageToken = data.nextPageToken;
      if (data.nextSyncToken) newSyncToken = data.nextSyncToken;
    } while (pageToken);

    // Save sync state
    await supabase.from("calendar_sync_state").upsert(
      {
        calendar_id: calendarId,
        professional_user_id: calendar.professional_user_id,
        provider: "google",
        sync_token: newSyncToken ?? syncState?.sync_token ?? null,
        last_sync_at: new Date().toISOString(),
        last_error: null,
      },
      { onConflict: "calendar_id" }
    );

    return { upserted, deleted };
  } catch (err) {
    const errorCode = err instanceof Error ? err.message : "sync_failed";
    console.error(`Sync error for calendar ${calendarId}:`, errorCode);

    await supabase.from("calendar_sync_state").upsert(
      {
        calendar_id: calendarId,
        professional_user_id: calendar.professional_user_id,
        provider: "google",
        last_error: "sync_failed",
      },
      { onConflict: "calendar_id" }
    );

    return { upserted, deleted, error: "sync_failed" };
  }
}

/**
 * Sync all selected calendars for a professional.
 */
export async function syncAllGoogleCalendars(
  professionalUserId: string
): Promise<SyncResult[]> {
  const supabase = await createClient();

  const { data: calendars } = await supabase
    .from("calendar_calendars")
    .select("id, connection_id, calendar_connections!inner(revoked_at)")
    .eq("professional_user_id", professionalUserId)
    .eq("selected", true)
    .is("calendar_connections.revoked_at", null);

  if (!calendars || calendars.length === 0) return [];

  const results: SyncResult[] = [];
  for (const cal of calendars) {
    const result = await syncGoogleCalendar(cal.id);
    results.push(result);
  }

  return results;
}
