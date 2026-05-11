"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Download } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { CreateServiceDialog } from "./create-service-dialog";
import { ServicesKpiCards } from "./ServicesKpiCards";
import { ServicesFiltersBar } from "./ServicesFiltersBar";
const RevenuePerServiceChart = dynamic(() => import("./RevenuePerServiceChart").then(m => m.RevenuePerServiceChart), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full rounded-xl" />,
});
const AppointmentVolumeChart = dynamic(() => import("./AppointmentVolumeChart").then(m => m.AppointmentVolumeChart), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full rounded-xl" />,
});
import { ServicesTable } from "./services-table";
import { ProPageHeader } from "../../../_components/pro-page-header";
import type { ServicesDashboardData } from "../_lib/types";

interface ServicesClientProps {
  data: ServicesDashboardData;
}

export function ServicesClient({ data }: ServicesClientProps) {
  const { t } = useProfessionalI18n();
  const searchParams = useSearchParams();

  const handleExport = () => {
    const params = new URLSearchParams(searchParams.toString());
    window.open(`/pro/services/export?${params.toString()}`, "_blank");
  };

  return (
    <div className="space-y-5">
      <ProPageHeader
        section="services"
        action={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="size-4" />
              {(t.services as unknown as Record<string, string>).export ?? "Export CSV"}
            </Button>
            <CreateServiceDialog />
          </div>
        }
      />

      {/* Filters */}
      <Suspense>
        <ServicesFiltersBar />
      </Suspense>

      {/* KPI Cards */}
      <ServicesKpiCards kpi={data.kpi} />

      {/* Charts Row */}
      <div className="grid gap-5 lg:grid-cols-2">
        <RevenuePerServiceChart data={data.revenuePerService} />
        <AppointmentVolumeChart data={data.appointmentVolume} />
      </div>

      {/* Services Table */}
      <ServicesTable
        services={data.services}
        totalFiltered={data.totalFiltered}
      />
    </div>
  );
}
