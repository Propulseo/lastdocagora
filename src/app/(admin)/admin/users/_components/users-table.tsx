"use client";

import { useState, useTransition } from "react";
import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Ban, UserCheck } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { banUser, unbanUser } from "@/app/(admin)/_actions/admin-crud-actions";
import { toast } from "sonner";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { UserMobileList } from "./user-mobile-list";
import { UserEditModal } from "./user-edit-modal";
import { UserDeleteDialog } from "./user-delete-dialog";

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
        toast.error(result.error ?? t.common.errorUpdating);
      }
      setBanConfirm(null);
    });
  }

  const dateLocale = t.common.dateLocale as "pt-PT" | "fr-FR";

  const columns: ColumnDef<UserRow>[] = [
    {
      key: "name",
      header: t.common.name,
      className: "w-[35%]",
      render: (row) => {
        const fullName = `${row.first_name} ${row.last_name}`;
        const bg = getAvatarColor(fullName);
        const isMultiRole = multiRoleUsers.has(fullName.toLowerCase());
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-[34px]">
              {row.avatar_url && <AvatarImage src={row.avatar_url} alt={fullName} />}
              <AvatarFallback style={{ backgroundColor: bg, color: "white" }} className="text-[13px] font-semibold">
                {row.first_name?.[0] ?? ""}{row.last_name?.[0] ?? ""}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold truncate">{fullName}</span>
                {isMultiRole && (
                  <span style={{
                    display: "inline-block", borderRadius: "9999px", padding: "2px 8px",
                    fontSize: "10px", fontWeight: 600, backgroundColor: "#dbeafe", color: "#1d4ed8",
                  }}>
                    {t.users.multiRoleAccount}
                  </span>
                )}
              </div>
              <div className="text-[12px] text-[#6b7280] truncate">{row.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      key: "role",
      header: t.users.tableRole,
      render: (row) => <StatusBadge type="role" value={row.role} labels={t.statuses.role} />,
    },
    {
      key: "status",
      header: t.common.status,
      render: (row) => <StatusBadge type="userStatus" value={row.status ?? "active"} labels={t.statuses.userStatus} />,
    },
    {
      key: "created_at",
      header: t.users.tableRegisteredAt,
      render: (row) =>
        row.created_at
          ? new Intl.DateTimeFormat(dateLocale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(row.created_at))
          : "\u2014",
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
            <DropdownMenuItem onClick={() => handleAction(row.id, "edit", t.users.edit)}>
              <Pencil className="mr-2 size-4" />
              {t.users.edit}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {(row.status ?? "active") === "suspended" ? (
              <DropdownMenuItem onClick={() => handleAction(row.id, "unban", t.users.unban)}>
                <UserCheck className="mr-2 size-4" />
                {t.users.unban}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleAction(row.id, "ban", t.users.ban)} className="text-destructive">
                <Ban className="mr-2 size-4" />
                {t.users.ban}
              </DropdownMenuItem>
            )}
            {row.id !== currentUserId && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleAction(row.id, "delete", t.users.delete)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  {t.users.delete}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

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
