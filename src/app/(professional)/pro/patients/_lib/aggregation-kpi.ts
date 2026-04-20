import type { PatientsKpi } from "./types";
import type { PatientMapEntry } from "./aggregation-map";

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
