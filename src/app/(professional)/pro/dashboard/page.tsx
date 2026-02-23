import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CalendarCheck,
  Users,
  Clock,
  TrendingUp,
  ArrowRight,
  CalendarPlus,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";

export default async function DashboardPage() {
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

  const today = new Date().toISOString().split("T")[0];

  const [
    { data: todayAppointments },
    { count: totalPatients },
    { count: pendingCount },
    { data: rateData },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, appointment_date, appointment_time, duration_minutes, status, consultation_type, notes, patients(first_name, last_name), services(name)"
      )
      .eq("professional_id", professional.id)
      .eq("appointment_date", today)
      .order("appointment_time", { ascending: true }),
    supabase
      .from("appointments")
      .select("patient_id", { count: "exact", head: true })
      .eq("professional_id", professional.id),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", professional.id)
      .eq("status", "pending"),
    supabase.rpc("calculate_attendance_rate", { prof_id: professional.id }),
  ]);

  const attendanceRate = rateData !== null ? Number(rateData) : 0;
  const appointments = todayAppointments ?? [];
  const todayCount = appointments.length;

  const kpis = [
    {
      label: "Consultas Hoje",
      value: todayCount,
      icon: CalendarCheck,
      description: new Date().toLocaleDateString("pt-PT", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Total Pacientes",
      value: totalPatients ?? 0,
      icon: Users,
      description: "Pacientes unicos",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Pendentes",
      value: pendingCount ?? 0,
      icon: Clock,
      description: "A aguardar confirmacao",
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      label: "Taxa de Presenca",
      value: `${Math.round(attendanceRate)}%`,
      icon: TrendingUp,
      description: "Historico geral",
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visao geral da sua atividade"
        action={
          <Button asChild>
            <Link href="/pro/agenda">
              <CalendarPlus className="mr-2 size-4" />
              Ver agenda
            </Link>
          </Button>
        }
      />

      {/* KPI Cards */}
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

      {/* Today's Appointments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Consultas de Hoje</CardTitle>
            <CardDescription>
              {todayCount === 0
                ? "Sem consultas agendadas para hoje"
                : `${todayCount} consulta${todayCount > 1 ? "s" : ""} agendada${todayCount > 1 ? "s" : ""}`}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pro/agenda">
              Ver todas
              <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="Dia livre"
              description="Nenhuma consulta agendada para hoje."
            />
          ) : (
            <div className="space-y-2">
              {appointments.map((apt) => {
                const patient = apt.patients as {
                  first_name: string | null;
                  last_name: string | null;
                } | null;
                const service = apt.services as { name: string } | null;
                return (
                  <div
                    key={apt.id}
                    className="group flex items-center justify-between rounded-lg border border-border/60 p-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold tabular-nums text-primary">
                        {apt.appointment_time?.slice(0, 5)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {patient?.first_name} {patient?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {service?.name ?? apt.consultation_type} &middot;{" "}
                          {apt.duration_minutes} min
                        </p>
                      </div>
                    </div>
                    <StatusBadge type="appointment" value={apt.status} />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
