import { toZonedTime, format as formatTz } from "date-fns-tz"

/** DocAgora reference timezone — all scheduling is in Portuguese local time. */
export const TIMEZONE = "Europe/Lisbon"

/**
 * Current instant as a Date whose getters (.getHours(), .getDate(), etc.)
 * reflect Lisbon local time. Use for display and time-of-day comparisons.
 */
export function nowInLisbon(): Date {
  return toZonedTime(new Date(), TIMEZONE)
}

/** Convert any Date to a Date whose getters reflect Lisbon local time. */
export function toLisbonTime(date: Date | string): Date {
  return toZonedTime(typeof date === "string" ? new Date(date) : date, TIMEZONE)
}

/** Format a Date in Lisbon timezone using date-fns format tokens. */
export function formatInLisbon(date: Date | string, fmt: string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return formatTz(toZonedTime(d, TIMEZONE), fmt, { timeZone: TIMEZONE })
}

/** Current Lisbon date as "YYYY-MM-DD". */
export function todayInLisbon(): string {
  return formatInLisbon(new Date(), "yyyy-MM-dd")
}
