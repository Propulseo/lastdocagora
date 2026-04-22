import { createClient } from "@/lib/supabase/server";
import { subDays, subMonths, format, startOfDay, startOfWeek, startOfMonth } from "date-fns";
import type { PeriodRange, StatisticsData, TopPro } from "./types";

export { type PeriodRange, type StatisticsData, PERIOD_OPTIONS } from "./types";

function getDateRange(range: PeriodRange) {
  const end = new Date();
  let start: Date;
  let bucket: "day" | "week" | "month";
  switch (range) {
    case "7d": start = subDays(end, 7); bucket = "day"; break;
    case "30d": start = subDays(end, 30); bucket = "day"; break;
    case "3m": start = subMonths(end, 3); bucket = "week"; break;
    case "6m": start = subMonths(end, 6); bucket = "month"; break;
    case "1y": start = subMonths(end, 12); bucket = "month"; break;
  }
  const diff = end.getTime() - start.getTime();
  const prevStart = new Date(start.getTime() - diff);
  return { start, end, prevStart, bucket };
}

function bucketDate(dateStr: string, bucket: "day" | "week" | "month"): string {
  const d = new Date(dateStr);
  switch (bucket) {
    case "day": return format(startOfDay(d), "yyyy-MM-dd");
    case "week": return format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
    case "month": return format(startOfMonth(d), "yyyy-MM");
  }
}

function computeRate(num: number, den: number) {
  return den > 0 ? Math.round((num / den) * 100) : 0;
}

export async function fetchStatisticsData(range: PeriodRange): Promise<StatisticsData> {
  const supabase = await createClient();
  const { start, end, prevStart, bucket } = getDateRange(range);
  const startISO = start.toISOString();
  const endISO = end.toISOString();
  const prevStartISO = prevStart.toISOString();
  const startDate = format(start, "yyyy-MM-dd");
  const endDate = format(end, "yyyy-MM-dd");
  const prevStartDate = format(prevStart, "yyyy-MM-dd");
  const twoDaysAgo = subDays(new Date(), 2).toISOString();

  const [
    patientsRes, prosRes, usersRangeRes, allProsRes,
    apptsRangeRes, totalApptsRes, ticketsRes, suspendedRes,
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "patient"),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "professional"),
    supabase.from("users").select("role, created_at")
      .in("role", ["patient", "professional"])
      .gte("created_at", prevStartISO).lte("created_at", endISO),
    supabase.from("professionals").select("id, user_id, verification_status, specialty, city, rating"),
    supabase.from("appointments").select("status, appointment_date, professional_id, created_via")
      .gte("appointment_date", prevStartDate).lte("appointment_date", endDate),
    supabase.from("appointments").select("*", { count: "exact", head: true }),
    supabase.from("support_tickets").select("*", { count: "exact", head: true })
      .in("status", ["open", "in_progress"]).lt("created_at", twoDaysAgo),
    supabase.from("users").select("*", { count: "exact", head: true }).eq("status", "suspended"),
  ]);

  const users = usersRangeRes.data ?? [];
  const pros = allProsRes.data ?? [];
  const appts = apptsRangeRes.data ?? [];

  const curUsers = users.filter(u => u.created_at && new Date(u.created_at) >= start);
  const prevUsers = users.filter(u => u.created_at && new Date(u.created_at) < start);
  const curAppts = appts.filter(a => a.appointment_date >= startDate);
  const prevAppts = appts.filter(a => a.appointment_date < startDate);

  // --- KPIs ---
  const totalPatients = patientsRes.count ?? 0;
  const totalProfessionals = prosRes.count ?? 0;
  const newPatients = curUsers.filter(u => u.role === "patient").length;
  const newPros = curUsers.filter(u => u.role === "professional").length;
  const usersDelta = curUsers.length - prevUsers.length;
  const patientsDelta = newPatients - prevUsers.filter(u => u.role === "patient").length;
  const prosDelta = newPros - prevUsers.filter(u => u.role === "professional").length;

  const verifiedPros = pros.filter(p => p.verification_status === "verified").length;
  const pendingPros = pros.filter(p => p.verification_status === "pending").length;
  const rejectedPros = pros.filter(p => p.verification_status === "rejected").length;

  const totalAppointments = totalApptsRes.count ?? 0;
  const periodAppointments = curAppts.length;

  const verifiedProIds = new Set(pros.filter(p => p.verification_status === "verified").map(p => p.id));
  const prosWithAppts = new Set(curAppts.map(a => a.professional_id));
  const activePros = [...prosWithAppts].filter(id => verifiedProIds.has(id)).length;
  const activityRate = computeRate(activePros, verifiedPros);

  const completedInPeriod = curAppts.filter(a => a.status === "completed").length;
  const completionRate = computeRate(completedInPeriod, periodAppointments);

  // --- Growth chart (cumulative) ---
  // Count all users created BEFORE the period start (baseline)
  const { data: allUsersForGrowth } = await supabase
    .from("users")
    .select("role, created_at")
    .in("role", ["patient", "professional"])
    .lte("created_at", endISO)
    .order("created_at");

  const allU = allUsersForGrowth ?? [];
  const baselinePatients = allU.filter(u => u.created_at && new Date(u.created_at) < start && u.role === "patient").length;
  const baselinePros = allU.filter(u => u.created_at && new Date(u.created_at) < start && u.role === "professional").length;

  // Build bucket keys for the entire period (so there are no gaps)
  const bucketKeys: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    bucketKeys.push(bucketDate(cursor.toISOString(), bucket));
    if (bucket === "day") cursor.setDate(cursor.getDate() + 1);
    else if (bucket === "week") cursor.setDate(cursor.getDate() + 7);
    else cursor.setMonth(cursor.getMonth() + 1);
  }
  // Deduplicate keys while preserving order
  const uniqueKeys = [...new Set(bucketKeys)];

  // Count new registrations per bucket
  const growthMap = new Map<string, { patients: number; professionals: number }>();
  for (const key of uniqueKeys) growthMap.set(key, { patients: 0, professionals: 0 });
  for (const u of curUsers) {
    if (!u.created_at) continue;
    const key = bucketDate(u.created_at, bucket);
    const e = growthMap.get(key);
    if (!e) continue;
    if (u.role === "patient") e.patients++; else e.professionals++;
  }

  // Build cumulative growth array
  let cumPatients = baselinePatients;
  let cumPros = baselinePros;
  const growth = uniqueKeys.map((key) => {
    const e = growthMap.get(key)!;
    cumPatients += e.patients;
    cumPros += e.professionals;
    return { date: key, patients: cumPatients, professionals: cumPros };
  });

  // --- Activity chart ---
  const actMap = new Map<string, { confirmed: number; cancelled: number; noShow: number }>();
  for (const a of curAppts) {
    const key = bucketDate(a.appointment_date, bucket);
    const e = actMap.get(key) ?? { confirmed: 0, cancelled: 0, noShow: 0 };
    if (a.status === "confirmed" || a.status === "completed") e.confirmed++;
    else if (a.status === "cancelled") e.cancelled++;
    else if (a.status === "no-show") e.noShow++;
    actMap.set(key, e);
  }
  const activity = [...actMap.entries()]
    .map(([date, c]) => ({ date, ...c }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // --- Rates ---
  const resolved = (arr: typeof curAppts) =>
    arr.filter(a => ["completed", "cancelled", "no-show"].includes(a.status));
  const curRes = resolved(curAppts);
  const prevRes = resolved(prevAppts);
  const attendance = computeRate(completedInPeriod, curRes.length);
  const cancelledN = curAppts.filter(a => a.status === "cancelled").length;
  const noShowN = curAppts.filter(a => a.status === "no-show").length;
  const cancellation = computeRate(cancelledN, curRes.length);
  const noShowPct = computeRate(noShowN, curRes.length);
  const prevAtt = computeRate(prevAppts.filter(a => a.status === "completed").length, prevRes.length);
  const prevCan = computeRate(prevAppts.filter(a => a.status === "cancelled").length, prevRes.length);
  const prevNS = computeRate(prevAppts.filter(a => a.status === "no-show").length, prevRes.length);

  // --- Booking channel ---
  const patientBookings = curAppts.filter(a => a.created_via === "patient_booking").length;
  const manualBookings = curAppts.filter(a => a.created_via === "manual").length;

  // --- Top professionals ---
  const proApptMap = new Map<string, number>();
  for (const a of curAppts.filter(a => a.status === "completed")) {
    proApptMap.set(a.professional_id, (proApptMap.get(a.professional_id) ?? 0) + 1);
  }
  const topProEntries = [...proApptMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topProUserIds = topProEntries
    .map(([id]) => pros.find(p => p.id === id)?.user_id)
    .filter(Boolean) as string[];

  let proUsersMap = new Map<string, { name: string; avatar_url: string | null }>();
  if (topProUserIds.length > 0) {
    const { data: pu } = await supabase
      .from("users").select("id, first_name, last_name, avatar_url").in("id", topProUserIds);
    for (const u of pu ?? []) proUsersMap.set(u.id, { name: `${u.first_name} ${u.last_name}`, avatar_url: u.avatar_url });
  }
  const topProfessionals: TopPro[] = topProEntries.map(([proId, count]) => {
    const pro = pros.find(p => p.id === proId);
    const proUser = pro ? proUsersMap.get(pro.user_id) : null;
    return {
      name: proUser?.name ?? "\u2014",
      avatar_url: proUser?.avatar_url ?? null,
      specialty: pro?.specialty ?? "\u2014",
      city: pro?.city ?? "\u2014",
      appointmentCount: count,
      rating: Number(pro?.rating ?? 0),
    };
  });

  // --- Top specialties ---
  const specMap = new Map<string, number>();
  for (const a of curAppts) {
    const spec = pros.find(p => p.id === a.professional_id)?.specialty;
    if (spec) specMap.set(spec, (specMap.get(spec) ?? 0) + 1);
  }
  const topSpecialties = [...specMap.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([specialty, count]) => ({ specialty, count }));

  // --- Alerts ---
  const prosWithNoAppts = pros
    .filter(p => p.verification_status === "verified" && !prosWithAppts.has(p.id)).length;

  return {
    kpis: {
      totalUsers: totalPatients + totalProfessionals, usersDelta,
      totalPatients, newPatients, patientsDelta,
      totalProfessionals, verifiedPros, pendingPros, prosDelta,
      totalAppointments, periodAppointments, activityRate, completionRate,
    },
    growth, activity,
    rates: {
      attendance, cancellation, noShow: noShowPct,
      attendanceDelta: attendance - prevAtt,
      cancellationDelta: cancellation - prevCan,
      noShowDelta: noShowPct - prevNS,
    },
    proStatus: { verified: verifiedPros, pending: pendingPros, rejected: rejectedPros },
    bookingChannel: { patient: patientBookings, manual: manualBookings },
    topProfessionals, topSpecialties,
    alerts: {
      pendingVerifications: pendingPros,
      unresolvedTickets48h: ticketsRes.count ?? 0,
      suspendedUsers: suspendedRes.count ?? 0,
      prosWithNoAppointments: prosWithNoAppts,
    },
    range,
  };
}
