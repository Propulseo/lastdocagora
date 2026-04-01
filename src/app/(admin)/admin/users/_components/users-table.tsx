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
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { updateUserStatus, deleteUser } from "@/app/(admin)/_actions/admin-actions";
import { toast } from "sonner";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { UserMobileList } from "./user-mobile-list";

export interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string | null;
  created_at: string | null;
  avatar_url: string | null;
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
  const [confirm, setConfirm] = useState<{
    userId: string;
    status: string;
    label: string;
    action: "status" | "delete";
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const multiRoleUsers = buildMultiRoleSet(data);
  const [actionSheet, setActionSheet] = useState<UserRow | null>(null);

  function handleAction(userId: string, status: string, label: string) {
    setActionSheet(null);
    setConfirm({
      userId,
      status,
      label,
      action: status === "delete" ? "delete" : "status",
    });
  }

  function handleConfirm() {
    if (!confirm) return;
    startTransition(async () => {
      if (confirm.action === "delete") {
        const result = await deleteUser(confirm.userId);
        if (result.success) {
          toast.success(t.users.userDeleted);
        } else if (result.error === "self_deletion") {
          toast.error(t.users.cannotDeleteSelf);
        } else {
          toast.error(result.error ?? t.common.errorUpdating);
        }
      } else {
        const result = await updateUserStatus(confirm.userId, confirm.status);
        if (result.success) {
          toast.success(t.users.statusUpdated);
        } else {
          toast.error(result.error ?? t.common.errorUpdating);
        }
      }
      setConfirm(null);
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
            {(row.status ?? "active") !== "active" && (
              <DropdownMenuItem onClick={() => handleAction(row.id, "active", t.users.activate)}>
                {t.users.activate}
              </DropdownMenuItem>
            )}
            {(row.status ?? "active") !== "suspended" && (
              <DropdownMenuItem onClick={() => handleAction(row.id, "suspended", t.users.suspend)} className="text-destructive">
                {t.users.suspend}
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

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={
          confirm?.action === "delete"
            ? t.users.deleteConfirmTitle
            : t.users.confirmTitle.replace("{action}", confirm?.label ?? "")
        }
        description={
          confirm?.action === "delete"
            ? t.users.deleteConfirmDescription
            : t.users.confirmDescription.replace("{action}", confirm?.label?.toLowerCase() ?? "")
        }
        confirmLabel={confirm?.label ?? t.common.confirm}
        variant={confirm?.action === "delete" || confirm?.status === "suspended" ? "destructive" : "default"}
        loading={isPending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
