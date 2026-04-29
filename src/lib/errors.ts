/**
 * Sanitizes a Supabase/Postgrest error for safe client return.
 * Logs error code server-side, returns generic string to client.
 */
export function sanitizeDbError(
  error: { code?: string; message?: string },
  context: string
): string {
  console.error(`[${context}]`, error.code ?? "UNKNOWN")
  return "operation_failed"
}
