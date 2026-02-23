export type UserRole = "patient" | "professional" | "admin";

export type AppointmentStatus =
  | "confirmed"
  | "pending"
  | "completed"
  | "cancelled"
  | "no-show";

export type PaymentStatus = "paid" | "invoice_sent" | "unpaid" | "reminder_sent";

export type VerificationStatus = "pending" | "verified" | "rejected";

export type ConsultationType = "in-person" | "online" | "both";

export type PracticeType =
  | "doctor"
  | "dentist"
  | "psychologist"
  | "physiotherapist"
  | "other";

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type AttendanceStatus =
  | "waiting"
  | "present"
  | "absent"
  | "late"
  | "cancelled";

export type NotificationChannel = "email" | "sms" | "push";

export type ReminderTrigger = "before" | "after" | "immediate";
