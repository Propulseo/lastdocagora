"use client";

import Link from "next/link";
import {
  CalendarPlus,
  UserPlus,
  ClipboardList,
  BarChart3,
} from "lucide-react";
import type { DashboardData } from "../_hooks/useDashboardData";

interface QuickActionsProps {
  data: DashboardData;
}

const actions = [
  {
    icon: CalendarPlus,
    titleKey: "newAppointmentAction" as const,
    descKey: "newAppointmentDesc" as const,
    href: "/pro/agenda",
  },
  {
    icon: UserPlus,
    titleKey: "newPatient" as const,
    descKey: "newPatientDesc" as const,
    href: "/pro/patients",
  },
  {
    icon: ClipboardList,
    titleKey: "myServices" as const,
    descKey: "myServicesDesc" as const,
    href: "/pro/services",
  },
  {
    icon: BarChart3,
    titleKey: "statistics" as const,
    descKey: "statisticsDesc" as const,
    href: "/pro/statistics",
  },
];

export function QuickActions({ data }: QuickActionsProps) {
  const { t } = data;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className="group flex flex-col gap-2 rounded-xl border border-border/40 bg-card/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_0_0_1px_rgba(99,102,241,0.15),0_4px_12px_rgba(0,0,0,0.15)]"
          >
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
              <Icon className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {t.dashboard[action.titleKey]}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t.dashboard[action.descKey]}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
