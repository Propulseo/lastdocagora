"use client";

import Link from "next/link";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { translateSpecialty } from "@/locales/patient/specialties";

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
  const { t, locale } = useAdminI18n();

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
      render: (row) => translateSpecialty(row.specialty, locale) ?? "—",
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

  const mobileItems = data.slice(0, 5);

  return (
    <>
      {/* Mobile card list */}
      <div className="space-y-2 sm:hidden">
        {mobileItems.map((pro, i) => (
          <div
            key={pro.id}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            <span className="text-lg font-bold text-muted-foreground w-6 text-center shrink-0">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">
                {pro.name ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {translateSpecialty(pro.specialty, locale) ?? "—"}
              </p>
            </div>
            <div className="shrink-0 text-right">
              {pro.average_rating != null ? (
                <Badge variant="secondary">
                  {pro.average_rating.toFixed(1)}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {pro.total_appointments ?? 0} {t.dashboard.tableAppointments.toLowerCase()}
                </span>
              )}
            </div>
          </div>
        ))}
        {data.length > 5 && (
          <Link
            href="/admin/professionals"
            className="block text-center text-sm font-medium text-primary py-2"
          >
            {t.mobile.viewMore} →
          </Link>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        <DataTable
          columns={columns}
          data={data}
          rowKey={(row) => row.id}
          emptyTitle={t.dashboard.emptyTitle}
          emptyDescription={t.dashboard.emptyDescription}
        />
      </div>
    </>
  );
}
