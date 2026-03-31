// ─── Grid Geometry ───
export const HOUR_HEIGHT = 56;
export const START_HOUR = 7;
export const END_HOUR = 20;
export const SLOT_MINUTES = 30;

// ─── Off-hours (subtle striping boundaries) ───
export const OFF_HOURS_START = 8;
export const OFF_HOURS_END = 18;

// ─── Theme-adaptive status colors ───
export const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-blue-50 dark:bg-blue-950 border-l-blue-500 text-blue-700 dark:text-blue-200",
  pending: "bg-orange-50 dark:bg-orange-950 border-l-orange-500 text-orange-700 dark:text-orange-200",
  cancelled: "bg-red-50 dark:bg-red-950 border-l-red-500 text-red-700 dark:text-red-300",
  rejected: "bg-rose-50 dark:bg-rose-950 border-l-rose-500 text-rose-700 dark:text-rose-300",
  "no-show": "bg-red-50 dark:bg-red-950 border-l-red-500 text-red-700 dark:text-red-300",
  no_show: "bg-red-50 dark:bg-red-950 border-l-red-500 text-red-700 dark:text-red-300",
  completed: "bg-gray-50 dark:bg-gray-900 border-l-gray-400 text-gray-600 dark:text-gray-300",
};

export const STATUS_PILL_COLORS: Record<string, string> = {
  confirmed: "border-blue-500/40 text-blue-700 dark:text-blue-300 bg-blue-500/10",
  pending: "border-orange-500/40 text-orange-700 dark:text-orange-300 bg-orange-500/10",
  cancelled: "border-red-500/40 text-red-700 dark:text-red-300 bg-red-500/10",
  rejected: "border-rose-500/40 text-rose-700 dark:text-rose-300 bg-rose-500/10",
  "no-show": "border-red-500/40 text-red-700 dark:text-red-300 bg-red-500/10",
  no_show: "border-red-500/40 text-red-700 dark:text-red-300 bg-red-500/10",
  completed: "border-gray-500/40 text-gray-600 dark:text-gray-300 bg-gray-500/10",
};

export const ATTENDANCE_DOT_COLORS: Record<string, string> = {
  waiting: "bg-gray-400",
  present: "bg-green-500",
  late: "bg-amber-500",
  absent: "bg-red-500",
};

export const ATTENDANCE_BADGE_COLORS: Record<string, string> = {
  waiting: "border-gray-500/40 text-gray-600 dark:text-gray-300 bg-gray-500/10",
  present: "border-green-500/40 text-green-700 dark:text-green-300 bg-green-500/10",
  late: "border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10",
  absent: "border-red-500/40 text-red-700 dark:text-red-300 bg-red-500/10",
};

// ─── Stat accent colors (for AttendanceStats row) ───
export const STAT_COLORS: Record<string, string> = {
  total: "text-blue-600 dark:text-blue-400",
  present: "text-green-600 dark:text-green-400",
  late: "text-amber-600 dark:text-amber-400",
  absent: "text-red-600 dark:text-red-400",
  waiting: "text-orange-600 dark:text-orange-400",
};

// ─── Payment status colors ───
export const PAYMENT_BADGE_COLORS: Record<string, string> = {
  paid: "border-green-500/40 text-green-700 dark:text-green-300 bg-green-500/10",
  invoiced: "border-orange-500/40 text-orange-700 dark:text-orange-300 bg-orange-500/10",
  reminder_sent: "border-blue-500/40 text-blue-700 dark:text-blue-300 bg-blue-500/10",
  unpaid: "border-red-500/40 text-red-700 dark:text-red-300 bg-red-500/10",
};

export const PAYMENT_DOT_COLORS: Record<string, string> = {
  paid: "bg-green-500",
  invoiced: "bg-orange-500",
  reminder_sent: "bg-blue-500",
  unpaid: "bg-red-500",
};
