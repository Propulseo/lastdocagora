"use client";

import Link from "next/link";
import { ShieldCheck, HeadphonesIcon, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface DashboardAlertsProps {
  pendingVerifications: number;
  openTickets: number;
}

export function DashboardAlerts({
  pendingVerifications,
  openTickets,
}: DashboardAlertsProps) {
  const { t } = useAdminI18n();

  const pv = pendingVerifications;
  const ot = openTickets;

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

  if (alerts.length === 0) return null;

  return (
    <div
      className="rounded-lg border border-border bg-card"
      style={{
        animation: "admin-fade-up 0.4s ease-out both",
        animationDelay: "400ms",
      }}
    >
      {alerts.map((alert, i) => (
        <Link
          key={alert.href}
          href={alert.href}
          className={cn(
            "group flex items-center gap-3 px-5 py-3 transition-colors duration-150 hover:bg-accent/30",
            i > 0 && "border-t border-border"
          )}
        >
          <alert.icon className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-sm">{alert.text}</span>
          <ArrowRight className="size-3.5 text-muted-foreground/40 transition-transform duration-150 group-hover:translate-x-0.5" />
        </Link>
      ))}
    </div>
  );
}
