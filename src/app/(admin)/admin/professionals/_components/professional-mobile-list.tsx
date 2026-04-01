"use client";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MoreHorizontal, ShieldCheck, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { translateSpecialty } from "@/locales/patient/specialties";
import {
  AVATAR_COLORS,
  SPECIALTY_COLORS,
  hashStr,
  type ProfessionalRow,
} from "./professionals-table";

interface ProfessionalMobileListProps {
  data: ProfessionalRow[];
  actionSheet: ProfessionalRow | null;
  onOpenActionSheet: (row: ProfessionalRow) => void;
  onCloseActionSheet: () => void;
  onAction: (id: string, status: string, label: string, userId?: string) => void;
}

export function ProfessionalMobileList({
  data,
  actionSheet,
  onOpenActionSheet,
  onCloseActionSheet,
  onAction,
}: ProfessionalMobileListProps) {
  const { t, locale } = useAdminI18n();

  return (
    <>
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
                onClick={() => onOpenActionSheet(row)}
                aria-label={t.mobile.actions}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </div>
          );
        })}
      </div>

      <Sheet
        open={!!actionSheet}
        onOpenChange={(open) => !open && onCloseActionSheet()}
      >
        <SheetContent side="bottom" className="pb-8">
          <SheetHeader>
            <SheetTitle>{actionSheet?.name ?? ""}</SheetTitle>
          </SheetHeader>
          <div className="mt-2 space-y-1">
            {actionSheet && actionSheet.verification_status !== "verified" && (
              <button
                onClick={() =>
                  onAction(
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
                  onAction(
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
            {actionSheet && (
              <button
                onClick={() =>
                  onAction(
                    actionSheet.id,
                    "delete",
                    t.professionals.delete,
                    actionSheet.user_id
                  )
                }
                className="flex h-14 w-full items-center gap-3 rounded-md px-4 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="size-4" />
                {t.professionals.delete}
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
