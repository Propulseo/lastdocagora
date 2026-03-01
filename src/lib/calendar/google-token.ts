import { createClient } from "@/lib/supabase/server";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

/**
 * Refresh the Google access token using the stored refresh token.
 */
async function refreshAccessToken(
  connectionId: string,
  refreshTokenEncrypted: string,
  encryptionKey: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; expiresAt: string } | null> {
  const supabase = await createClient();

  // Decrypt the refresh token
  const { data: refreshToken, error: decErr } = await supabase.rpc(
    "decrypt_token",
    { p_encrypted: refreshTokenEncrypted, p_key: encryptionKey }
  );

  if (decErr || !refreshToken) {
    console.error("Failed to decrypt refresh token:", decErr);
    return null;
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Google token refresh failed:", errText);
    return null;
  }

  const data = await res.json();
  const expiresAt = new Date(
    Date.now() + data.expires_in * 1000
  ).toISOString();

  // Encrypt and store the new access token
  const { data: encToken } = await supabase.rpc("encrypt_token", {
    p_token: data.access_token,
    p_key: encryptionKey,
  });

  if (encToken) {
    await supabase
      .from("calendar_connections")
      .update({
        access_token_encrypted: encToken,
        expires_at: expiresAt,
      })
      .eq("id", connectionId);
  }

  return { accessToken: data.access_token, expiresAt };
}

/**
 * Get a valid access token for a connection, refreshing if expired.
 */
export async function getValidAccessToken(
  connection: {
    id: string;
    access_token_encrypted: string;
    refresh_token_encrypted: string;
    expires_at: string;
  },
  config: { encryptionKey: string; googleClientId: string; googleClientSecret: string }
): Promise<string | null> {
  const supabase = await createClient();

  // Check if token is still valid (with 5-minute buffer)
  const expiresAt = new Date(connection.expires_at).getTime();
  const now = Date.now() + 5 * 60 * 1000;

  if (expiresAt > now) {
    // Token still valid, decrypt and return
    const { data: token } = await supabase.rpc("decrypt_token", {
      p_encrypted: connection.access_token_encrypted,
      p_key: config.encryptionKey,
    });
    if (token) return token;
  }

  // Token expired, refresh it
  const result = await refreshAccessToken(
    connection.id,
    connection.refresh_token_encrypted,
    config.encryptionKey,
    config.googleClientId,
    config.googleClientSecret
  );

  return result?.accessToken ?? null;
}
