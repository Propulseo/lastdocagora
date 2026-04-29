const GENERIC_CODES = [
  "operation_failed",
  "server_error",
  "Internal server error",
]

/**
 * Resolves an error code to a user-facing message.
 * Generic/sanitized codes fall through to the provided fallback.
 * Business codes (e.g. ATTENDANCE_LOCKED_PRESENT) pass through as-is.
 */
export function resolveErrorMessage(
  code: string | undefined,
  fallback: string
): string {
  if (!code || GENERIC_CODES.includes(code)) return fallback
  return code
}
