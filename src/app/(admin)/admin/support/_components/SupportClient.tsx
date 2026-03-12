"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-page-header";
import { SupportFilters } from "./support-filters";
import { TicketRow } from "./ticket-row";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface MappedTicket {
  id: string;
  subject: string;
  status: string;
  priority: string | null;
  updated_at: string | null;
  created_at: string | null;
  user_email: string;
  user_name: string;
  user_avatar_url: string | null;
}

interface SupportClientProps {
  tickets: MappedTicket[];
  count: number;
  pageSize: number;
}

export function SupportClient({
  tickets,
  count,
  pageSize,
}: SupportClientProps) {
  const { t } = useAdminI18n();

  return (
    <div className="space-y-6">
      <AdminPageHeader section="support" />

      <SupportFilters />

      {tickets.length > 0 ? (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col" className="w-8" />
                <TableHead scope="col">{t.support.tableSubject}</TableHead>
                <TableHead scope="col">{t.support.tableUser}</TableHead>
                <TableHead scope="col">{t.common.status}</TableHead>
                <TableHead scope="col">{t.support.tablePriority}</TableHead>
                <TableHead scope="col">{t.support.tableUpdatedAt}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TicketRow key={ticket.id} ticket={ticket} />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          title={t.support.emptyTitle}
          description={t.common.noResultsHint}
        />
      )}

      <Pagination total={count} pageSize={pageSize} />
    </div>
  );
}
