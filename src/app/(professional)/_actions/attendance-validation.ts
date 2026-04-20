import type { AttendanceStatus } from "@/types";

export type MarkAttendanceResult =
  | { success: true; data: { id: string; status: string; marked_at: string | null }; appointmentStatus: string }
  | { success: false; error: string };

export type SaveNotesResult =
  | { success: true }
  | { success: false; error: string };

export type AppointmentActionResult =
  | { success: true; status: string }
  | { success: false; error: string };

export const VALID_STATUSES: AttendanceStatus[] = ["waiting", "present", "absent", "late", "cancelled"];

/** Maps attendance status → appointment status */
export function deriveAppointmentStatus(attendance: AttendanceStatus, currentStatus: string): string {
  if (attendance === "present") return "confirmed";
  if (attendance === "absent") return "no-show";
  // "late", "waiting", "cancelled" → keep current status
  return currentStatus;
}

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  confirmed: ["pending"],                // can confirm a pending appointment
  cancelled: ["pending", "confirmed"],   // can cancel pending or confirmed
};
