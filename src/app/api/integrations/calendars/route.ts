import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/integrations/calendars
 * List all calendars for the authenticated professional.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: calendars, error } = await supabase
    .from("calendar_calendars")
    .select(
      `
      id,
      external_calendar_id,
      name,
      color,
      is_primary,
      selected,
      timezone,
      connection_id,
      calendar_connections!inner (
        id,
        provider,
        account_email,
        revoked_at
      )
    `
    )
    .eq("professional_user_id", user.id)
    .is("calendar_connections.revoked_at", null)
    .order("is_primary", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ calendars });
}

/**
 * PATCH /api/integrations/calendars
 * Toggle calendar selection.
 * Body: { calendarId: string, selected: boolean }
 */
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { calendarId, selected } = body as {
    calendarId: string;
    selected: boolean;
  };

  if (!calendarId || typeof selected !== "boolean") {
    return NextResponse.json(
      { error: "calendarId and selected required" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("calendar_calendars")
    .update({ selected })
    .eq("id", calendarId)
    .eq("professional_user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
