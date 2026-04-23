"use client";

import Link from "next/link";
import {
  ShieldAlert, HeadphonesIcon, UserX, Stethoscope, ArrowRight,
} from "lucide-react";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import type { StatisticsData } from "../_lib/types";

export function AlertsPanel({ alerts }: { alerts: StatisticsData["alerts"] }) {
  const { t } = useAdminI18n();
  const s = t.statistics;

  const plural = (count: number, singular: string, pluralStr: string) =>
    (count === 1 ? singular : pluralStr).replace("{count}", String(count));

  const items = [
    {
      show: alerts.pendingVerifications > 0,
      icon: ShieldAlert,
      text: plural(alerts.pendingVerifications, s.alertPendingProsSingular, s.alertPendingPros),
      href: "/admin/professionals?status=pending",
      action: s.verifyAction,
    },
    {
      show: alerts.unresolvedTickets48h > 0,
      icon: HeadphonesIcon,
      text: plural(alerts.unresolvedTickets48h, s.alertUnresolvedTicketsSingular, s.alertUnresolvedTickets),
      href: "/admin/support",
      action: s.viewTickets,
    },
    {
      show: alerts.suspendedUsers > 0,
      icon: UserX,
      text: plural(alerts.suspendedUsers, s.alertSuspendedUsersSingular, s.alertSuspendedUsers),
      href: "/admin/users?status=suspended",
      action: s.manageAction,
    },
    {
      show: alerts.prosWithNoAppointments > 0,
      icon: Stethoscope,
      text: plural(alerts.prosWithNoAppointments, s.alertInactiveProsSingular, s.alertInactivePros),
    },
  ].filter((a) => a.show);

  if (items.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold">{s.alertsTitle}</h3>
      </div>
      <div>
        {items.map((item, i) => (
          <div
            key={i}
            className={`flex items-center justify-between px-5 py-3 ${
              i > 0 ? "border-t border-border" : ""
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <item.icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-sm">{item.text}</span>
            </div>
            {"href" in item && item.href && "action" in item && item.action && (
              <Link
                href={item.href}
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-4"
              >
                {item.action}
                <ArrowRight className="size-3" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
