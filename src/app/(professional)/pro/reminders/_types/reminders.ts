import type { Tables } from "@/lib/supabase/types";

export type ReminderRule = Tables<"reminder_rules"> & {
  message_templates: {
    name: string;
    content: string;
    channel: string;
  } | null;
};

export type MessageTemplate = Tables<"message_templates">;

export type NotificationLog = Tables<"appointment_notifications"> & {
  appointments: {
    appointment_date: string;
    patients: {
      first_name: string | null;
      last_name: string | null;
    } | null;
  } | null;
};

export type ProfessionalSettings = Tables<"professional_settings">;

export interface RemindersClientProps {
  professionalId: string;
  professionalUserId: string;
  initialRules: ReminderRule[];
  initialTemplates: MessageTemplate[];
  initialNotifications: NotificationLog[];
  initialSettings: ProfessionalSettings | null;
  kpiData: {
    sentThisMonth: number;
    totalWithStatus: number;
    deliveredCount: number;
  };
}
