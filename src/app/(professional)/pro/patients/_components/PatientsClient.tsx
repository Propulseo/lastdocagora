"use client";

import { Suspense } from "react";
import { Download } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { CreatePatientDialog } from "./create-patient-dialog";
import { PatientsKpiCards } from "./PatientsKpiCards";
import { PatientsFiltersBar } from "./PatientsFiltersBar";
import { PatientAcquisitionChart } from "./PatientAcquisitionChart";
import { InsuranceDistributionChart } from "./InsuranceDistributionChart";
import { AppointmentFrequencyChart } from "./AppointmentFrequencyChart";
import { PatientsTable } from "./patients-table";
import type { PatientsDashboardData } from "../_lib/types";

interface PatientsClientProps {
  data: PatientsDashboardData;
}

export function PatientsClient({ data }: PatientsClientProps) {
  const { t } = useProfessionalI18n();
  const searchParams = useSearchParams();

  const handleExport = () => {
    const params = new URLSearchParams(searchParams.toString());
    window.open(`/pro/patients/export?${params.toString()}`, "_blank");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t.patients.title}
        description={t.patients.description}
        action={
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="size-4" />
              {t.patients.export}
            </Button>
            <CreatePatientDialog />
          </div>
        }
      />

      {/* Filters */}
      <Suspense>
        <PatientsFiltersBar
          insuranceProviders={data.filterOptions.insuranceProviders}
        />
      </Suspense>

      {/* KPI Cards */}
      <PatientsKpiCards kpi={data.kpi} />

      {/* Charts Row */}
      <div className="grid gap-5 lg:grid-cols-2">
        <PatientAcquisitionChart data={data.acquisitionTrends} />
        <InsuranceDistributionChart data={data.insuranceBreakdown} />
      </div>

      {/* Full-width frequency chart */}
      <AppointmentFrequencyChart data={data.frequencyDistribution} />

      {/* Patients Table with Pagination */}
      <PatientsTable
        patients={data.patients}
        totalUnfiltered={data.totalUnfiltered}
      />
    </div>
  );
}
