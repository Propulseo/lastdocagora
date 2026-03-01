"use client";

import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface AppointmentRow {
  id: string;
  patient_name: string;
  professional_name: string;
  date: string;
  time: string;
  status: string;
}

interface AppointmentsTableProps {
  data: AppointmentRow[];
}

export function AppointmentsTable({ data }: AppointmentsTableProps) {
  const { t } = useAdminI18n();
  const dateLocale = t.common.dateLocale as "pt-PT" | "fr-FR";

  const columns: ColumnDef<AppointmentRow>[] = [
    {
      key: "patient",
      header: t.appointments.tablePatient,
      render: (row) => (
        <span className="font-medium">{row.patient_name}</span>
      ),
    },
    {
      key: "professional",
      header: t.appointments.tableProfessional,
      render: (row) => row.professional_name,
    },
    {
      key: "date",
      header: t.appointments.tableDate,
      render: (row) => new Date(row.date).toLocaleDateString(dateLocale),
    },
    {
      key: "time",
      header: t.appointments.tableTime,
      render: (row) => row.time,
    },
    {
      key: "status",
      header: t.common.status,
      render: (row) => (
        <StatusBadge
          type="appointment"
          value={row.status}
          labels={t.statuses.appointment}
        />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      rowKey={(row) => row.id}
      emptyTitle={t.appointments.emptyTitle}
      emptyDescription={t.common.noResultsHint}
    />
  );
}
