"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { translateSpecialty } from "@/locales/patient/specialties";
import { cn } from "@/lib/utils";

interface TopProfessional {
  id: string;
  name: string | null;
  specialty: string | null;
  city: string | null;
  average_rating: number | null;
  total_appointments: number | null;
  total_reviews: number | null;
}

interface DashboardTopProsProps {
  data: TopProfessional[];
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function DashboardTopPros({ data }: DashboardTopProsProps) {
  const { t, locale } = useAdminI18n();
  const displayData = data.slice(0, 8);

  if (displayData.length === 0) return null;

  return (
    <div
      style={{
        animation: "admin-fade-up 0.4s ease-out both",
        animationDelay: "500ms",
      }}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">
          {t.dashboard.topProfessionals}
        </h2>
        {data.length > 8 && (
          <Link
            href="/admin/professionals"
            className="group inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.dashboard.viewAll}
            <ArrowRight className="size-3 transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {/* Header — desktop only */}
        <div className="hidden border-b border-border bg-muted/30 px-5 py-2.5 sm:grid sm:grid-cols-[2fr_1.5fr_1fr_0.8fr_0.8fr] sm:gap-4">
          <span className="text-xs font-medium text-muted-foreground">{t.common.name}</span>
          <span className="text-xs font-medium text-muted-foreground">{t.dashboard.tableSpecialty}</span>
          <span className="text-xs font-medium text-muted-foreground">{t.dashboard.tableCity}</span>
          <span className="text-xs font-medium text-muted-foreground text-right">{t.dashboard.tableRating}</span>
          <span className="text-xs font-medium text-muted-foreground text-right">{t.dashboard.tableAppointments}</span>
        </div>

        {/* Rows */}
        {displayData.map((pro, i) => (
          <div
            key={pro.id}
            className={cn(
              "transition-colors duration-100 hover:bg-accent/30",
              i > 0 && "border-t border-border"
            )}
          >
            {/* Desktop row */}
            <div className="hidden px-5 py-3 sm:grid sm:grid-cols-[2fr_1.5fr_1fr_0.8fr_0.8fr] sm:items-center sm:gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
                  {getInitials(pro.name)}
                </span>
                <span className="truncate text-sm font-medium">
                  {pro.name ?? "—"}
                </span>
              </div>
              <span className="truncate text-sm text-muted-foreground">
                {translateSpecialty(pro.specialty, locale) ?? "—"}
              </span>
              <span className="truncate text-sm text-muted-foreground">
                {pro.city ?? "—"}
              </span>
              <span className="text-right text-sm tabular-nums">
                {pro.average_rating != null
                  ? pro.average_rating.toFixed(1)
                  : "—"}
              </span>
              <span className="text-right text-sm tabular-nums text-muted-foreground">
                {pro.total_appointments ?? 0}
              </span>
            </div>

            {/* Mobile row */}
            <div className="flex items-center gap-3 px-4 py-3 sm:hidden">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium text-muted-foreground">
                {getInitials(pro.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {pro.name ?? "—"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {translateSpecialty(pro.specialty, locale) ?? "—"}
                  {pro.city ? ` · ${pro.city}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm tabular-nums font-medium">
                  {pro.average_rating != null
                    ? pro.average_rating.toFixed(1)
                    : "—"}
                </p>
                <p className="text-[11px] tabular-nums text-muted-foreground">
                  {pro.total_appointments ?? 0} {t.dashboard.tableAppointments.toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
