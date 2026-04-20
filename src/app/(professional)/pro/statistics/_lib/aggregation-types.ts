// ---------------------------------------------------------------------------
// Types used across aggregation modules
// ---------------------------------------------------------------------------

export interface AppointmentRow {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  created_via: string;
  service_id: string | null;
  patient_id: string | null;
  price?: number | null;
  duration_minutes: number;
  services: { name: string; name_pt?: string | null; name_fr?: string | null; name_en?: string | null } | null;
  appointment_attendance: { status: string; late_minutes: number | null }[];
}

export interface AvailabilityRow {
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  specific_date: string | null;
  day_of_week: number;
}

export interface HistoryRow {
  patient_id: string | null;
  status: string;
  appointment_date: string;
  service_id: string | null;
  patients: { first_name: string | null; last_name: string | null } | null;
  services: { name: string } | null;
  appointment_attendance: { status: string }[];
}

export interface InsightLabels {
  /** e.g. `"{{name}}": {{rate}}% no-show` — use {{name}} and {{rate}} */
  worstService: string;
  /** e.g. `Enable specific reminder for this service` */
  worstServiceAction: string;
  /** e.g. `"{{name}}": {{rate}}% attendance rate` — use {{name}} and {{rate}} */
  bestService: string;
  /** e.g. `Service to promote — excellent adherence` */
  bestServiceAction: string;
  /** Fallback patient name, e.g. `Patient` */
  patientFallback: string;
  /** e.g. `{{name}}: {{count}} absences/cancellations` — use {{name}} and {{count}} */
  riskyPatient: string;
  /** e.g. `Consider follow-up or deposit` */
  riskyPatientAction: string;
}

export const DEFAULT_INSIGHT_LABELS: InsightLabels = {
  worstService: '"{{name}}" : {{rate}}% não compareceu',
  worstServiceAction: "Ativar lembrete específico para este serviço",
  bestService: '"{{name}}" : {{rate}}% taxa presença',
  bestServiceAction: "Serviço a promover — excelente adesão",
  patientFallback: "Paciente",
  riskyPatient: "{{name}} : {{count}} ausências/cancelamentos",
  riskyPatientAction: "Considerar acompanhamento ou acompte",
};
