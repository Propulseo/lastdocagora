import type { AppointmentStatus, AttendanceStatus } from "@/types";

// --- Status transition matrix ---
export const ADMIN_STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ["confirmed", "cancelled", "rejected"],
  confirmed: ["completed", "cancelled", "no-show"],
  completed: ["cancelled"],
  cancelled: [],
  rejected: ["cancelled"],
  "no-show": ["cancelled"],
};

// --- Attendance transition matrix ---
export const ADMIN_ATTENDANCE_TRANSITIONS: Record<AttendanceStatus, AttendanceStatus[]> = {
  waiting: ["present", "absent", "late"],
  present: [],
  absent: ["present", "late"],
  late: ["present", "absent"],
  cancelled: [],
};

export const MIN_DURATION_MINUTES = 5;

export function getValidStatusTransitions(current: AppointmentStatus): AppointmentStatus[] {
  return ADMIN_STATUS_TRANSITIONS[current] ?? [];
}

export function isAppointmentFuture(date: string, time: string): boolean {
  return new Date(`${date}T${time}`) > new Date();
}

export function isAttendanceLocked(apptStatus: AppointmentStatus): boolean {
  return apptStatus === "cancelled" || apptStatus === "rejected";
}

export function getValidAttendanceTransitions(
  attendance: AttendanceStatus,
  apptStatus: AppointmentStatus,
  date: string,
  time: string,
): AttendanceStatus[] {
  if (isAttendanceLocked(apptStatus)) return [];
  if (isAppointmentFuture(date, time)) return [];
  if (attendance === "present") return [];
  return ADMIN_ATTENDANCE_TRANSITIONS[attendance] ?? [];
}

export function canDeleteAppointment(attendance: AttendanceStatus | null): boolean {
  return attendance !== "present";
}

export function canEditDateTime(
  apptStatus: AppointmentStatus,
  attendance: AttendanceStatus | null,
): boolean {
  if (attendance === "present" || attendance === "absent") return false;
  if (["completed", "cancelled", "rejected", "no-show"].includes(apptStatus)) return false;
  return true;
}
