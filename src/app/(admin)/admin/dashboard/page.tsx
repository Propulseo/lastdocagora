import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShieldCheck, Calendar, CalendarCheck, HeadphonesIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "./_components/kpi-card";
import { SystemAlerts } from "./_components/system-alerts";
import { TopProfessionalsTable } from "./_components/top-professionals-table";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: stats }, { data: topProfessionals }, { count: todayCount }] =
    await Promise.all([
      supabase.from("platform_stats").select("*").single(),
      supabase.from("top_professionals").select("*").limit(10),
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("appointment_date", new Date().toISOString().slice(0, 10)),
    ]);

  const kpis = [
    { label: "Total Utilizadores", value: stats?.total_patients ?? 0, icon: Users },
    { label: "Profissionais Verificados", value: stats?.verified_professionals ?? 0, icon: ShieldCheck },
    { label: "Consultas Este Mes", value: stats?.appointments_this_month ?? 0, icon: Calendar },
    { label: "Consultas Hoje", value: todayCount ?? 0, icon: CalendarCheck },
    { label: "Tickets Abertos", value: stats?.open_tickets ?? 0, icon: HeadphonesIcon },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel"
        description="Visao geral da plataforma DOCAGORA"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <SystemAlerts />

      <Card>
        <CardHeader>
          <CardTitle>Top Profissionais</CardTitle>
        </CardHeader>
        <CardContent>
          <TopProfessionalsTable data={(topProfessionals ?? []) as never[]} />
        </CardContent>
      </Card>
    </div>
  );
}
