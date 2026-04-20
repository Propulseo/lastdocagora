export const statusColors: Record<string, string> = {
  confirmed: "bg-emerald-500",
  completed: "bg-emerald-500",
  pending: "bg-amber-500",
  scheduled: "bg-blue-500",
  cancelled: "bg-red-500",
  rejected: "bg-rose-500",
  no_show: "bg-red-500",
};

export const statusBadgeVariant: Record<string, string> = {
  confirmed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  scheduled: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  rejected: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  no_show: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
};

/* Generate free-slot placeholder lines between/after appointments */
export function buildFreeSlots(
  appointments: { appointment_time: string | null; duration_minutes: number | null }[],
  label: string
) {
  if (appointments.length === 0) return [];

  const slots: { time: string }[] = [];
  const dayEnd = 18; // 18:00

  for (let i = 0; i < appointments.length; i++) {
    const apt = appointments[i];
    const next = appointments[i + 1];
    if (!apt.appointment_time) continue;

    const [h, m] = apt.appointment_time.split(":").map(Number);
    const endMin = h * 60 + m + (apt.duration_minutes ?? 30);

    let nextStartMin: number;
    if (next?.appointment_time) {
      const [nh, nm] = next.appointment_time.split(":").map(Number);
      nextStartMin = nh * 60 + nm;
    } else {
      nextStartMin = dayEnd * 60;
    }

    // If there's a gap of >= 60 min, show one free-slot line
    if (nextStartMin - endMin >= 60) {
      const fH = Math.floor(endMin / 60);
      const fM = endMin % 60;
      slots.push({
        time: `${String(fH).padStart(2, "0")}:${String(fM).padStart(2, "0")}`,
      });
    }
  }
  return slots;
}
