import type {
  PatientRow,
  PatientsKpi,
  AcquisitionPoint,
  InsuranceSlice,
  FrequencyBucket,
  RawAppointmentRow,
  RawPatientRow,
} from "./types";

// ---------------------------------------------------------------------------
// Build a unified patient map from owned patients + appointments
// ---------------------------------------------------------------------------

export interface PatientMapEntry {
  patient_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  insurance_provider: string | null;
  date_of_birth: string | null;
  created_at: string | null;
  last_appointment: string | null;
  first_appointment_with_pro: string | null;
  total_appointments: number;
  attendance_present: number;
  attendance_total: number;
}

export function buildPatientMap(
  ownedPatients: RawPatientRow[],
  appointments: RawAppointmentRow[],
): Map<string, PatientMapEntry> {
  const map = new Map<string, PatientMapEntry>();

  // Seed with owned patients
  for (const p of ownedPatients) {
    map.set(p.id, {
      patient_id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      email: p.email,
      phone: p.phone,
      insurance_provider: p.insurance_provider,
      date_of_birth: p.date_of_birth,
      created_at: p.created_at,
      last_appointment: null,
      first_appointment_with_pro: null,
      total_appointments: 0,
      attendance_present: 0,
      attendance_total: 0,
    });
  }

  // Merge appointment data
  for (const apt of appointments) {
    if (!apt.patient_id) continue;

    let entry = map.get(apt.patient_id);
    if (!entry) {
      // Patient seen via appointment but not in owned list
      entry = {
        patient_id: apt.patient_id,
        first_name: null,
        last_name: null,
        email: null,
        phone: null,
        insurance_provider: null,
        date_of_birth: null,
        created_at: null,
        last_appointment: null,
        first_appointment_with_pro: null,
        total_appointments: 0,
        attendance_present: 0,
        attendance_total: 0,
      };
      map.set(apt.patient_id, entry);
    }

    if (apt.status !== "cancelled") {
      entry.total_appointments += 1;
    }

    if (
      !entry.last_appointment ||
      apt.appointment_date > entry.last_appointment
    ) {
      entry.last_appointment = apt.appointment_date;
    }

    if (
      !entry.first_appointment_with_pro ||
      apt.appointment_date < entry.first_appointment_with_pro
    ) {
      entry.first_appointment_with_pro = apt.appointment_date;
    }

    // Attendance tracking
    const att = apt.appointment_attendance;
    if (att && Array.isArray(att) && att.length > 0) {
      const status = att[0].status;
      entry.attendance_total += 1;
      if (status === "present" || status === "late") {
        entry.attendance_present += 1;
      }
    }
  }

  return map;
}

// ---------------------------------------------------------------------------
// Determine patient status
// ---------------------------------------------------------------------------

function getPatientStatus(
  entry: PatientMapEntry,
  now: Date,
): "active" | "inactive" | "new" {
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const firstAppt = entry.first_appointment_with_pro;
  if (firstAppt && firstAppt >= thirtyDaysAgo.toISOString().split("T")[0]) {
    return "new";
  }

  const lastAppt = entry.last_appointment;
  if (lastAppt && lastAppt >= ninetyDaysAgo.toISOString().split("T")[0]) {
    return "active";
  }

  return "inactive";
}

// ---------------------------------------------------------------------------
// Convert map to PatientRow[]
// ---------------------------------------------------------------------------

export function mapToPatientRows(
  patientMap: Map<string, PatientMapEntry>,
  now: Date,
): PatientRow[] {
  return Array.from(patientMap.values()).map((e) => ({
    patient_id: e.patient_id,
    first_name: e.first_name,
    last_name: e.last_name,
    email: e.email,
    phone: e.phone,
    insurance_provider: e.insurance_provider,
    date_of_birth: e.date_of_birth,
    created_at: e.created_at,
    last_appointment: e.last_appointment,
    total_appointments: e.total_appointments,
    attendance_rate:
      e.attendance_total > 0
        ? Math.round((e.attendance_present / e.attendance_total) * 100)
        : null,
    status: getPatientStatus(e, now),
  }));
}

// ---------------------------------------------------------------------------
// KPI computation
// ---------------------------------------------------------------------------

export function buildPatientsKpi(
  patientMap: Map<string, PatientMapEntry>,
  now: Date,
): PatientsKpi {
  const entries = Array.from(patientMap.values());
  const totalPatients = entries.length;

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];
  const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split("T")[0];

  // New patients: first appointment with this pro in last 30d
  const newPatients30d = entries.filter(
    (e) =>
      e.first_appointment_with_pro &&
      e.first_appointment_with_pro >= thirtyDaysAgoStr,
  ).length;

  // Active patients: appointment in last 90d
  const activePatients = entries.filter(
    (e) => e.last_appointment && e.last_appointment >= ninetyDaysAgoStr,
  ).length;

  // Retention rate: of patients first seen 90+ days ago, % who came back after
  const oldPatients = entries.filter(
    (e) =>
      e.first_appointment_with_pro &&
      e.first_appointment_with_pro < ninetyDaysAgoStr,
  );
  const returnedPatients = oldPatients.filter(
    (e) => e.total_appointments >= 2,
  ).length;
  const retentionRate =
    oldPatients.length > 0
      ? Math.round((returnedPatients / oldPatients.length) * 100)
      : 0;

  // Average appointments per patient
  const totalAppointments = entries.reduce(
    (sum, e) => sum + e.total_appointments,
    0,
  );
  const avgAppointmentsPerPatient =
    totalPatients > 0
      ? Math.round((totalAppointments / totalPatients) * 10) / 10
      : 0;

  // Global attendance rate
  let attendPresent = 0;
  let attendTotal = 0;
  for (const e of entries) {
    attendPresent += e.attendance_present;
    attendTotal += e.attendance_total;
  }
  const attendanceRate =
    attendTotal > 0 ? Math.round((attendPresent / attendTotal) * 100) : 0;

  return {
    totalPatients,
    newPatients30d,
    activePatients,
    retentionRate,
    avgAppointmentsPerPatient,
    attendanceRate,
    attendanceTotal: attendTotal,
  };
}

// ---------------------------------------------------------------------------
// Acquisition trends (monthly)
// ---------------------------------------------------------------------------

export function buildAcquisitionTrends(
  patientMap: Map<string, PatientMapEntry>,
): AcquisitionPoint[] {
  // Group patients by the month of their first appointment with this pro
  const monthMap = new Map<string, number>();

  for (const entry of patientMap.values()) {
    const firstAppt = entry.first_appointment_with_pro;
    if (!firstAppt) continue;
    const month = firstAppt.slice(0, 7); // YYYY-MM
    monthMap.set(month, (monthMap.get(month) ?? 0) + 1);
  }

  // Sort by month
  const sorted = Array.from(monthMap.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  let cumulative = 0;
  return sorted.map(([date, newPatients]) => {
    cumulative += newPatients;
    return { date, newPatients, cumulative };
  });
}

// ---------------------------------------------------------------------------
// Insurance breakdown
// ---------------------------------------------------------------------------

export function buildInsuranceBreakdown(
  patientMap: Map<string, PatientMapEntry>,
  insuranceLabels: Record<string, string>,
): InsuranceSlice[] {
  const countMap = new Map<string, number>();

  for (const entry of patientMap.values()) {
    const provider = entry.insurance_provider || "none";
    countMap.set(provider, (countMap.get(provider) ?? 0) + 1);
  }

  return Array.from(countMap.entries())
    .map(([provider, count]) => ({
      provider,
      label: insuranceLabels[provider] ?? provider,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Frequency distribution
// ---------------------------------------------------------------------------

export function buildFrequencyDistribution(
  patientMap: Map<string, PatientMapEntry>,
): FrequencyBucket[] {
  const buckets: Record<string, number> = {
    "1": 0,
    "2-3": 0,
    "4-5": 0,
    "6-10": 0,
    "10+": 0,
  };

  for (const entry of patientMap.values()) {
    const n = entry.total_appointments;
    if (n <= 0) continue;
    if (n === 1) buckets["1"]++;
    else if (n <= 3) buckets["2-3"]++;
    else if (n <= 5) buckets["4-5"]++;
    else if (n <= 10) buckets["6-10"]++;
    else buckets["10+"]++;
  }

  return Object.entries(buckets).map(([bucket, count]) => ({
    bucket,
    count,
  }));
}

// ---------------------------------------------------------------------------
// Filtering + sorting
// ---------------------------------------------------------------------------

export function applyFilters(
  patients: PatientRow[],
  params: {
    search?: string;
    status?: string;
    insurance?: string;
    sort?: string;
  },
): PatientRow[] {
  let filtered = [...patients];

  // Search filter
  if (params.search?.trim()) {
    const q = params.search.toLowerCase().trim();
    filtered = filtered.filter((p) => {
      const fullName =
        `${p.first_name ?? ""} ${p.last_name ?? ""}`.toLowerCase();
      const email = (p.email ?? "").toLowerCase();
      return fullName.includes(q) || email.includes(q);
    });
  }

  // Status filter
  if (params.status && params.status !== "all") {
    filtered = filtered.filter((p) => p.status === params.status);
  }

  // Insurance filter
  if (params.insurance && params.insurance !== "all") {
    filtered = filtered.filter(
      (p) => (p.insurance_provider || "none") === params.insurance,
    );
  }

  // Sort
  switch (params.sort) {
    case "name":
      filtered.sort((a, b) => {
        const nameA = `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim();
        const nameB = `${b.first_name ?? ""} ${b.last_name ?? ""}`.trim();
        return nameA.localeCompare(nameB);
      });
      break;
    case "total":
      filtered.sort((a, b) => b.total_appointments - a.total_appointments);
      break;
    case "attendance":
      filtered.sort(
        (a, b) => (b.attendance_rate ?? -1) - (a.attendance_rate ?? -1),
      );
      break;
    case "last":
    default:
      filtered.sort((a, b) => {
        if (!a.last_appointment) return 1;
        if (!b.last_appointment) return -1;
        return b.last_appointment.localeCompare(a.last_appointment);
      });
      break;
  }

  return filtered;
}

// ---------------------------------------------------------------------------
// Extract unique insurance providers from map
// ---------------------------------------------------------------------------

export function getUniqueInsuranceProviders(
  patientMap: Map<string, PatientMapEntry>,
): string[] {
  const set = new Set<string>();
  for (const entry of patientMap.values()) {
    if (entry.insurance_provider) {
      set.add(entry.insurance_provider);
    }
  }
  return Array.from(set).sort();
}
