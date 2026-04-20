"use client";

import type { ColumnDef } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Ban,
  Calendar,
  MapPin,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  Star,
  Trash2,
  UserCheck,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { translateSpecialty } from "@/locales/patient/specialties";

// ---------------------------------------------------------------------------
// Shared types & constants
// ---------------------------------------------------------------------------

export interface ProfessionalRow {
  id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  specialty: string;
  city: string | null;
  rating: number | null;
  total_reviews: number | null;
  verification_status: string;
  registration_number?: string | null;
  consultation_fee?: number | null;
  bio?: string | null;
  languages_spoken?: string[] | null;
  address?: string | null;
  postal_code?: string | null;
}

export const AVATAR_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

export const SPECIALTY_COLORS = [
  { bg: "#eff6ff", text: "#1d4ed8" },
  { bg: "#f0fdf4", text: "#15803d" },
  { bg: "#fef3c7", text: "#92400e" },
  { bg: "#fce7f3", text: "#9d174d" },
  { bg: "#f5f3ff", text: "#6d28d9" },
  { bg: "#ecfdf5", text: "#065f46" },
  { bg: "#fff7ed", text: "#9a3412" },
  { bg: "#f0f9ff", text: "#0369a1" },
];

export function hashStr(s: string): number {
  let hash = 0;
  for (const ch of s) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  return Math.abs(hash);
}

// ---------------------------------------------------------------------------
// Column builder
// ---------------------------------------------------------------------------

interface ColumnTranslations {
  common: {
    name: string;
    status: string;
    actions: string;
  };
  professionals: {
    tableSpecialty: string;
    tableCity: string;
    tableRating: string;
    editProfessional: string;
    viewAvailability: string;
    viewServices: string;
    verify: string;
    reject: string;
    suspend: string;
    unsuspend: string;
    delete: string;
  };
  statuses: {
    verification: Record<string, string>;
  };
}

interface ColumnHandlers {
  onAction: (id: string, status: string, label: string, userId?: string) => void;
}

export function getProfessionalColumns(
  t: ColumnTranslations,
  locale: string,
  handlers: ColumnHandlers,
): ColumnDef<ProfessionalRow>[] {
  return [
    {
      key: "name",
      header: t.common.name,
      render: (row) => {
        const bg = AVATAR_COLORS[hashStr(row.name) % AVATAR_COLORS.length];
        const initials = row.name.split(" ").map((w) => w[0]).join("").slice(0, 2);
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-[34px]">
              {row.avatar_url && <AvatarImage src={row.avatar_url} alt={row.name} />}
              <AvatarFallback style={{ backgroundColor: bg, color: "white" }} className="text-[13px] font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-[14px] font-semibold">{row.name}</span>
            {row.verification_status === "verified" && <ShieldCheck className="text-primary size-4" />}
          </div>
        );
      },
    },
    {
      key: "specialty",
      header: t.professionals.tableSpecialty,
      render: (row) => {
        const color = SPECIALTY_COLORS[hashStr(row.specialty) % SPECIALTY_COLORS.length];
        return (
          <span
            style={{
              display: "inline-block", borderRadius: "9999px", padding: "4px 10px",
              fontSize: "11px", fontWeight: 600, backgroundColor: color.bg, color: color.text,
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
          "\u2014"
        ),
    },
    {
      key: "rating",
      header: t.professionals.tableRating,
      render: (row) =>
        row.rating != null && row.rating > 0 ? (
          <div className="flex items-center gap-1 text-[13px]">
            <Star className="size-3.5 fill-[#f59e0b] text-[#f59e0b]" />
            <span className="font-medium text-[#92400e]">{row.rating.toFixed(1)}</span>
            <span className="text-[#6b7280]">({row.total_reviews ?? 0})</span>
          </div>
        ) : (
          <span className="text-[#9ca3af]">{"\u2014"}</span>
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
          className={row.verification_status === "pending" ? "animate-pulse" : undefined}
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
            <DropdownMenuItem onClick={() => handlers.onAction(row.id, "edit", "")}>
              <Pencil className="mr-2 size-4" />
              {t.professionals.editProfessional}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handlers.onAction(row.id, "detail", "")}>
              <Calendar className="mr-2 size-4" />
              {t.professionals.viewAvailability} / {t.professionals.viewServices}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {row.verification_status !== "verified" && (
              <DropdownMenuItem onClick={() => handlers.onAction(row.id, "verified", t.professionals.verify)}>
                <ShieldCheck className="mr-2 size-4" />
                {t.professionals.verify}
              </DropdownMenuItem>
            )}
            {row.verification_status !== "rejected" && row.verification_status !== "suspended" && (
              <DropdownMenuItem
                onClick={() => handlers.onAction(row.id, "rejected", t.professionals.reject)}
                className="text-destructive"
              >
                {t.professionals.reject}
              </DropdownMenuItem>
            )}
            {row.verification_status === "verified" && (
              <DropdownMenuItem
                onClick={() => handlers.onAction(row.id, "suspend", t.professionals.suspend)}
                className="text-destructive"
              >
                <Ban className="mr-2 size-4" />
                {t.professionals.suspend}
              </DropdownMenuItem>
            )}
            {row.verification_status === "suspended" && (
              <DropdownMenuItem onClick={() => handlers.onAction(row.id, "unsuspend", t.professionals.unsuspend)}>
                <UserCheck className="mr-2 size-4" />
                {t.professionals.unsuspend}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handlers.onAction(row.id, "delete", t.professionals.delete, row.user_id)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              {t.professionals.delete}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
