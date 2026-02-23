import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  UserX,
  TrendingDown,
  Percent,
  Star,
  BarChart3,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

interface ProStatistics {
  total_appointments?: number;
  completed_appointments?: number;
  cancelled_appointments?: number;
  no_show_appointments?: number;
  cancellation_rate?: number;
  occupancy_rate?: number;
  avg_rating?: number;
  total_revenue?: number;
}

export default async function StatisticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) redirect("/login");

  const now = new Date();
  const fromDate = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const toDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
  const monthLabel = now.toLocaleDateString("pt-PT", {
    month: "long",
    year: "numeric",
  });

  let stats: ProStatistics = {};
  const { data: rpcData } = await supabase.rpc("get_pro_statistics", {
    p_professional_id: professional.id,
    p_from_date: fromDate,
    p_to_date: toDate,
  });

  if (rpcData && typeof rpcData === "object") {
    stats = rpcData as ProStatistics;
  }

  const kpis = [
    {
      label: "Total Consultas",
      value: stats.total_appointments ?? 0,
      icon: CalendarCheck,
      description: `Em ${monthLabel}`,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Concluidas",
      value: stats.completed_appointments ?? 0,
      icon: CheckCircle,
      description: "Consultas realizadas",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Canceladas",
      value: stats.cancelled_appointments ?? 0,
      icon: XCircle,
      description: "Consultas canceladas",
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      label: "Nao Compareceu",
      value: stats.no_show_appointments ?? 0,
      icon: UserX,
      description: "Pacientes ausentes",
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      label: "Taxa Cancelamento",
      value: `${Math.round((stats.cancellation_rate ?? 0) * 100)}%`,
      icon: TrendingDown,
      description: "Percentagem de cancelamentos",
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
    },
    {
      label: "Taxa Ocupacao",
      value: `${Math.round((stats.occupancy_rate ?? 0) * 100)}%`,
      icon: Percent,
      description: "Slots preenchidos",
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      label: "Avaliacao Media",
      value: stats.avg_rating ? stats.avg_rating.toFixed(1) : "-",
      icon: Star,
      description: "Nota dos pacientes",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      label: "Receita",
      value: stats.total_revenue
        ? `${stats.total_revenue.toFixed(2)} \u20ac`
        : `0.00 \u20ac`,
      icon: BarChart3,
      description: `Receita em ${monthLabel}`,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estatisticas"
        description={monthLabel}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="relative overflow-hidden">
            <CardContent className="flex items-start gap-4 pt-6">
              <div className={`rounded-xl p-2.5 ${kpi.iconBg}`}>
                <kpi.icon className={`size-5 ${kpi.iconColor}`} />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">
                  {kpi.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <MonthlyStatsCard professionalId={professional.id} />
    </div>
  );
}

async function MonthlyStatsCard({
  professionalId,
}: {
  professionalId: string;
}) {
  const supabase = await createClient();

  const { data: monthlyStats } = await supabase
    .from("professional_monthly_stats")
    .select("*")
    .eq("professional_id", professionalId)
    .order("month", { ascending: false })
    .limit(6);

  const stats = monthlyStats ?? [];

  if (stats.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historico Mensal</CardTitle>
        <CardDescription>Ultimos 6 meses de atividade</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => {
            const month = s.month
              ? new Date(s.month + "-01").toLocaleDateString("pt-PT", {
                  month: "long",
                  year: "numeric",
                })
              : "Desconhecido";
            const total = s.total_appointments ?? 0;
            const completed = s.completed_appointments ?? 0;
            const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
            return (
              <div
                key={s.month}
                className="space-y-3 rounded-xl border border-border/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium capitalize">{month}</p>
                  <span className="text-xs font-medium text-muted-foreground">
                    {rate}% concluido
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>Total:</span>
                  <span className="text-right font-medium text-foreground">
                    {total}
                  </span>
                  <span>Concluidas:</span>
                  <span className="text-right font-medium text-emerald-600">
                    {completed}
                  </span>
                  <span>Canceladas:</span>
                  <span className="text-right font-medium text-red-600">
                    {s.cancelled_appointments ?? 0}
                  </span>
                  <span>Receita:</span>
                  <span className="text-right font-medium text-foreground">
                    {(s.total_revenue ?? 0).toFixed(2)} &euro;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
