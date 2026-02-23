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
        toast.success("Estado do utilizador atualizado");
      } else {
        toast.error(result.error ?? "Erro ao atualizar");
      }
      setConfirm(null);
    });
  }

  const columns: ColumnDef<UserRow>[] = [
    {
      key: "name",
      header: "Nome",
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
    { key: "email", header: "Email", render: (row) => row.email },
    {
      key: "role",
      header: "Funcao",
      render: (row) => <StatusBadge type="role" value={row.role} />,
    },
    {
      key: "status",
      header: "Estado",
      render: (row) => (
        <StatusBadge type="userStatus" value={row.status ?? "active"} />
      ),
    },
    {
      key: "created_at",
      header: "Registado em",
      render: (row) =>
        row.created_at
          ? new Date(row.created_at).toLocaleDateString("pt-PT")
          : "—",
    },
    {
      key: "actions",
      header: "",
      className: "w-10",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" aria-label="Acoes">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(row.status ?? "active") !== "active" && (
              <DropdownMenuItem
                onClick={() => handleAction(row.id, "active", "Ativar")}
              >
                Ativar
              </DropdownMenuItem>
            )}
            {(row.status ?? "active") !== "suspended" && (
              <DropdownMenuItem
                onClick={() => handleAction(row.id, "suspended", "Suspender")}
                className="text-destructive"
              >
                Suspender
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
        emptyTitle="Nenhum utilizador encontrado"
        emptyDescription="Tente ajustar os filtros de pesquisa."
      />
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={`${confirm?.label} utilizador?`}
        description={`Tem a certeza que pretende ${confirm?.label?.toLowerCase()} este utilizador?`}
        confirmLabel={confirm?.label ?? "Confirmar"}
        variant={confirm?.status === "suspended" ? "destructive" : "default"}
        loading={isPending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
