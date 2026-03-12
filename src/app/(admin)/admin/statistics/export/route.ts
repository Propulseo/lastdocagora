import { NextRequest, NextResponse } from "next/server";
import { fetchStatisticsData, type PeriodRange, PERIOD_OPTIONS } from "../_lib/queries";

export async function GET(request: NextRequest) {
  const range = request.nextUrl.searchParams.get("range") as PeriodRange;
  if (!PERIOD_OPTIONS.includes(range)) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  const data = await fetchStatisticsData(range);

  const rows: string[][] = [
    ["Metric", "Value"],
    ["Total Users", String(data.kpis.totalUsers)],
    ["Total Patients", String(data.kpis.totalPatients)],
    ["New Patients (period)", String(data.kpis.newPatients)],
    ["Total Professionals", String(data.kpis.totalProfessionals)],
    ["Verified Professionals", String(data.kpis.verifiedPros)],
    ["Pending Professionals", String(data.kpis.pendingPros)],
    ["Total Appointments", String(data.kpis.totalAppointments)],
    ["Period Appointments", String(data.kpis.periodAppointments)],
    ["Activity Rate", `${data.kpis.activityRate}%`],
    ["Completion Rate", `${data.kpis.completionRate}%`],
    ["Attendance Rate", `${data.rates.attendance}%`],
    ["Cancellation Rate", `${data.rates.cancellation}%`],
    ["No-Show Rate", `${data.rates.noShow}%`],
    [],
    ["--- Growth Data ---"],
    ["Date", "Patients", "Professionals"],
    ...data.growth.map(g => [g.date, String(g.patients), String(g.professionals)]),
    [],
    ["--- Activity Data ---"],
    ["Date", "Confirmed", "Cancelled", "No-Show"],
    ...data.activity.map(a => [a.date, String(a.confirmed), String(a.cancelled), String(a.noShow)]),
    [],
    ["--- Top Specialties ---"],
    ["Specialty", "Count"],
    ...data.topSpecialties.map(s => [s.specialty, String(s.count)]),
    [],
    ["--- Top Professionals ---"],
    ["Name", "Specialty", "City", "Appointments", "Rating"],
    ...data.topProfessionals.map(p => [
      p.name, p.specialty, p.city, String(p.appointmentCount), p.rating.toFixed(1),
    ]),
  ];

  const csv = rows.map(r => r.join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="docagora-statistics-${range}.csv"`,
    },
  });
}
