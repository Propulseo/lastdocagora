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

// ---------------------------------------------------------------------------
// Chart data types
// ---------------------------------------------------------------------------

export interface NotificationTrendPoint {
  date: string;
  sent: number;
  delivered: number;
  failed: number;
}

export interface ChannelSlice {
  channel: string;
  label: string;
  count: number;
}

export interface StatusSlice {
  status: string;
  label: string;
  count: number;
}

export interface RemindersChartsData {
  trends: NotificationTrendPoint[];
  channelBreakdown: ChannelSlice[];
  statusBreakdown: StatusSlice[];
}

export interface RemindersKpiData {
  sentThisMonth: number;
  totalWithStatus: number;
  deliveredCount: number;
  activeRulesCount: number;
  totalRulesCount: number;
  activeTemplatesCount: number;
  ownTemplatesCount: number;
  noShowReduction: number | null;
}

export interface RemindersClientProps {
  professionalId: string;
  professionalUserId: string;
  initialRules: ReminderRule[];
  initialTemplates: MessageTemplate[];
  initialNotifications: NotificationLog[];
  initialSettings: ProfessionalSettings | null;
  kpiData: RemindersKpiData;
  chartsData: RemindersChartsData;
}
