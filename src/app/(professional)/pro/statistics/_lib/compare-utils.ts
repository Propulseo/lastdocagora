// ---------------------------------------------------------------------------
// Compare mode period presets and utilities
// ---------------------------------------------------------------------------

export type PeriodPreset =
  | "this-month"
  | "last-month"
  | "3-months"
  | "this-year";

export interface PeriodRange {
  from: string;
  to: string;
  label: string;
}

/** Turn a Date into "YYYY-MM-DD" */
function toISO(d: Date): string {
  return d.toISOString().split("T")[0];
}

/** Last day of a given month (0-indexed month). */
function lastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0);
}

export function getPresetRange(preset: PeriodPreset): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (preset) {
    case "this-month":
      return { from: toISO(new Date(y, m, 1)), to: toISO(now) };
    case "last-month": {
      const pm = m === 0 ? 11 : m - 1;
      const py = m === 0 ? y - 1 : y;
      return {
        from: toISO(new Date(py, pm, 1)),
        to: toISO(lastDayOfMonth(py, pm)),
      };
    }
    case "3-months": {
      const start = new Date(y, m - 2, 1);
      return { from: toISO(start), to: toISO(now) };
    }
    case "this-year":
      return { from: toISO(new Date(y, 0, 1)), to: toISO(now) };
  }
}

/** Compute percentage delta between two values. */
export function computeDelta(a: number, b: number): number {
  if (b === 0) return a > 0 ? 100 : 0;
  return Math.round(((a - b) / b) * 100);
}

/** Format a currency value (EUR). */
export function formatCurrency(value: number, locale: string): string {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : locale === "pt" ? "pt-PT" : "fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
