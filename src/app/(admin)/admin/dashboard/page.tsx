import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardClient } from "./_components/DashboardClient";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [
    { data: profile },
    { data: stats },
    { data: topProfessionals },
    { count: todayCount },
    { count: pendingVerifications },
    { count: openTickets },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("first_name")
      .eq("id", user.id)
      .single(),
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
      firstName={profile?.first_name ?? "Admin"}
      stats={stats}
      topProfessionals={(topProfessionals ?? []) as never[]}
      todayCount={todayCount ?? null}
      pendingVerifications={pendingVerifications ?? null}
      openTickets={openTickets ?? null}
    />
  );
}
