const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL =
  "https://www.googleapis.com/oauth2/v2/userinfo";

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface GoogleUserInfo {
  email: string;
}

export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string,
): Promise<{ data: GoogleTokenResponse } | { error: string }> {
  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("Google token exchange failed:", errBody);
      return { error: "token_exchange" };
    }

    const data: GoogleTokenResponse = await tokenRes.json();
    return { data };
  } catch (err) {
    console.error("Google token exchange error:", err);
    return { error: "token_exchange" };
  }
}

export async function fetchGoogleAccountEmail(
  accessToken: string,
): Promise<string> {
  try {
    const userInfoRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (userInfoRes.ok) {
      const userInfo: GoogleUserInfo = await userInfoRes.json();
      return userInfo.email;
    }
  } catch {
    // Non-critical, continue with "unknown"
  }
  return "unknown";
}
