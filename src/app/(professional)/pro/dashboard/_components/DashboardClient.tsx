"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarCheck,
  Users,
  Clock,
  TrendingUp,
  ArrowRight,
  CalendarPlus,
  Stethoscope,
} from "lucide-react";
import { KPICard } from "@/components/shared/kpi-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useProfessionalI18n } from "@/lib/i18n/pro";

interface Appointment {
  id: string;
  appointment_date: string | null;
  appointment_time: string | null;
  duration_minutes: number | null;
  status: string | null;
  consultation_type: string | null;
  notes: string | null;
  patients: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  services: {
    name: string;
  } | null;
}

interface DashboardClientProps {
  todayAppointments: Appointment[];
  totalPatients: number;
  pendingCount: number;
  attendanceRate: number;
}

export function DashboardClient({
  todayAppointments,
  totalPatients,
  pendingCount,
  attendanceRate,
}: DashboardClientProps) {
  const { t } = useProfessionalI18n();

  const todayCount = todayAppointments.length;

  const dateLocale = t.common.dateLocale as "pt-PT" | "fr-FR";

  const formattedDate = new Date().toLocaleDateString(dateLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 md:p-8">
        <div className="absolute -right-8 -top-8 size-40 rounded-full bg-primary/5 blur-2xl" />
        <div className="absolute -bottom-10 right-16 size-32 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-full bg-primary/15">
                <Stethoscope className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{t.dashboard.title}</h1>
                <p className="text-sm capitalize text-muted-foreground">
                  {formattedDate}
                </p>
              </div>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              {t.dashboard.description}
            </p>
          </div>
          <Button size="lg" asChild className="w-fit shrink-0">
            <Link href="/pro/agenda">
              <CalendarPlus className="mr-2 size-4" />
              {t.dashboard.viewAgenda}
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          icon={CalendarCheck}
          label={t.dashboard.appointmentsToday}
          value={todayCount}
          description={new Date().toLocaleDateString(dateLocale, {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
          iconVariant="blue"
        />
        <KPICard
          icon={Users}
          label={t.dashboard.totalPatients}
          value={totalPatients}
          description={t.dashboard.uniquePatients}
          iconVariant="green"
        />
        <KPICard
          icon={Clock}
          label={t.dashboard.pending}
          value={pendingCount}
          description={t.dashboard.awaitingConfirmation}
          iconVariant="amber"
        />
        <KPICard
          icon={TrendingUp}
          label={t.dashboard.attendanceRate}
          value={`${Math.round(attendanceRate)}%`}
          description={t.dashboard.generalHistory}
          iconVariant="default"
        />
      </div>

      {/* Today's Schedule Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{t.dashboard.todaySchedule}</CardTitle>
            <Badge variant="secondary" className="tabular-nums">
              {todayCount}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/pro/agenda">
              {t.dashboard.viewAll}
              <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title={t.dashboard.freeDay}
              description={t.dashboard.noAppointmentsToday}
              action={
                <Button variant="outline" size="sm" asChild>
                  <Link href="/pro/agenda">
                    <CalendarPlus className="mr-2 size-4" />
                    {t.dashboard.checkAgenda}
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {todayAppointments.map((apt) => {
                const patient = apt.patients;
                const service = apt.services;
                return (
                  <div
                    key={apt.id}
                    className="group flex items-center justify-between rounded-lg border border-border/60 border-l-4 border-l-primary p-0 transition-all hover:translate-x-1 hover:bg-accent/50 hover:shadow-sm"
                  >
                    <div className="flex items-stretch gap-0">
                      {/* Left time column */}
                      <div className="flex w-20 shrink-0 flex-col items-center justify-center border-r border-border/40 px-3 py-3">
                        <span className="text-lg font-bold tabular-nums text-primary">
                          {apt.appointment_time?.slice(0, 5)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {apt.duration_minutes} {t.common.min}
                        </span>
                      </div>
                      {/* Patient and service info */}
                      <div className="flex flex-col justify-center px-4 py-3">
                        <p className="text-sm font-medium">
                          {patient?.first_name} {patient?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {service?.name ?? apt.consultation_type}
                        </p>
                      </div>
                    </div>
                    {/* Status badge at far right */}
                    <div className="pr-4">
                      <StatusBadge type="appointment" value={apt.status} />
                    </div>
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
