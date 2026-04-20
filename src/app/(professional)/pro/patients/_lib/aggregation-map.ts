import type { RawAppointmentRow, RawPatientRow } from "./types";

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
  absence_count: number;
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
      absence_count: p.absence_count ?? 0,
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
        absence_count: 0,
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

export function getPatientStatus(
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
