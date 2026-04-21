import { createClient } from "@/lib/supabase/server";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  subMonths,
  endOfMonth,
  addDays,
} from "date-fns";

export async function fetchDashboardData(professionalId: string, userId: string) {
  const supabase = await createClient();
  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  const yesterdayStr = format(subDays(now, 1), "yyyy-MM-dd");
  const sevenDaysAgoStr = format(subDays(now, 6), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const lastWeekStart = format(
    startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  );
  const lastWeekEnd = format(
    endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  );
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const lastMonthStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd");
  const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd");
  const tomorrowStr = format(addDays(now, 1), "yyyy-MM-dd");
  const nowTimeStr = format(now, "HH:mm:ss");

  const apptFields =
    "id, appointment_date, appointment_time, duration_minutes, status, consultation_type, patients(id, first_name, last_name), services(name)";

  const [
    { data: userProfile },
    { data: proProfile },
    { data: todayAppts },
    { count: yesterdayCount },
    { count: tomorrowCount },
    { data: patientIds },
    { count: pendingCount },
    { data: rateData },
    { data: last7Days },
    { count: thisWeekCount },
    { count: lastWeekCount },
    { data: upcomingRaw },
    { data: recentRaw },
    { count: unconfirmedCount },
    { data: monthAppts },
    { data: nextSlotData },
    { data: reviewsThisMonthRaw },
    { data: reviewsLastMonthRaw },
    { data: followUpRaw },
  ] = await Promise.all([
    supabase.from("users").select("first_name").eq("id", userId).single(),
    supabase.from("professionals").select("onboarding_completed").eq("id", professionalId).single(),
    supabase.from("appointments").select(apptFields)
      .eq("professional_id", professionalId).eq("appointment_date", todayStr)
      .order("appointment_time", { ascending: true }),
    supabase.from("appointments").select("id", { count: "exact", head: true })
      .eq("professional_id", professionalId).eq("appointment_date", yesterdayStr).neq("status", "cancelled"),
    supabase.from("appointments").select("id", { count: "exact", head: true })
      .eq("professional_id", professionalId).eq("appointment_date", tomorrowStr).neq("status", "cancelled"),
    supabase.from("appointments").select("patient_id")
      .eq("professional_id", professionalId).not("patient_id", "is", null),
    supabase.from("appointments").select("id", { count: "exact", head: true })
      .eq("professional_id", professionalId).eq("status", "pending"),
    supabase.rpc("calculate_attendance_rate", { prof_id: professionalId }),
    supabase.from("appointments").select("appointment_date")
      .eq("professional_id", professionalId).gte("appointment_date", sevenDaysAgoStr)
      .lte("appointment_date", todayStr).neq("status", "cancelled"),
    supabase.from("appointments").select("id", { count: "exact", head: true })
      .eq("professional_id", professionalId).gte("appointment_date", weekStart)
      .lte("appointment_date", todayStr).neq("status", "cancelled"),
    supabase.from("appointments").select("id", { count: "exact", head: true })
      .eq("professional_id", professionalId).gte("appointment_date", lastWeekStart)
      .lte("appointment_date", lastWeekEnd).neq("status", "cancelled"),
    supabase.from("appointments").select(apptFields)
      .eq("professional_id", professionalId).gte("appointment_date", todayStr)
      .neq("status", "cancelled").neq("status", "completed")
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true }).limit(10),
    supabase.from("appointments")
      .select("patient_id, appointment_date, patients(id, first_name, last_name)")
      .eq("professional_id", professionalId).eq("status", "completed")
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false }).limit(20),
    supabase.from("appointments").select("id", { count: "exact", head: true })
      .eq("professional_id", professionalId).gte("appointment_date", todayStr)
      .lte("appointment_date", tomorrowStr).in("status", ["pending", "scheduled"]),
    supabase.from("appointments").select("status")
      .eq("professional_id", professionalId).gte("appointment_date", monthStart)
      .lte("appointment_date", todayStr),
    supabase.rpc("get_next_available_slot", { p_professional_id: professionalId }),
    supabase.from("reviews").select("rating")
      .eq("professional_id", professionalId).gte("created_at", monthStart),
    supabase.from("reviews").select("rating")
      .eq("professional_id", professionalId).gte("created_at", lastMonthStart)
      .lte("created_at", lastMonthEnd),
    (supabase as unknown as { from: (table: string) => ReturnType<typeof supabase.from> })
      .from("consultation_notes")
      .select("id, patient_id, follow_up_suggested_date, patients(first_name, last_name)")
      .eq("professional_id", professionalId).eq("follow_up_needed", true)
      .order("follow_up_suggested_date", { ascending: true }).limit(10),
  ]);

  // Distinct patient count
  const totalPatients = new Set(
    (patientIds ?? []).map((a) => a.patient_id)
  ).size;

  // Daily counts for chart (last 7 days)
  const dateMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    dateMap[format(subDays(now, i), "yyyy-MM-dd")] = 0;
  }
  for (const a of last7Days ?? []) {
    if (a.appointment_date && dateMap[a.appointment_date] !== undefined) {
      dateMap[a.appointment_date]++;
    }
  }
  const dailyCounts = Object.entries(dateMap).map(([date, count]) => ({
    date,
    count,
  }));

  // Recent patients (deduplicate)
  const seenIds = new Set<string>();
  const recentPatients: {
    id: string;
    firstName: string;
    lastName: string;
    lastVisit: string;
  }[] = [];
  for (const a of recentRaw ?? []) {
    const p = a.patients as {
      id: string;
      first_name: string | null;
      last_name: string | null;
    } | null;
    if (a.patient_id && !seenIds.has(a.patient_id) && p) {
      seenIds.add(a.patient_id);
      recentPatients.push({
        id: p.id,
        firstName: p.first_name ?? "",
        lastName: p.last_name ?? "",
        lastVisit: a.appointment_date,
      });
      if (recentPatients.length >= 3) break;
    }
  }

  // No-show rate this month
  const month = monthAppts ?? [];
  const nonCancelled = month.filter((a) => a.status !== "cancelled");
  const noShows = nonCancelled.filter((a) => a.status === "no-show");
  const noShowRate =
    nonCancelled.length > 0
      ? (noShows.length / nonCancelled.length) * 100
      : 0;

  // Filter upcoming: exclude past times for today
  const upcoming = (upcomingRaw ?? [])
    .filter((a: { appointment_date: string; appointment_time: string | null }) => {
      if (a.appointment_date === todayStr && a.appointment_time) {
        return a.appointment_time > nowTimeStr;
      }
      return true;
    })
    .slice(0, 3);

  // Reviews aggregation
  const reviewsThisMonth = reviewsThisMonthRaw ?? [];
  const reviewsThisMonthCount = reviewsThisMonth.length;
  const reviewsAvgThisMonth =
    reviewsThisMonthCount > 0
      ? reviewsThisMonth.reduce((sum, r) => sum + r.rating, 0) / reviewsThisMonthCount
      : 0;
  const reviewsLastMonth = reviewsLastMonthRaw ?? [];
  const reviewsAvgLastMonth =
    reviewsLastMonth.length > 0
      ? reviewsLastMonth.reduce((sum, r) => sum + r.rating, 0) / reviewsLastMonth.length
      : 0;

  // Follow-up suggestions
  const followUps = ((followUpRaw ?? []) as unknown as Array<{
    id: string;
    patient_id: string;
    follow_up_suggested_date: string | null;
    patients: { first_name: string | null; last_name: string | null } | null;
  }>)
    .filter((n) => n.follow_up_suggested_date && n.patients)
    .map((n) => ({
      noteId: n.id,
      patientId: n.patient_id,
      patientFirstName: n.patients!.first_name ?? "",
      patientLastName: n.patients!.last_name ?? "",
      followUpDate: n.follow_up_suggested_date!,
    }));

  return {
    firstName: userProfile?.first_name ?? "",
    onboardingCompleted: proProfile?.onboarding_completed ?? false,
    todayAppointments: (todayAppts ?? []) as never[],
    yesterdayCount: yesterdayCount ?? 0,
    totalPatients,
    pendingCount: pendingCount ?? 0,
    attendanceRate: rateData !== null ? Number(rateData) : 0,
    dailyCounts,
    thisWeekCount: thisWeekCount ?? 0,
    lastWeekCount: lastWeekCount ?? 0,
    upcomingAppointments: upcoming as never[],
    recentPatients,
    tomorrowCount: tomorrowCount ?? 0,
    unconfirmedNext24h: unconfirmedCount ?? 0,
    noShowRate,
    nextAvailableSlot: typeof nextSlotData === "string" ? nextSlotData : null,
    reviewsThisMonth: reviewsThisMonthCount,
    reviewsAvgThisMonth,
    reviewsAvgLastMonth,
    followUps,
  };
}
