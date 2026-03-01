export type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status: string;
  consultation_type: string;
  notes: string | null;
  title: string | null;
  created_via: string | null;
  patients: { first_name: string | null; last_name: string | null } | null;
  services: { name: string } | null;
  appointment_attendance: {
    id: string;
    status: string;
    marked_at: string | null;
  } | null;
};

export type ExternalEvent = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  status: string;
  provider: string;
  color: string | null;
  calendar_name: string;
};
