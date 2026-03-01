"use client";

import { useState, useTransition } from "react";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ShieldCheck } from "lucide-react";
import { updateVerificationStatus } from "@/app/(admin)/_actions/admin-actions";
import { toast } from "sonner";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface ProfessionalRow {
  id: string;
  name: string;
  specialty: string;
  city: string | null;
  rating: number | null;
  total_reviews: number | null;
  verification_status: string;
}

interface ProfessionalsTableProps {
  data: ProfessionalRow[];
}

export function ProfessionalsTable({ data }: ProfessionalsTableProps) {
  const { t } = useAdminI18n();
  const [confirm, setConfirm] = useState<{
    id: string;
    status: string;
    label: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

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
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.name}</span>
          {row.verification_status === "verified" && (
            <ShieldCheck className="text-primary size-4" />
          )}
        </div>
      ),
    },
    {
      key: "specialty",
      header: t.professionals.tableSpecialty,
      render: (row) => row.specialty,
    },
    {
      key: "city",
      header: t.professionals.tableCity,
      render: (row) => row.city ?? "—",
    },
    {
      key: "rating",
      header: t.professionals.tableRating,
      render: (row) =>
        row.rating != null ? (
          <Badge variant="secondary">
            {row.rating.toFixed(1)} ({row.total_reviews ?? 0})
          </Badge>
        ) : (
          "—"
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
        />
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-10",
      render: (row) =>
        row.verification_status === "pending" ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label={t.common.actions}>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null,
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        rowKey={(row) => row.id}
        emptyTitle={t.professionals.emptyTitle}
        emptyDescription={t.common.noResultsHint}
      />
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
