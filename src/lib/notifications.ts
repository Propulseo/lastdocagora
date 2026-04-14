import type { Notification } from "@/hooks/useNotifications";

type UserRole = "patient" | "professional" | "admin";

/**
 * Returns the destination URL for a notification based on its type and the user's role.
 * Returns null if the notification has no logical destination.
 */
export function getNotificationHref(
  notification: Notification,
  role: UserRole
): string | null {
  const { type, params, related_id } = notification;

  // Extract date from params if available (for agenda navigation)
  const date = params?.date as string | undefined;

  switch (type) {
    // New booking → pro sees agenda, patient sees appointments
    case "new_booking":
      if (role === "professional") {
        return date ? `/pro/agenda?date=${date}` : "/pro/agenda";
      }
      return "/patient/appointments";

    // Appointment confirmed → patient sees appointments, pro sees agenda
    case "appointment_confirmed":
      if (role === "patient") return "/patient/appointments";
      if (role === "professional") {
        return date ? `/pro/agenda?date=${date}` : "/pro/agenda";
      }
      return null;

    // Cancellation → patient sees appointments, pro sees agenda
    case "cancellation":
      if (role === "patient") return "/patient/appointments";
      if (role === "professional") {
        return date ? `/pro/agenda?date=${date}` : "/pro/agenda";
      }
      return null;

    // Appointment rejected → patient sees appointments
    case "appointment_rejected":
      if (role === "patient") return "/patient/appointments";
      return null;

    // Alternative proposed → patient sees appointments
    case "alternative_proposed":
      if (role === "patient") return "/patient/appointments";
      return null;

    // Ticket-related → support page
    case "ticket_reply":
    case "ticket_updated":
    case "ticket_resolved":
    case "support_reply":
    case "support_ticket":
      if (role === "professional") return "/pro/support";
      if (role === "patient") return "/patient/support";
      if (role === "admin") return "/admin/support";
      return null;

    // Walk-in → pro today page
    case "walk_in":
      if (role === "professional") return "/pro/today";
      return null;

    // Reminder → agenda
    case "reminder":
      if (role === "professional") {
        return date ? `/pro/agenda?date=${date}` : "/pro/agenda";
      }
      if (role === "patient") return "/patient/appointments";
      return null;

    // Review-related → reviews page
    case "new_review":
      if (role === "professional") return "/pro/reviews";
      if (role === "admin") return "/admin/reviews";
      return null;

    // System notifications — no navigation
    case "system":
    default:
      return null;
  }
}
