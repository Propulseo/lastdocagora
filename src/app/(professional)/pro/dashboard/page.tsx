import { getCurrentUser, getProfessionalId } from "@/lib/auth";
import { DashboardClient } from "./_components/DashboardClient";
import { fetchDashboardData } from "./dashboard-queries";

export default async function DashboardPage() {
  const [professionalId, user] = await Promise.all([
    getProfessionalId(),
    getCurrentUser(),
  ]);

  const data = await fetchDashboardData(professionalId, user!.id);

  return (
    <DashboardClient
      firstName={data.firstName}
      onboardingCompleted={data.onboardingCompleted}
      todayAppointments={data.todayAppointments}
      yesterdayCount={data.yesterdayCount}
      totalPatients={data.totalPatients}
      pendingCount={data.pendingCount}
      attendanceRate={data.attendanceRate}
      dailyCounts={data.dailyCounts}
      thisWeekCount={data.thisWeekCount}
      lastWeekCount={data.lastWeekCount}
      upcomingAppointments={data.upcomingAppointments}
      recentPatients={data.recentPatients}
      tomorrowCount={data.tomorrowCount}
      unconfirmedNext24h={data.unconfirmedNext24h}
      noShowRate={data.noShowRate}
      nextAvailableSlot={data.nextAvailableSlot}
      reviewsThisMonth={data.reviewsThisMonth}
      reviewsAvgThisMonth={data.reviewsAvgThisMonth}
      reviewsAvgLastMonth={data.reviewsAvgLastMonth}
      followUps={data.followUps}
    />
  );
}
