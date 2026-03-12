"use server";

import { createClient } from "@/lib/supabase/server";
import { getProfessionalId } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PeriodStats {
  appointments: number;
  revenue: number;
  newPatients: number;
  recurringPatients: number;
  attendanceRate: number;
  cancellationRate: number;
  dailyData: { day: number; count: number; revenue: number }[];
}

// ---------------------------------------------------------------------------
// Server action — fetch stats for a single period
// ---------------------------------------------------------------------------

export async function fetchPeriodStats(
  from: string,
  to: string,
): Promise<PeriodStats> {
  const professionalId = await getProfessionalId();
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("appointments")
    .select(
      "id, appointment_date, status, price, patient_id, appointment_attendance(status)",
    )
    .eq("professional_id", professionalId)
    .gte("appointment_date", from)
    .lte("appointment_date", to);

  const all = rows ?? [];
  const nonCancelled = all.filter((r) => r.status !== "cancelled");
  const totalAppts = nonCancelled.length;
  const revenue = nonCancelled.reduce(
    (s, r) => s + (Number(r.price) || 0),
    0,
  );

  // Attendance
  const withAtt = nonCancelled.filter(
    (r) =>
      Array.isArray(r.appointment_attendance) &&
      r.appointment_attendance.length > 0,
  );
  const present = withAtt.filter((r) => {
    const att = r.appointment_attendance as unknown as { status: string }[];
    const s = att[0]?.status;
    return s === "present" || s === "late";
  }).length;
  const attendanceRate =
    withAtt.length > 0 ? Math.round((present / withAtt.length) * 100) : 0;

  // Cancellation
  const cancelled = all.filter((r) => r.status === "cancelled").length;
  const cancellationRate =
    all.length > 0 ? Math.round((cancelled / all.length) * 100) : 0;

  // New vs recurring patients
  const patientIds = [
    ...new Set(nonCancelled.map((r) => r.patient_id).filter(Boolean)),
  ];
  let newPatients = patientIds.length;
  let recurringPatients = 0;

  if (patientIds.length > 0) {
    const { data: prior } = await supabase
      .from("appointments")
      .select("patient_id")
      .eq("professional_id", professionalId)
      .lt("appointment_date", from)
      .in("patient_id", patientIds as string[]);

    const priorSet = new Set((prior ?? []).map((r) => r.patient_id));
    recurringPatients = patientIds.filter((id) => priorSet.has(id)).length;
    newPatients = patientIds.length - recurringPatients;
  }

  // Daily data (normalized by day-of-month)
  const dailyMap = new Map<number, { count: number; revenue: number }>();
  for (const r of nonCancelled) {
    const day = new Date(r.appointment_date + "T00:00:00").getDate();
    const entry = dailyMap.get(day) ?? { count: 0, revenue: 0 };
    entry.count++;
    entry.revenue += Number(r.price) || 0;
    dailyMap.set(day, entry);
  }

  const dailyData = Array.from(dailyMap.entries())
    .map(([day, d]) => ({ day, ...d }))
    .sort((a, b) => a.day - b.day);

  return {
    appointments: totalAppts,
    revenue,
    newPatients,
    recurringPatients,
    attendanceRate,
    cancellationRate,
    dailyData,
  };
}
