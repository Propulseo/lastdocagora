"use client";

import {
  useDashboardData,
  type DashboardProps,
} from "../_hooks/useDashboardData";
import { DashboardHeader } from "./DashboardHeader";
import { KPIStrip } from "./KPIStrip";
import { TodaySchedule } from "./TodaySchedule";
import { ActivityChart } from "./ActivityChart";
import { UtilityWidgets } from "./UtilityWidgets";
import { QuickActions } from "./QuickActions";

export function DashboardClient(props: DashboardProps) {
  const data = useDashboardData(props);

  return (
    <div className="space-y-6 [&>*]:animate-in [&>*]:fade-in [&>*]:slide-in-from-bottom-2 [&>*]:duration-300 [&>*:nth-child(1)]:delay-0 [&>*:nth-child(2)]:delay-[50ms] [&>*:nth-child(3)]:delay-[100ms] [&>*:nth-child(4)]:delay-[150ms]">
      {/* A — Header compact */}
      <DashboardHeader data={data} />

      {/* B — KPI Strip */}
      <KPIStrip data={data} />

      {/* C — Main 3-column grid */}
      <div className="grid min-h-[440px] items-stretch gap-5 grid-cols-1 lg:grid-cols-[35%_40%_25%]">
        <TodaySchedule data={data} />
        <ActivityChart data={data} />
        <UtilityWidgets data={data} />
      </div>

      {/* D — Quick Actions */}
      <QuickActions data={data} />
    </div>
  );
}
