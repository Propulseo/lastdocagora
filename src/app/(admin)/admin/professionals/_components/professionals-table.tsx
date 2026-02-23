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
        toast.success("Estado de verificacao atualizado");
      } else {
        toast.error(result.error ?? "Erro ao atualizar");
      }
      setConfirm(null);
    });
  }

  const columns: ColumnDef<ProfessionalRow>[] = [
    {
      key: "name",
      header: "Nome",
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
      header: "Especialidade",
      render: (row) => row.specialty,
    },
    {
      key: "city",
      header: "Cidade",
      render: (row) => row.city ?? "—",
    },
    {
      key: "rating",
      header: "Avaliacao",
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
      header: "Estado",
      render: (row) => (
        <StatusBadge type="verification" value={row.verification_status} />
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
              <Button variant="ghost" size="sm" aria-label="Acoes">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  setConfirm({ id: row.id, status: "verified", label: "Verificar" })
                }
              >
                Verificar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  setConfirm({ id: row.id, status: "rejected", label: "Rejeitar" })
                }
                className="text-destructive"
              >
                Rejeitar
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
        emptyTitle="Nenhum profissional encontrado"
        emptyDescription="Tente ajustar os filtros de pesquisa."
      />
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={`${confirm?.label} profissional?`}
        description={`Tem a certeza que pretende ${confirm?.label?.toLowerCase()} este profissional?`}
        confirmLabel={confirm?.label ?? "Confirmar"}
        variant={confirm?.status === "rejected" ? "destructive" : "default"}
        loading={isPending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
