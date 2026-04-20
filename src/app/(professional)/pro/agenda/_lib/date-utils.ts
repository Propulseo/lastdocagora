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

/**
 * Compute the start/end date strings for a given period filter.
 * Returns `[startDate, endDate]` as "YYYY-MM-DD" strings.
 *
 * - day   → [selectedDate, selectedDate]
 * - week  → [monday, sunday] (ISO week)
 * - month → [first, last day of month]
 */
export function getDateRange(
  selectedDate: string,
  periodFilter: "day" | "week" | "month",
): [string, string] {
  if (periodFilter === "day") {
    return [selectedDate, selectedDate];
  }
  if (periodFilter === "week") {
    const d = parseLocalDate(selectedDate);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() + diff);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return [toLocalDateStr(weekStart), toLocalDateStr(weekEnd)];
  }
  // month
  const d = parseLocalDate(selectedDate);
  const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
  const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return [toLocalDateStr(monthStart), toLocalDateStr(monthEnd)];
}
