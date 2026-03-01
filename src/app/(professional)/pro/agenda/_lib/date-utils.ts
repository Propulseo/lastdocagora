/**
 * Format a Date as "YYYY-MM-DD" using **local** timezone.
 *
 * Replaces the broken pattern `d.toISOString().split("T")[0]` which
 * silently converts to UTC before extracting the date — off by ±1 day
 * in any non-UTC timezone.
 */
export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Parse a "YYYY-MM-DD" string into a Date at **local** midnight.
 *
 * Replaces the broken pattern `new Date("YYYY-MM-DD")` which is parsed
 * as UTC midnight per spec, causing getDay()/getDate() to return the
 * wrong day in non-UTC timezones.
 */
export function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}
