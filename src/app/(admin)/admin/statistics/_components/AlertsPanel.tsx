"use client";

import Link from "next/link";
import {
  CheckCircle2, ShieldAlert, HeadphonesIcon, UserX, Stethoscope,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { cn } from "@/lib/utils";
import type { StatisticsData } from "../_lib/types";

const alertStyles = {
  orange: "border-l-orange-500 bg-orange-50 dark:bg-orange-950/20",
  red: "border-l-red-500 bg-red-50 dark:bg-red-950/20",
  yellow: "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20",
  blue: "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20",
} as const;

export function AlertsPanel({ alerts }: { alerts: StatisticsData["alerts"] }) {
  const { t } = useAdminI18n();
  const s = t.statistics;

  const plural = (count: number, singular: string, plural: string) =>
    (count === 1 ? singular : plural).replace("{count}", String(count));

  const items = [
    {
      show: alerts.pendingVerifications > 0,
      color: "orange" as const,
      icon: ShieldAlert,
      text: plural(alerts.pendingVerifications, s.alertPendingProsSingular, s.alertPendingPros),
      href: "/admin/professionals?status=pending",
      action: s.verifyAction,
    },
    {
      show: alerts.unresolvedTickets48h > 0,
      color: "red" as const,
      icon: HeadphonesIcon,
      text: plural(alerts.unresolvedTickets48h, s.alertUnresolvedTicketsSingular, s.alertUnresolvedTickets),
      href: "/admin/support",
      action: s.viewTickets,
    },
    {
      show: alerts.suspendedUsers > 0,
      color: "yellow" as const,
      icon: UserX,
      text: plural(alerts.suspendedUsers, s.alertSuspendedUsersSingular, s.alertSuspendedUsers),
      href: "/admin/users?status=suspended",
      action: s.manageAction,
    },
    {
      show: alerts.prosWithNoAppointments > 0,
      color: "blue" as const,
      icon: Stethoscope,
      text: plural(alerts.prosWithNoAppointments, s.alertInactiveProsSingular, s.alertInactivePros),
    },
  ].filter((a) => a.show);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{s.alertsTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="size-5" />
            <span className="text-sm font-medium">{s.allClear}</span>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, i) => (
              <div
                key={i}
                className={cn(
                  "flex h-12 items-center justify-between rounded-lg border-l-4 px-4",
                  alertStyles[item.color],
                )}
              >
                <div className="flex items-center gap-2">
                  <item.icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm">{item.text}</span>
                </div>
                {"href" in item && item.href && "action" in item && item.action && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={item.href}>{item.action} &rarr;</Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
