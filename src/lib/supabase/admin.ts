import { createClient, type SupabaseClient } from "@supabase/supabase-js"

let _client: SupabaseClient | null = null

/**
 * Lazy Supabase admin client (service role).
 *
 * IMPORTANT: never instantiate the service-role client at module load time.
 * Next.js evaluates route modules during the "Collect page data" build step,
 * which would crash with "supabaseKey is required" if env vars are not yet
 * available. This helper defers instantiation to first runtime use.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)"
    )
  }
  _client = createClient(url, key)
  return _client
}
