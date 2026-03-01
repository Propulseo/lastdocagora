import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCalendarConfig } from "@/lib/calendar/config";
import crypto from "crypto";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

export async function GET() {
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
      { error: "Only professionals can connect calendars" },
      { status: 403 }
    );
  }

  const config = await getCalendarConfig();
  if (!config) {
    return NextResponse.json(
      { error: "Google Calendar not configured. Ask admin to set credentials in Settings." },
      { status: 500 }
    );
  }

  const redirectUri = `${config.appUrl}/api/integrations/google/callback`;

  // Generate CSRF state token
  const state = crypto.randomBytes(32).toString("hex");

  const params = new URLSearchParams({
    client_id: config.googleClientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });

  const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;

  // Set state cookie for CSRF verification in callback
  const response = NextResponse.redirect(authUrl);
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
