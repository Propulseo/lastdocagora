"use client";

import { useState, useTransition } from "react";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { updateVerificationStatus, deleteUser } from "@/app/(admin)/_actions/admin-actions";
import { suspendProfessional, unsuspendProfessional } from "@/app/(admin)/_actions/admin-crud-actions";
import { toast } from "sonner";
import { resolveErrorMessage } from "@/lib/error-messages";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { ProfessionalMobileList } from "./professional-mobile-list";
import { ProfessionalEditModal } from "./professional-edit-modal";
import { ProfessionalDetailModal } from "./professional-detail-modal";
import {
  type ProfessionalRow,
  getProfessionalColumns,
} from "./professional-table-columns";

export type { ProfessionalRow };

interface ProfessionalsTableProps {
  data: ProfessionalRow[];
}

export function ProfessionalsTable({ data }: ProfessionalsTableProps) {
  const { t, locale } = useAdminI18n();
  const [confirm, setConfirm] = useState<{
    id: string;
    userId: string;
    status: string;
    label: string;
    action: "verification" | "delete" | "suspend" | "unsuspend";
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [actionSheet, setActionSheet] = useState<ProfessionalRow | null>(null);
  const [editPro, setEditPro] = useState<ProfessionalRow | null>(null);
  const [detailPro, setDetailPro] = useState<ProfessionalRow | null>(null);

  function handleAction(id: string, status: string, label: string, userId?: string) {
    setActionSheet(null);
    if (status === "edit") {
      const row = data.find((r) => r.id === id);
      if (row) setEditPro(row);
      return;
    }
    if (status === "detail") {
      const row = data.find((r) => r.id === id);
      if (row) setDetailPro(row);
      return;
    }
    const action = status === "delete"
      ? "delete" as const
      : status === "suspend"
      ? "suspend" as const
      : status === "unsuspend"
      ? "unsuspend" as const
      : "verification" as const;
    setConfirm({ id, userId: userId ?? "", status, label, action });
  }

  function handleConfirm() {
    if (!confirm) return;
    startTransition(async () => {
      if (confirm.action === "delete") {
        const result = await deleteUser(confirm.userId);
        if (result.success) {
          toast.success(t.professionals.professionalDeleted);
        } else {
          toast.error(resolveErrorMessage(result.error, t.common.errorUpdating));
        }
      } else if (confirm.action === "suspend") {
        const result = await suspendProfessional(confirm.id);
        if (result.success) {
          toast.success(t.professionals.suspended);
        } else {
          toast.error(resolveErrorMessage(result.error, t.common.errorUpdating));
        }
      } else if (confirm.action === "unsuspend") {
        const result = await unsuspendProfessional(confirm.id);
        if (result.success) {
          toast.success(t.professionals.unsuspended);
        } else {
          toast.error(resolveErrorMessage(result.error, t.common.errorUpdating));
        }
      } else {
        const result = await updateVerificationStatus(confirm.id, confirm.status);
        if (result.success) {
          toast.success(t.professionals.statusUpdated);
        } else {
          toast.error(resolveErrorMessage(result.error, t.common.errorUpdating));
        }
      }
      setConfirm(null);
    });
  }

  const columns = getProfessionalColumns(t, locale, { onAction: handleAction });

  return (
    <>
      <ProfessionalMobileList
        data={data}
        actionSheet={actionSheet}
        onOpenActionSheet={setActionSheet}
        onCloseActionSheet={() => setActionSheet(null)}
        onAction={handleAction}
      />

      <div className="hidden sm:block">
        <DataTable
          columns={columns}
          data={data}
          rowKey={(row) => row.id}
          emptyTitle={t.professionals.emptyTitle}
          emptyDescription={t.common.noResultsHint}
          variant="admin"
          rowClassName={(row) =>
            row.verification_status === "pending" ? "border-l-[3px] border-l-[#f97316]" : undefined
          }
        />
      </div>

      {/* Edit Modal */}
      <ProfessionalEditModal
        professional={editPro}
        open={!!editPro}
        onOpenChange={(open) => !open && setEditPro(null)}
      />

      {/* Detail Modal (Availability + Services) */}
      <ProfessionalDetailModal
        professionalId={detailPro?.id ?? null}
        professionalName={detailPro?.name ?? ""}
        open={!!detailPro}
        onOpenChange={(open) => !open && setDetailPro(null)}
      />

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={
          confirm?.action === "delete"
            ? t.professionals.deleteConfirmTitle
            : confirm?.action === "suspend"
            ? t.professionals.suspendConfirmTitle
            : t.professionals.confirmTitle.replace("{action}", confirm?.label ?? "")
        }
        description={
          confirm?.action === "delete"
            ? t.professionals.deleteConfirmDescription
            : confirm?.action === "suspend"
            ? t.professionals.suspendConfirmDescription
            : t.professionals.confirmDescription.replace("{action}", confirm?.label?.toLowerCase() ?? "")
        }
        confirmLabel={confirm?.label ?? t.common.confirm}
        cancelLabel={t.common.cancel}
        loadingLabel={t.common.processing}
        variant={confirm?.action === "delete" || confirm?.action === "suspend" || confirm?.status === "rejected" ? "destructive" : "default"}
        loading={isPending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
