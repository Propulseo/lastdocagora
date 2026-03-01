/**
 * Validates Supabase env and returns URL + anon key.
 * Throws at runtime if missing or if URL is the dashboard (wrong value in prod).
 */
function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || typeof url !== "string" || url.trim() === "") {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is required. Set it in Vercel (e.g. https://<project-ref>.supabase.co)."
    );
  }
  if (url.includes("supabase.com/dashboard")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL must be the project API URL (https://<ref>.supabase.co), not the Supabase dashboard URL."
    );
  }
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey || typeof anonKey !== "string" || anonKey.trim() === "") {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is required.");
  }
  return { url, anonKey };
}

export { getSupabaseEnv };
