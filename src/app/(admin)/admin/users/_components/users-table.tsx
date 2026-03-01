"use client";

import { useState, useTransition } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
}

interface UsersTableProps {
  data: UserRow[];
}

export function UsersTable({ data }: UsersTableProps) {
  const { t } = useAdminI18n();
  const [confirm, setConfirm] = useState<{
    userId: string;
    status: string;
    label: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

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
      render: (row) => (
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback>
              {row.first_name?.[0] ?? ""}
              {row.last_name?.[0] ?? ""}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">
            {row.first_name} {row.last_name}
          </span>
        </div>
      ),
    },
    { key: "email", header: t.users.tableEmail, render: (row) => row.email },
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
          ? new Date(row.created_at).toLocaleDateString(dateLocale)
          : "—",
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
