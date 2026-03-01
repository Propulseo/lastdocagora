import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncAllGoogleCalendars } from "@/lib/calendar/google-sync";

/**
 * POST /api/integrations/sync
 * Trigger sync for all selected calendars of the authenticated professional.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user is a professional
  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) {
    return NextResponse.json(
      { error: "Only professionals can sync calendars" },
      { status: 403 }
    );
  }

  const results = await syncAllGoogleCalendars(user.id);

  const totalUpserted = results.reduce((sum, r) => sum + r.upserted, 0);
  const totalDeleted = results.reduce((sum, r) => sum + r.deleted, 0);
  const errors = results.filter((r) => r.error).map((r) => r.error);

  return NextResponse.json({
    synced: results.length,
    totalUpserted,
    totalDeleted,
    errors: errors.length > 0 ? errors : undefined,
  });
}
