"use client";

import { useState, useTransition } from "react";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal, X as XIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cancelAppointment } from "@/app/(admin)/_actions/admin-actions";
import { toast } from "sonner";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface AppointmentRow {
  id: string;
  patient_name: string;
  patient_avatar_url: string | null;
  professional_name: string;
  professional_avatar_url: string | null;
  date: string;
  time: string;
  status: string;
  duration_minutes?: number | null;
}

interface StatusCounts {
  total: number;
  confirmed: number;
  cancelled: number;
  pending: number;
}

interface AppointmentsTableProps {
  data: AppointmentRow[];
  statusCounts: StatusCounts;
}

const AVATAR_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

function hashStr(s: string): number {
  let hash = 0;
  for (const ch of s) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  return Math.abs(hash);
}

function KpiStrip({ counts, t }: { counts: StatusCounts; t: Record<string, string> }) {
  const items = [
    { label: t.kpiTotal, value: counts.total, color: "#374151" },
    { label: t.kpiConfirmed, value: counts.confirmed, color: "#15803d" },
    { label: t.kpiCancelled, value: counts.cancelled, color: "#dc2626" },
    { label: t.kpiPending, value: counts.pending, color: "#854d0e" },
  ];

  return (
    <div className="flex items-center h-12 gap-6 px-4 rounded-lg border bg-[#f9fafb] overflow-x-auto">
      <div className="flex items-center gap-6 flex-nowrap min-w-max">
        {items.map((item, i) => (
          <div key={item.label} className="flex items-center gap-2">
            {i > 0 && <div className="w-px h-5 bg-[#e5e7eb]" />}
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] text-[#6b7280] whitespace-nowrap">{item.label}</span>
              <span
                className="text-[15px] font-semibold"
                style={{ color: item.color }}
              >
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AppointmentsTable({ data, statusCounts }: AppointmentsTableProps) {
  const { t } = useAdminI18n();
  const dateLocale = t.common.dateLocale as "pt-PT" | "fr-FR";
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionSheet, setActionSheet] = useState<AppointmentRow | null>(null);

  function handleCancel(id?: string) {
    const target = id ?? confirmCancel;
    if (!target) return;
    setActionSheet(null);
    setConfirmCancel(target);
  }

  function executeCancel() {
    if (!confirmCancel) return;
    startTransition(async () => {
      const result = await cancelAppointment(confirmCancel);
      if (result.success) {
        toast.success(t.appointments.appointmentCancelled);
      } else {
        toast.error(result.error ?? t.common.errorUpdating);
      }
      setConfirmCancel(null);
    });
  }

  const columns: ColumnDef<AppointmentRow>[] = [
    {
      // RGPD Art. 9 — Données de santé :
      // L'admin plateforme n'a pas accès aux données médicales des patients
      // Affichage uniquement d'identifiants anonymisés
      key: "patient",
      header: t.appointments.tablePatient,
      render: (row) => {
        if (!row.patient_name) {
          return (
            <span className="text-[13px] italic text-[#9ca3af]">
              {t.appointments.deletedPatient}
            </span>
          );
        }
        return (
          <span className="text-[13px] font-medium text-muted-foreground">
            {row.patient_name}
          </span>
        );
      },
    },
    {
      key: "professional",
      header: t.appointments.tableProfessional,
      render: (row) => {
        if (row.professional_name === "—") return "—";
        const bg =
          AVATAR_COLORS[hashStr(row.professional_name) % AVATAR_COLORS.length];
        const initials = row.professional_name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2);
        return (
          <div className="flex items-center gap-2">
            <Avatar className="size-[30px]">
              {row.professional_avatar_url && <AvatarImage src={row.professional_avatar_url} alt={row.professional_name} />}
              <AvatarFallback
                style={{ backgroundColor: bg, color: "white" }}
                className="text-[11px] font-semibold"
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-[13px]">{row.professional_name}</span>
          </div>
        );
      },
    },
    {
      key: "dateTime",
      header: t.appointments.dateAndTime,
      render: (row) => {
        const formatted = new Intl.DateTimeFormat(dateLocale, {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(row.date));
        const duration = row.duration_minutes
          ? ` · ${row.duration_minutes} min`
          : "";
        return (
          <span className="text-[13px]">
            {formatted} · {row.time}
            {duration}
          </span>
        );
      },
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
    {
      key: "actions",
      header: "",
      className: "w-10",
      render: (row) => (
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label={t.common.actions}>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  toast.info(t.appointments.viewDetails)
                }
              >
                <Eye className="size-4 mr-2" />
                {t.appointments.viewDetails}
              </DropdownMenuItem>
              {row.status !== "completed" && row.status !== "cancelled" && (
                <DropdownMenuItem
                  onClick={() => setConfirmCancel(row.id)}
                  className="text-destructive"
                >
                  <XIcon className="size-4 mr-2" />
                  {t.appointments.cancelAppointment}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <KpiStrip counts={statusCounts} t={t.appointments} />

      {/* Mobile card list */}
      <div className="space-y-2 sm:hidden">
        {data.map((row) => {
          const shortDate = new Intl.DateTimeFormat(dateLocale, {
            day: "numeric",
            month: "short",
          }).format(new Date(row.date));
          return (
            <div
              key={row.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-muted-foreground truncate">
                    {row.patient_name || t.appointments.deletedPatient}
                  </p>
                  <StatusBadge
                    type="appointment"
                    value={row.status}
                    labels={t.statuses.appointment}
                  />
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {row.professional_name !== "—" ? row.professional_name : ""} · {shortDate} · {row.time}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px] shrink-0"
                onClick={() => setActionSheet(row)}
                aria-label={t.mobile.actions}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block">
        <DataTable
          columns={columns}
          data={data}
          rowKey={(row) => row.id}
          emptyTitle={t.appointments.emptyTitle}
          emptyDescription={t.common.noResultsHint}
          variant="admin"
        />
      </div>

      {/* Mobile action sheet */}
      <Sheet
        open={!!actionSheet}
        onOpenChange={(open) => !open && setActionSheet(null)}
      >
        <SheetContent side="bottom" className="pb-8">
          <SheetHeader>
            <SheetTitle>
              {actionSheet?.patient_name || t.appointments.deletedPatient}
            </SheetTitle>
            {/* RGPD: patient_name is already anonymized (Patient #xxxxx) */}
          </SheetHeader>
          <div className="mt-2 space-y-1">
            <button
              onClick={() => {
                setActionSheet(null);
                toast.info(t.appointments.viewDetails);
              }}
              className="flex h-14 w-full items-center gap-3 rounded-md px-4 text-sm hover:bg-accent transition-colors"
            >
              <Eye className="size-4" />
              {t.appointments.viewDetails}
            </button>
            {actionSheet &&
              actionSheet.status !== "completed" &&
              actionSheet.status !== "cancelled" && (
                <button
                  onClick={() => handleCancel(actionSheet.id)}
                  className="flex h-14 w-full items-center gap-3 rounded-md px-4 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <XIcon className="size-4" />
                  {t.appointments.cancelAppointment}
                </button>
              )}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!confirmCancel}
        onOpenChange={(open) => !open && setConfirmCancel(null)}
        title={t.appointments.confirmCancelTitle}
        description={t.appointments.confirmCancelDesc}
        confirmLabel={t.appointments.cancelAppointment}
        variant="destructive"
        loading={isPending}
        onConfirm={executeCancel}
      />
    </div>
  );
}
