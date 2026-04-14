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
  services: { name: string; name_pt?: string | null; name_fr?: string | null; name_en?: string | null } | null;
  appointment_attendance: {
    id: string;
    status: string;
    marked_at: string | null;
  } | null;
};

export type AvailabilitySlot = {
  id: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  specific_date: string | null;
  day_of_week: number;
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
