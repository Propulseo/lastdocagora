import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCalendarConfig } from "@/lib/calendar/config";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_LIST_URL =
  "https://www.googleapis.com/calendar/v3/users/me/calendarList";
const GOOGLE_USERINFO_URL =
  "https://www.googleapis.com/oauth2/v2/userinfo";

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface GoogleCalendar {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
  timeZone?: string;
}

interface GoogleCalendarListResponse {
  items: GoogleCalendar[];
}

interface GoogleUserInfo {
  email: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Handle user denying consent
  if (error) {
    return NextResponse.redirect(
      `${appUrl}/pro/agenda?calendar_error=consent_denied`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${appUrl}/pro/agenda?calendar_error=missing_params`
    );
  }

  // Verify CSRF state
  const storedState = request.cookies.get("google_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(
      `${appUrl}/pro/agenda?calendar_error=invalid_state`
    );
  }

  // Load config from DB / env
  const config = await getCalendarConfig();
  if (!config) {
    return NextResponse.redirect(
      `${appUrl}/pro/agenda?calendar_error=not_configured`
    );
  }

  // Authenticate user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) {
    return NextResponse.redirect(
      `${appUrl}/pro/agenda?calendar_error=not_professional`
    );
  }

  const redirectUri = `${config.appUrl}/api/integrations/google/callback`;

  // Exchange code for tokens
  let tokenData: GoogleTokenResponse;
  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.googleClientId,
        client_secret: config.googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("Google token exchange failed:", errBody);
      return NextResponse.redirect(
        `${appUrl}/pro/agenda?calendar_error=token_exchange`
      );
    }

    tokenData = await tokenRes.json();
  } catch (err) {
    console.error("Google token exchange error:", err);
    return NextResponse.redirect(
      `${appUrl}/pro/agenda?calendar_error=token_exchange`
    );
  }

  if (!tokenData.refresh_token) {
    console.error("No refresh_token received from Google");
    return NextResponse.redirect(
      `${appUrl}/pro/agenda?calendar_error=no_refresh_token`
    );
  }

  // Get Google account email
  let accountEmail = "unknown";
  try {
    const userInfoRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (userInfoRes.ok) {
      const userInfo: GoogleUserInfo = await userInfoRes.json();
      accountEmail = userInfo.email;
    }
  } catch {
    // Non-critical, continue with "unknown"
  }

  // Encrypt tokens using Supabase RPC
  const { data: encAccessToken, error: encAccessErr } = await supabase.rpc(
    "encrypt_token",
    { p_token: tokenData.access_token, p_key: config.encryptionKey }
  );
  const { data: encRefreshToken, error: encRefreshErr } = await supabase.rpc(
    "encrypt_token",
    { p_token: tokenData.refresh_token, p_key: config.encryptionKey }
  );

  if (encAccessErr || encRefreshErr || !encAccessToken || !encRefreshToken) {
    console.error("Token encryption failed:", encAccessErr, encRefreshErr);
    return NextResponse.redirect(
      `${appUrl}/pro/agenda?calendar_error=encryption`
    );
  }

  const expiresAt = new Date(
    Date.now() + tokenData.expires_in * 1000
  ).toISOString();

  // Check for existing connection with same provider + email
  const { data: existing } = await supabase
    .from("calendar_connections")
    .select("id")
    .eq("professional_user_id", user.id)
    .eq("provider", "google")
    .eq("account_email", accountEmail)
    .is("revoked_at", null)
    .single();

  let connectionId: string;

  if (existing) {
    // Update existing connection tokens
    const { error: updateErr } = await supabase
      .from("calendar_connections")
      .update({
        access_token_encrypted: encAccessToken,
        refresh_token_encrypted: encRefreshToken,
        expires_at: expiresAt,
        scopes: tokenData.scope.split(" "),
      })
      .eq("id", existing.id);

    if (updateErr) {
      console.error("Failed to update connection:", updateErr);
      return NextResponse.redirect(
        `${appUrl}/pro/agenda?calendar_error=db_error`
      );
    }
    connectionId = existing.id;
  } else {
    // Insert new connection
    const { data: connection, error: insertErr } = await supabase
      .from("calendar_connections")
      .insert({
        professional_id: professional.id,
        professional_user_id: user.id,
        provider: "google",
        account_email: accountEmail,
        access_token_encrypted: encAccessToken,
        refresh_token_encrypted: encRefreshToken,
        expires_at: expiresAt,
        scopes: tokenData.scope.split(" "),
      })
      .select("id")
      .single();

    if (insertErr || !connection) {
      console.error("Failed to insert connection:", insertErr);
      return NextResponse.redirect(
        `${appUrl}/pro/agenda?calendar_error=db_error`
      );
    }
    connectionId = connection.id;
  }

  // Fetch calendar list from Google
  try {
    const calListRes = await fetch(GOOGLE_CALENDAR_LIST_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (calListRes.ok) {
      const calData: GoogleCalendarListResponse = await calListRes.json();

      // Upsert calendars
      for (const cal of calData.items) {
        const { error: calErr } = await supabase
          .from("calendar_calendars")
          .upsert(
            {
              connection_id: connectionId,
              professional_user_id: user.id,
              external_calendar_id: cal.id,
              name: cal.summary,
              is_primary: cal.primary ?? false,
              selected: cal.primary ?? false,
              color: cal.backgroundColor ?? null,
              timezone: cal.timeZone ?? null,
            },
            {
              onConflict: "connection_id,external_calendar_id",
            }
          );

        if (calErr) {
          console.error("Failed to upsert calendar:", calErr);
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch calendar list:", err);
  }

  // Clear state cookie and redirect to agenda
  const response = NextResponse.redirect(
    `${appUrl}/pro/agenda?calendar_connected=google`
  );
  response.cookies.delete("google_oauth_state");

  return response;
}
