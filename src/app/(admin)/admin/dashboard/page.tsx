import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./_components/DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { data: stats },
    { data: topProfessionals },
    { count: todayCount },
    { count: pendingVerifications },
    { count: openTickets },
  ] = await Promise.all([
    supabase.from("platform_stats").select("*").single(),
    supabase.from("top_professionals").select("*").limit(10),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("appointment_date", new Date().toISOString().slice(0, 10)),
    supabase
      .from("professionals")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "pending"),
    supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .in("status", ["open", "in_progress"]),
  ]);

  return (
    <DashboardClient
      stats={stats}
      topProfessionals={(topProfessionals ?? []) as never[]}
      todayCount={todayCount ?? null}
      pendingVerifications={pendingVerifications ?? null}
      openTickets={openTickets ?? null}
    />
  );
}
