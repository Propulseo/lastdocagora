import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";

interface TopProfessional {
  id: string;
  name: string | null;
  specialty: string | null;
  city: string | null;
  average_rating: number | null;
  total_appointments: number | null;
  total_reviews: number | null;
}

const columns: ColumnDef<TopProfessional>[] = [
  {
    key: "name",
    header: "Nome",
    className: "font-medium",
    render: (row) => row.name ?? "—",
  },
  {
    key: "specialty",
    header: "Especialidade",
    render: (row) => row.specialty ?? "—",
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
      row.average_rating != null ? (
        <Badge variant="secondary">
          {row.average_rating.toFixed(1)}
        </Badge>
      ) : (
        "—"
      ),
  },
  {
    key: "appointments",
    header: "Consultas",
    render: (row) => row.total_appointments ?? 0,
  },
  {
    key: "reviews",
    header: "Avaliacoes",
    render: (row) => row.total_reviews ?? 0,
  },
];

interface TopProfessionalsTableProps {
  data: TopProfessional[];
}

export function TopProfessionalsTable({ data }: TopProfessionalsTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      rowKey={(row) => row.id}
      emptyTitle="Nenhum profissional encontrado"
      emptyDescription="Ainda nao existem profissionais na plataforma."
    />
  );
}
