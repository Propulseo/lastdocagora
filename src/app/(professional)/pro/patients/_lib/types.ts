// ---------------------------------------------------------------------------
// Types for Patients Dashboard
// ---------------------------------------------------------------------------

export interface PatientRow {
  patient_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  insurance_provider: string | null;
  date_of_birth: string | null;
  created_at: string | null;
  last_appointment: string | null;
  total_appointments: number;
  attendance_rate: number | null; // 0-100
  absence_count: number;
  status: "active" | "inactive" | "new";
}

export interface PatientsKpi {
  totalPatients: number;
  newPatients30d: number;
  activePatients: number;
  retentionRate: number; // 0-100
  avgAppointmentsPerPatient: number;
  attendanceRate: number; // 0-100
  attendanceTotal: number;
}

export interface AcquisitionPoint {
  date: string; // YYYY-MM
  newPatients: number;
  cumulative: number;
}

export interface InsuranceSlice {
  provider: string;
  label: string;
  count: number;
}

export interface FrequencyBucket {
  bucket: string;
  count: number;
}

export interface PatientsDashboardData {
  kpi: PatientsKpi;
  acquisitionTrends: AcquisitionPoint[];
  insuranceBreakdown: InsuranceSlice[];
  frequencyDistribution: FrequencyBucket[];
  patients: PatientRow[];
  totalUnfiltered: number;
  filterOptions: {
    insuranceProviders: string[];
  };
}

// Raw row from the appointments query
export interface RawAppointmentRow {
  id: string;
  patient_id: string | null;
  appointment_date: string;
  status: string;
  price: number | null;
  service_id: string | null;
  created_via: string | null;
  services: { name: string } | null;
  appointment_attendance: { status: string; late_minutes: number | null }[];
}

// Raw patient from the patients query
export interface RawPatientRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  insurance_provider: string | null;
  date_of_birth: string | null;
  created_at: string | null;
  absence_count: number;
}
