"use client";

import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface TopProfessional {
  id: string;
  name: string | null;
  specialty: string | null;
  city: string | null;
  average_rating: number | null;
  total_appointments: number | null;
  total_reviews: number | null;
}

interface TopProfessionalsTableProps {
  data: TopProfessional[];
}

export function TopProfessionalsTable({ data }: TopProfessionalsTableProps) {
  const { t } = useAdminI18n();

  const columns: ColumnDef<TopProfessional>[] = [
    {
      key: "name",
      header: t.common.name,
      className: "font-medium",
      render: (row) => row.name ?? "—",
    },
    {
      key: "specialty",
      header: t.dashboard.tableSpecialty,
      render: (row) => row.specialty ?? "—",
    },
    {
      key: "city",
      header: t.dashboard.tableCity,
      render: (row) => row.city ?? "—",
    },
    {
      key: "rating",
      header: t.dashboard.tableRating,
      render: (row) =>
        row.average_rating != null ? (
          <Badge variant="secondary">
            {row.average_rating.toFixed(1)}
          </Badge>
        ) : (
          "—"
        ),
    },
    {
      key: "appointments",
      header: t.dashboard.tableAppointments,
      render: (row) => row.total_appointments ?? 0,
    },
    {
      key: "reviews",
      header: t.dashboard.tableReviews,
      render: (row) => row.total_reviews ?? 0,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      rowKey={(row) => row.id}
      emptyTitle={t.dashboard.emptyTitle}
      emptyDescription={t.dashboard.emptyDescription}
    />
  );
}
