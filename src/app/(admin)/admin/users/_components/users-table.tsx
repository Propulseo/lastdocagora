"use client";

import { useState, useTransition } from "react";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { banUser, unbanUser } from "@/app/(admin)/_actions/admin-crud-actions";
import { toast } from "sonner";
import { resolveErrorMessage } from "@/lib/error-messages";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { UserMobileList } from "./user-mobile-list";
import { UserEditModal } from "./user-edit-modal";
import { UserDeleteDialog } from "./user-delete-dialog";
import { buildColumns } from "./users-table-columns";

export interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string | null;
  created_at: string | null;
  avatar_url: string | null;
  phone?: string | null;
  language?: string | null;
  // Professional fields (joined)
  specialty?: string | null;
  registration_number?: string | null;
  consultation_fee?: number | null;
  bio?: string | null;
  languages_spoken?: string[] | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  // Patient fields (joined)
  insurance_provider?: string | null;
}

interface UsersTableProps {
  data: UserRow[];
  currentUserId?: string;
}

const AVATAR_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function buildMultiRoleSet(data: UserRow[]): Set<string> {
  const nameMap = new Map<string, Set<string>>();
  for (const row of data) {
    const key = `${row.first_name} ${row.last_name}`.toLowerCase();
    if (!nameMap.has(key)) nameMap.set(key, new Set());
    nameMap.get(key)!.add(row.role);
  }
  const multiRole = new Set<string>();
  for (const [key, roles] of nameMap) {
    if (roles.size > 1) multiRole.add(key);
  }
  return multiRole;
}

export function UsersTable({ data, currentUserId }: UsersTableProps) {
  const { t } = useAdminI18n();
  const [isPending, startTransition] = useTransition();
  const multiRoleUsers = buildMultiRoleSet(data);
  const [actionSheet, setActionSheet] = useState<UserRow | null>(null);

  // Edit modal state
  const [editUser, setEditUser] = useState<UserRow | null>(null);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; fullName: string } | null>(null);

  // Ban/unban confirm state
  const [banConfirm, setBanConfirm] = useState<{ userId: string; action: "ban" | "unban" } | null>(null);

  function handleAction(userId: string, status: string, label: string) {
    setActionSheet(null);
    const row = data.find((r) => r.id === userId);
    if (status === "delete" && row) {
      setDeleteTarget({ id: userId, fullName: `${row.first_name} ${row.last_name}` });
    } else if (status === "edit" && row) {
      setEditUser(row);
    } else if (status === "ban") {
      setBanConfirm({ userId, action: "ban" });
    } else if (status === "unban") {
      setBanConfirm({ userId, action: "unban" });
    }
  }

  function handleBanConfirm() {
    if (!banConfirm) return;
    startTransition(async () => {
      const result = banConfirm.action === "ban"
        ? await banUser(banConfirm.userId)
        : await unbanUser(banConfirm.userId);
      if (result.success) {
        toast.success(banConfirm.action === "ban" ? t.users.banned : t.users.unbanned);
      } else if (result.error === "cannot_ban_self") {
        toast.error(t.users.cannotDeleteSelf);
      } else {
        toast.error(resolveErrorMessage(result.error, t.common.errorUpdating));
      }
      setBanConfirm(null);
    });
  }

  const dateLocale = t.common.dateLocale as "pt-PT" | "fr-FR";

  const columns = buildColumns(
    t as unknown as Record<string, unknown>,
    dateLocale,
    multiRoleUsers,
    currentUserId,
    handleAction,
  );

  return (
    <>
      <UserMobileList
        data={data}
        actionSheet={actionSheet}
        onOpenActionSheet={setActionSheet}
        onCloseActionSheet={() => setActionSheet(null)}
        onAction={handleAction}
        currentUserId={currentUserId}
      />

      <div className="hidden sm:block">
        <DataTable
          columns={columns}
          data={data}
          rowKey={(row) => row.id}
          emptyTitle={t.users.emptyTitle}
          emptyDescription={t.common.noResultsHint}
          variant="admin"
        />
      </div>

      {/* Edit Modal */}
      <UserEditModal
        user={editUser}
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
      />

      {/* Delete Double Confirmation */}
      {deleteTarget && (
        <UserDeleteDialog
          userId={deleteTarget.id}
          fullName={deleteTarget.fullName}
          open={!!deleteTarget}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        />
      )}

      {/* Ban/Unban Confirmation */}
      <ConfirmDialog
        open={!!banConfirm}
        onOpenChange={(open) => !open && setBanConfirm(null)}
        title={banConfirm?.action === "ban" ? t.users.banConfirmTitle : t.users.unban}
        description={banConfirm?.action === "ban" ? t.users.banConfirmDescription : ""}
        confirmLabel={banConfirm?.action === "ban" ? t.users.ban : t.users.unban}
        cancelLabel={t.common.cancel}
        loadingLabel={t.common.processing}
        variant={banConfirm?.action === "ban" ? "destructive" : "default"}
        loading={isPending}
        onConfirm={handleBanConfirm}
      />
    </>
  );
}
