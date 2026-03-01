import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/integrations/connections
 * List all calendar connections for the authenticated professional.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: connections, error } = await supabase
    .from("calendar_connections")
    .select("id, provider, account_email, created_at, revoked_at")
    .eq("professional_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ connections });
}

/**
 * DELETE /api/integrations/connections
 * Revoke a calendar connection (soft-delete via revoked_at).
 * Body: { connectionId: string }
 */
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const connectionId = body.connectionId as string;

  if (!connectionId) {
    return NextResponse.json(
      { error: "connectionId required" },
      { status: 400 }
    );
  }

  // Verify ownership and revoke
  const { error } = await supabase
    .from("calendar_connections")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", connectionId)
    .eq("professional_user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Delete associated external events
  const { data: calendars } = await supabase
    .from("calendar_calendars")
    .select("id")
    .eq("connection_id", connectionId);

  if (calendars) {
    for (const cal of calendars) {
      await supabase
        .from("external_calendar_events")
        .delete()
        .eq("calendar_id", cal.id);

      await supabase
        .from("calendar_sync_state")
        .delete()
        .eq("calendar_id", cal.id);
    }
  }

  return NextResponse.json({ success: true });
}
