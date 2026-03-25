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
import { MapPin, MoreHorizontal, ShieldCheck, Star, CheckCircle, XCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { updateVerificationStatus } from "@/app/(admin)/_actions/admin-actions";
import { toast } from "sonner";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { translateSpecialty } from "@/locales/patient/specialties";

interface ProfessionalRow {
  id: string;
  name: string;
  avatar_url: string | null;
  specialty: string;
  city: string | null;
  rating: number | null;
  total_reviews: number | null;
  verification_status: string;
}

interface ProfessionalsTableProps {
  data: ProfessionalRow[];
}

const AVATAR_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

const SPECIALTY_COLORS = [
  { bg: "#eff6ff", text: "#1d4ed8" },
  { bg: "#f0fdf4", text: "#15803d" },
  { bg: "#fef3c7", text: "#92400e" },
  { bg: "#fce7f3", text: "#9d174d" },
  { bg: "#f5f3ff", text: "#6d28d9" },
  { bg: "#ecfdf5", text: "#065f46" },
  { bg: "#fff7ed", text: "#9a3412" },
  { bg: "#f0f9ff", text: "#0369a1" },
];

function hashStr(s: string): number {
  let hash = 0;
  for (const ch of s) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  return Math.abs(hash);
}

export function ProfessionalsTable({ data }: ProfessionalsTableProps) {
  const { t, locale } = useAdminI18n();
  const [confirm, setConfirm] = useState<{
    id: string;
    status: string;
    label: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionSheet, setActionSheet] = useState<ProfessionalRow | null>(null);

  function handleAction(id: string, status: string, label: string) {
    setActionSheet(null);
    setConfirm({ id, status, label });
  }

  function handleConfirm() {
    if (!confirm) return;
    startTransition(async () => {
      const result = await updateVerificationStatus(confirm.id, confirm.status);
      if (result.success) {
        toast.success(t.professionals.statusUpdated);
      } else {
        toast.error(result.error ?? t.common.errorUpdating);
      }
      setConfirm(null);
    });
  }

  const columns: ColumnDef<ProfessionalRow>[] = [
    {
      key: "name",
      header: t.common.name,
      render: (row) => {
        const bg = AVATAR_COLORS[hashStr(row.name) % AVATAR_COLORS.length];
        const initials = row.name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2);
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-[34px]">
              {row.avatar_url && <AvatarImage src={row.avatar_url} alt={row.name} />}
              <AvatarFallback
                style={{ backgroundColor: bg, color: "white" }}
                className="text-[13px] font-semibold"
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-[14px] font-semibold">{row.name}</span>
            {row.verification_status === "verified" && (
              <ShieldCheck className="text-primary size-4" />
            )}
          </div>
        );
      },
    },
    {
      key: "specialty",
      header: t.professionals.tableSpecialty,
      render: (row) => {
        const color =
          SPECIALTY_COLORS[hashStr(row.specialty) % SPECIALTY_COLORS.length];
        return (
          <span
            style={{
              display: "inline-block",
              borderRadius: "9999px",
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: 600,
              backgroundColor: color.bg,
              color: color.text,
            }}
          >
            {translateSpecialty(row.specialty, locale) ?? row.specialty}
          </span>
        );
      },
    },
    {
      key: "city",
      header: t.professionals.tableCity,
      render: (row) =>
        row.city ? (
          <div className="flex items-center gap-1 text-[13px]">
            <MapPin className="size-3 text-[#6b7280]" />
            {row.city}
          </div>
        ) : (
          "—"
        ),
    },
    {
      key: "rating",
      header: t.professionals.tableRating,
      render: (row) =>
        row.rating != null && row.rating > 0 ? (
          <div className="flex items-center gap-1 text-[13px]">
            <Star className="size-3.5 fill-[#f59e0b] text-[#f59e0b]" />
            <span className="font-medium text-[#92400e]">
              {row.rating.toFixed(1)}
            </span>
            <span className="text-[#6b7280]">
              ({row.total_reviews ?? 0})
            </span>
          </div>
        ) : (
          <span className="text-[#9ca3af]">—</span>
        ),
    },
    {
      key: "status",
      header: t.common.status,
      render: (row) => (
        <StatusBadge
          type="verification"
          value={row.verification_status}
          labels={t.statuses.verification}
          className={
            row.verification_status === "pending" ? "animate-pulse" : undefined
          }
        />
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-10",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" aria-label={t.common.actions}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {row.verification_status !== "verified" && (
              <DropdownMenuItem
                onClick={() =>
                  setConfirm({
                    id: row.id,
                    status: "verified",
                    label: t.professionals.verify,
                  })
                }
              >
                {t.professionals.verify}
              </DropdownMenuItem>
            )}
            {row.verification_status !== "rejected" && (
              <DropdownMenuItem
                onClick={() =>
                  setConfirm({
                    id: row.id,
                    status: "rejected",
                    label: t.professionals.reject,
                  })
                }
                className="text-destructive"
              >
                {t.professionals.reject}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      {/* Mobile card list */}
      <div className="space-y-2 sm:hidden">
        {data.map((row) => {
          const bg = AVATAR_COLORS[hashStr(row.name) % AVATAR_COLORS.length];
          const initials = row.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2);
          const specColor =
            SPECIALTY_COLORS[hashStr(row.specialty) % SPECIALTY_COLORS.length];
          return (
            <div
              key={row.id}
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                row.verification_status === "pending"
                  ? "border-l-[3px] border-l-[#f97316]"
                  : ""
              }`}
            >
              <Avatar className="size-10 shrink-0">
                {row.avatar_url && <AvatarImage src={row.avatar_url} alt={row.name} />}
                <AvatarFallback
                  style={{ backgroundColor: bg, color: "white" }}
                  className="text-[13px] font-semibold"
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold truncate">{row.name}</p>
                  {row.verification_status === "verified" && (
                    <ShieldCheck className="text-primary size-3.5 shrink-0" />
                  )}
                </div>
                <span
                  style={{
                    display: "inline-block",
                    borderRadius: "9999px",
                    padding: "2px 8px",
                    fontSize: "10px",
                    fontWeight: 600,
                    backgroundColor: specColor.bg,
                    color: specColor.text,
                    marginTop: 2,
                  }}
                >
                  {translateSpecialty(row.specialty, locale) ?? row.specialty}
                </span>
              </div>
              <div className="shrink-0">
                <StatusBadge
                  type="verification"
                  value={row.verification_status}
                  labels={t.statuses.verification}
                  className={
                    row.verification_status === "pending" ? "animate-pulse" : undefined
                  }
                />
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
          emptyTitle={t.professionals.emptyTitle}
          emptyDescription={t.common.noResultsHint}
          variant="admin"
          rowClassName={(row) =>
            row.verification_status === "pending"
              ? "border-l-[3px] border-l-[#f97316]"
              : undefined
          }
        />
      </div>

      {/* Mobile action sheet */}
      <Sheet
        open={!!actionSheet}
        onOpenChange={(open) => !open && setActionSheet(null)}
      >
        <SheetContent side="bottom" className="pb-8">
          <SheetHeader>
            <SheetTitle>{actionSheet?.name ?? ""}</SheetTitle>
          </SheetHeader>
          <div className="mt-2 space-y-1">
            {actionSheet && actionSheet.verification_status !== "verified" && (
              <button
                onClick={() =>
                  handleAction(
                    actionSheet.id,
                    "verified",
                    t.professionals.verify
                  )
                }
                className="flex h-14 w-full items-center gap-3 rounded-md px-4 text-sm hover:bg-accent transition-colors"
              >
                <CheckCircle className="size-4" />
                {t.professionals.verify}
              </button>
            )}
            {actionSheet && actionSheet.verification_status !== "rejected" && (
              <button
                onClick={() =>
                  handleAction(
                    actionSheet.id,
                    "rejected",
                    t.professionals.reject
                  )
                }
                className="flex h-14 w-full items-center gap-3 rounded-md px-4 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <XCircle className="size-4" />
                {t.professionals.reject}
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={t.professionals.confirmTitle.replace(
          "{action}",
          confirm?.label ?? ""
        )}
        description={t.professionals.confirmDescription.replace(
          "{action}",
          confirm?.label?.toLowerCase() ?? ""
        )}
        confirmLabel={confirm?.label ?? t.common.confirm}
        variant={confirm?.status === "rejected" ? "destructive" : "default"}
        loading={isPending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
