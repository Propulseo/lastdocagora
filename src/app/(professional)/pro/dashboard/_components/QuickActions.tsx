"use client";

import Link from "next/link";
import {
  CalendarPlus,
  UserPlus,
  ClipboardList,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SHADOW, RADIUS, SPACING } from "@/lib/design-tokens";
import type { DashboardData } from "../_hooks/useDashboardData";

interface QuickActionsProps {
  data: DashboardData;
}

const actions = [
  {
    icon: CalendarPlus,
    titleKey: "newAppointmentAction" as const,
    descKey: "newAppointmentDesc" as const,
    href: "/pro/agenda?create=true",
    accent: "bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/15",
  },
  {
    icon: UserPlus,
    titleKey: "newPatient" as const,
    descKey: "newPatientDesc" as const,
    href: "/pro/patients",
    accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/15",
  },
  {
    icon: ClipboardList,
    titleKey: "myServices" as const,
    descKey: "myServicesDesc" as const,
    href: "/pro/services",
    accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:bg-violet-500/15",
  },
  {
    icon: BarChart3,
    titleKey: "statistics" as const,
    descKey: "statisticsDesc" as const,
    href: "/pro/statistics",
    accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/15",
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
            className={cn(
              "group flex min-h-[88px] flex-col justify-between gap-3 overflow-hidden border border-border/40 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-border/60 hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]",
              RADIUS.card,
              SHADOW.card,
              SPACING.card_sm,
            )}
          >
            <div className="flex items-start justify-between">
              <div className={cn("flex size-9 items-center justify-center transition-colors", action.accent, RADIUS.element)}>
                <Icon className="size-4" />
              </div>
              <ArrowRight className="size-3.5 -translate-x-1 text-muted-foreground/0 transition-all duration-200 group-hover:translate-x-0 group-hover:text-muted-foreground/60" />
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
