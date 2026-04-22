export type { MarkAttendanceResult, SaveNotesResult, AppointmentActionResult } from "./attendance-validation";
export { VALID_STATUSES, deriveAppointmentStatus, ALLOWED_TRANSITIONS } from "./attendance-validation";
export { markAttendance, saveAppointmentNotes } from "./attendance-update";
export { cancelAppointment, rejectAppointment } from "./attendance-postconsultation";
export { updateAppointmentStatus, proposeAlternativeTime } from "./attendance-status";
export { rescheduleAppointment } from "./attendance-reschedule";
