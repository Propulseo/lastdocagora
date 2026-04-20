export type ActionResult =
  | { success: true; data?: Record<string, unknown> }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Patient detail for drawer
// ---------------------------------------------------------------------------

export type PatientDetail = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  languages_spoken: string[] | null;
  insurance_provider: string | null;
  completedCount: number;
  firstConsultation: string | null;
  lastConsultation: string | null;
  recentAppointments: {
    date: string;
    time: string;
    status: string;
    serviceName: string | null;
    notes: string | null;
  }[];
};

export type DetailResult =
  | { success: true; data: PatientDetail }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Enhanced patient detail for upgraded drawer
// ---------------------------------------------------------------------------

export type ConsultationNoteRow = {
  id: string;
  content: string;
  follow_up_needed: boolean;
  follow_up_suggested_date: string | null;
  created_at: string;
  updated_at: string;
  appointment_id: string;
  appointment_date: string | null;
  appointment_time: string | null;
};

export type PatientDetailEnhanced = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  languages_spoken: string[] | null;
  insurance_provider: string | null;
  created_at: string | null;
  completedCount: number;
  firstConsultation: string | null;
  lastConsultation: string | null;
  attendanceRate: number;
  attendanceTotal: number;
  absenceCount: number;
  totalSpent: number;
  avgSpent: number;
  allAppointments: {
    id: string;
    date: string;
    time: string;
    status: string;
    serviceName: string | null;
    notes: string | null;
    attendanceStatus: string | null;
  }[];
  upcomingAppointments: {
    id: string;
    date: string;
    time: string;
    status: string;
    serviceName: string | null;
  }[];
  consultationNotes: ConsultationNoteRow[];
};

export type EnhancedDetailResult =
  | { success: true; data: PatientDetailEnhanced }
  | { success: false; error: string };
