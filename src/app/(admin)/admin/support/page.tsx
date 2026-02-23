import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { SupportFilters } from "./_components/support-filters";
import { TicketRow } from "./_components/ticket-row";

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function SupportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params.page ?? "1"));
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("support_tickets")
    .select(
      "id, subject, status, priority, updated_at, created_at, user_id, users!support_tickets_user_id_fkey(first_name, last_name, email)",
      { count: "exact" }
    )
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.priority && params.priority !== "all") {
    query = query.eq("priority", params.priority);
  }
  if (params.search) {
    query = query.ilike("subject", `%${params.search}%`);
  }

  const { data: tickets, count } = await query;

  const mapped = (tickets ?? []).map((t) => {
    const user = t.users as unknown as {
      first_name: string;
      last_name: string;
      email: string;
    } | null;
    return {
      id: t.id,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      updated_at: t.updated_at,
      created_at: t.created_at,
      user_email: user?.email ?? "—",
      user_name: user ? `${user.first_name} ${user.last_name}` : "—",
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suporte"
        description="Tickets de suporte dos utilizadores"
      />

      <SupportFilters />

      {mapped.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col" className="w-8" />
                <TableHead scope="col">Assunto</TableHead>
                <TableHead scope="col">Utilizador</TableHead>
                <TableHead scope="col">Estado</TableHead>
                <TableHead scope="col">Prioridade</TableHead>
                <TableHead scope="col">Atualizado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mapped.map((ticket) => (
                <TicketRow key={ticket.id} ticket={ticket} />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title="Nenhum ticket de suporte encontrado"
          description="Tente ajustar os filtros de pesquisa."
        />
      )}

      <Pagination total={count ?? 0} pageSize={PAGE_SIZE} />
    </div>
  );
}
