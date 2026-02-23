import { DataTable, type ColumnDef } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";

interface AppointmentRow {
  id: string;
  patient_name: string;
  professional_name: string;
  date: string;
  time: string;
  status: string;
  payment_status: string;
}

const columns: ColumnDef<AppointmentRow>[] = [
  {
    key: "patient",
    header: "Paciente",
    render: (row) => <span className="font-medium">{row.patient_name}</span>,
  },
  {
    key: "professional",
    header: "Profissional",
    render: (row) => row.professional_name,
  },
  {
    key: "date",
    header: "Data",
    render: (row) => new Date(row.date).toLocaleDateString("pt-PT"),
  },
  {
    key: "time",
    header: "Hora",
    render: (row) => row.time,
  },
  {
    key: "status",
    header: "Estado",
    render: (row) => <StatusBadge type="appointment" value={row.status} />,
  },
  {
    key: "payment",
    header: "Pagamento",
    render: (row) => (
      <StatusBadge type="payment" value={row.payment_status} />
    ),
  },
];

interface AppointmentsTableProps {
  data: AppointmentRow[];
}

export function AppointmentsTable({ data }: AppointmentsTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      rowKey={(row) => row.id}
      emptyTitle="Nenhuma consulta encontrada"
      emptyDescription="Tente ajustar os filtros de pesquisa."
    />
  );
}
