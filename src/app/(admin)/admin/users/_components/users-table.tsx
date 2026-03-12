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
import { MoreHorizontal } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { updateUserStatus } from "@/app/(admin)/_actions/admin-actions";
import { toast } from "sonner";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface UserRow {
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
}

const AVATAR_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function buildDuplicateSet(data: UserRow[]): Set<string> {
  const nameMap = new Map<string, string[]>();
  for (const row of data) {
    const key = `${row.first_name} ${row.last_name}`.toLowerCase();
    const roles = nameMap.get(key) ?? [];
    roles.push(row.role);
    nameMap.set(key, roles);
  }
  const duplicates = new Set<string>();
  for (const [key, roles] of nameMap) {
    if (new Set(roles).size > 1) {
      duplicates.add(key);
    }
  }
  return duplicates;
}

export function UsersTable({ data }: UsersTableProps) {
  const { t } = useAdminI18n();
  const [confirm, setConfirm] = useState<{
    userId: string;
    status: string;
    label: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const duplicates = buildDuplicateSet(data);

  function handleAction(userId: string, status: string, label: string) {
    setConfirm({ userId, status, label });
  }

  function handleConfirm() {
    if (!confirm) return;
    startTransition(async () => {
      const result = await updateUserStatus(confirm.userId, confirm.status);
      if (result.success) {
        toast.success(t.users.statusUpdated);
      } else {
        toast.error(result.error ?? t.common.errorUpdating);
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
        const isDuplicate = duplicates.has(fullName.toLowerCase());
        return (
          <div className="flex items-center gap-3">
            <Avatar className="size-[34px]">
              {row.avatar_url && <AvatarImage src={row.avatar_url} alt={fullName} />}
              <AvatarFallback
                style={{ backgroundColor: bg, color: "white" }}
                className="text-[13px] font-semibold"
              >
                {row.first_name?.[0] ?? ""}
                {row.last_name?.[0] ?? ""}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-semibold truncate">
                  {fullName}
                </span>
                {isDuplicate && (
                  <span
                    style={{
                      display: "inline-block",
                      borderRadius: "9999px",
                      padding: "2px 8px",
                      fontSize: "10px",
                      fontWeight: 600,
                      backgroundColor: "#ffedd5",
                      color: "#c2410c",
                    }}
                  >
                    {t.users.duplicateAccount}
                  </span>
                )}
              </div>
              <div className="text-[12px] text-[#6b7280] truncate">
                {row.email}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "role",
      header: t.users.tableRole,
      render: (row) => (
        <StatusBadge type="role" value={row.role} labels={t.statuses.role} />
      ),
    },
    {
      key: "status",
      header: t.common.status,
      render: (row) => (
        <StatusBadge
          type="userStatus"
          value={row.status ?? "active"}
          labels={t.statuses.userStatus}
        />
      ),
    },
    {
      key: "created_at",
      header: t.users.tableRegisteredAt,
      render: (row) =>
        row.created_at
          ? new Intl.DateTimeFormat(dateLocale, {
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date(row.created_at))
          : "—",
    },
    {
      key: "actions",
      header: "",
      className: "w-10",
      render: (row) => (
        <div className="opacity-0 group-hover/row:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label={t.common.actions}>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(row.status ?? "active") !== "active" && (
                <DropdownMenuItem
                  onClick={() =>
                    handleAction(row.id, "active", t.users.activate)
                  }
                >
                  {t.users.activate}
                </DropdownMenuItem>
              )}
              {(row.status ?? "active") !== "suspended" && (
                <DropdownMenuItem
                  onClick={() =>
                    handleAction(row.id, "suspended", t.users.suspend)
                  }
                  className="text-destructive"
                >
                  {t.users.suspend}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        rowKey={(row) => row.id}
        emptyTitle={t.users.emptyTitle}
        emptyDescription={t.common.noResultsHint}
        variant="admin"
      />
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={t.users.confirmTitle.replace("{action}", confirm?.label ?? "")}
        description={t.users.confirmDescription.replace(
          "{action}",
          confirm?.label?.toLowerCase() ?? ""
        )}
        confirmLabel={confirm?.label ?? t.common.confirm}
        variant={confirm?.status === "suspended" ? "destructive" : "default"}
        loading={isPending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
