"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  ShieldCheck,
  Calendar,
  CalendarCheck,
  HeadphonesIcon,
  AlertCircle,
} from "lucide-react";
import { KPICard } from "@/components/shared/kpi-card";
import { TopProfessionalsTable } from "./top-professionals-table";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface DashboardClientProps {
  stats: {
    total_patients: number | null;
    verified_professionals: number | null;
    appointments_this_month: number | null;
    open_tickets: number | null;
  } | null;
  topProfessionals: never[];
  todayCount: number | null;
  pendingVerifications: number | null;
  openTickets: number | null;
}

export function DashboardClient({
  stats,
  topProfessionals,
  todayCount,
  pendingVerifications,
  openTickets,
}: DashboardClientProps) {
  const { t } = useAdminI18n();

  const dateLocale = t.common.dateLocale as "pt-PT" | "fr-FR";

  const today = new Date().toLocaleDateString(dateLocale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const todayShort = new Date().toLocaleDateString(dateLocale, {
    day: "numeric",
    month: "short",
  });

  const kpis = [
    {
      label: t.dashboard.kpiTotalUsers,
      value: stats?.total_patients ?? 0,
      icon: Users,
      iconVariant: "blue" as const,
      description: t.dashboard.kpiTotalUsersDesc,
    },
    {
      label: t.dashboard.kpiVerifiedPros,
      value: stats?.verified_professionals ?? 0,
      icon: ShieldCheck,
      iconVariant: "green" as const,
      description: t.dashboard.kpiVerifiedProsDesc,
    },
    {
      label: t.dashboard.kpiMonthlyAppointments,
      value: stats?.appointments_this_month ?? 0,
      icon: Calendar,
      iconVariant: "default" as const,
      description: t.dashboard.kpiMonthlyAppointmentsDesc,
    },
    {
      label: t.dashboard.kpiTodayAppointments,
      value: todayCount ?? 0,
      icon: CalendarCheck,
      iconVariant: "amber" as const,
      description: todayShort,
    },
    {
      label: t.dashboard.kpiOpenTickets,
      value: stats?.open_tickets ?? 0,
      icon: HeadphonesIcon,
      iconVariant: "red" as const,
      description: t.dashboard.kpiOpenTicketsDesc,
    },
  ];

  const pv = pendingVerifications ?? 0;
  const ot = openTickets ?? 0;

  const alerts = [
    {
      show: pv > 0,
      icon: ShieldCheck,
      text: (pv === 1
        ? t.dashboard.alertPendingVerification
        : t.dashboard.alertPendingVerifications
      ).replace("{count}", String(pv)),
      href: "/admin/professionals?status=pending",
    },
    {
      show: ot > 0,
      icon: HeadphonesIcon,
      text: (ot === 1
        ? t.dashboard.alertOpenTicket
        : t.dashboard.alertOpenTickets
      ).replace("{count}", String(ot)),
      href: "/admin/support",
    },
  ].filter((a) => a.show);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {t.dashboard.title}
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm capitalize">
            {today}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        {alerts.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="text-admin-warning size-4" />
                {t.dashboard.alertsTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {alerts.map((alert) => (
                <Link
                  key={alert.href}
                  href={alert.href}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
                >
                  <alert.icon className="size-4 shrink-0" />
                  {alert.text}
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.topProfessionals}</CardTitle>
            <CardDescription>
              {t.dashboard.topProfessionalsDesc}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopProfessionalsTable data={topProfessionals} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
