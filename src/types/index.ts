export type UserRole = "patient" | "professional" | "admin";

export type AppointmentStatus =
  | "confirmed"
  | "pending"
  | "completed"
  | "cancelled"
  | "rejected"
  | "no-show";

export type VerificationStatus = "pending" | "verified" | "rejected";

export type ConsultationType = "in-person";

export type PracticeType =
  | "doctor"
  | "dentist"
  | "psychologist"
  | "physiotherapist"
  | "other";

export type TicketStatus = "open" | "in_progress" | "awaiting_confirmation" | "resolved" | "closed";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type AttendanceStatus =
  | "waiting"
  | "present"
  | "absent"
  | "late"
  | "cancelled";

export type NotificationChannel = "email" | "sms" | "push";

export type ReminderTrigger = "before" | "after" | "immediate";

export type CreatedVia = "patient_booking" | "manual" | "walk_in";
