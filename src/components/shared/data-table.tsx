import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "./empty-state";

export interface ColumnDef<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  rowKey: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
  variant?: "default" | "admin";
  rowClassName?: (row: T) => string | undefined;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyTitle = "Nenhum resultado encontrado",
  emptyDescription = "Tente ajustar os filtros de pesquisa.",
  emptyAction,
  onRowClick,
  variant = "default",
  rowClassName,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  const isAdmin = variant === "admin";

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                scope="col"
                className={
                  isAdmin
                    ? `text-[11px] uppercase tracking-wider text-[#6b7280] border-b-2 border-[#e5e7eb] bg-[#f9fafb] sticky top-0 ${col.className ?? ""}`
                    : col.className
                }
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow
              key={rowKey(row)}
              className={[
                onRowClick ? "cursor-pointer" : undefined,
                isAdmin
                  ? `h-[52px] hover:bg-[#f0f9ff] border-b border-[#f3f4f6] group/row ${idx % 2 === 1 ? "bg-[#fafafa]" : ""}`
                  : undefined,
                rowClassName?.(row),
              ]
                .filter(Boolean)
                .join(" ") || undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <TableCell key={col.key} className={col.className}>
                  {col.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
