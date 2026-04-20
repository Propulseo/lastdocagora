import type { Appointment } from "../_types/agenda";

export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function timeDiffInMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

export function hasOverlap(
  appointments: Appointment[],
  date: string,
  start: string,
  end: string,
): boolean {
  return appointments.some((apt) => {
    if (apt.appointment_date !== date || apt.status === "cancelled") return false;
    const aptStart = apt.appointment_time.slice(0, 5);
    const aptEnd = addMinutesToTime(aptStart, apt.duration_minutes);
    return start < aptEnd && end > aptStart;
  });
}
