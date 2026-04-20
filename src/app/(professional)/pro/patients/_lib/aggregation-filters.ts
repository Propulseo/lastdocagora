import type { PatientRow } from "./types";
import type { PatientMapEntry } from "./aggregation-map";
import { getPatientStatus } from "./aggregation-map";

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
    absence_count: e.absence_count,
    status: getPatientStatus(e, now),
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

  // Search filter (minimum 3 characters)
  const searchTrimmed = params.search?.trim();
  if (searchTrimmed && searchTrimmed.length >= 3) {
    const q = searchTrimmed.toLowerCase();
    filtered = filtered.filter((p) => {
      const fullName =
        `${p.first_name ?? ""} ${p.last_name ?? ""}`.toLowerCase();
      const email = (p.email ?? "").toLowerCase();
      const phone = (p.phone ?? "").toLowerCase();
      return fullName.includes(q) || email.includes(q) || phone.includes(q);
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
