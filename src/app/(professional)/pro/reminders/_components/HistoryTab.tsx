"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { Clock, Download } from "lucide-react";
import type { useProfessionalI18n } from "@/lib/i18n/pro";
import type { NotificationLog } from "../_types/reminders";
import { downloadCsv } from "@/lib/export-csv";
import { HistoryFilters } from "./HistoryFilters";
import { HistoryTable } from "./HistoryTable";

const PAGE_SIZE = 20;

interface HistoryTabProps {
  notifications: NotificationLog[];
  t: ReturnType<typeof useProfessionalI18n>["t"];
}

export function HistoryTab({ notifications, t }: HistoryTabProps) {
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const historyLabels = t.reminders.history;
  const statusLabels = historyLabels.statusLabels as Record<string, string>;

  const filtered = useMemo(() => {
    let result = [...notifications];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((n) => {
        const patientName = n.appointments?.patients
          ? [n.appointments.patients.first_name, n.appointments.patients.last_name]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
          : "";
        return patientName.includes(q);
      });
    }

    if (channelFilter !== "all") {
      result = result.filter((n) => n.channel === channelFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((n) => n.status === statusFilter);
    }

    return result;
  }, [notifications, search, channelFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleExport = () => {
    const headers = [
      historyLabels.date,
      historyLabels.patient,
      historyLabels.type,
      historyLabels.channel,
      historyLabels.status,
    ];

    const rows = filtered.map((n) => {
      const patientName = n.appointments?.patients
        ? [n.appointments.patients.first_name, n.appointments.patients.last_name]
            .filter(Boolean)
            .join(" ") || ""
        : "";

      return [
        format(new Date(n.created_at), "yyyy-MM-dd HH:mm"),
        patientName,
        n.type,
        n.channel,
        n.status,
      ];
    });

    downloadCsv(headers, rows, "docagora-lembretes-historico");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{historyLabels.title}</h2>
          <p className="text-muted-foreground text-sm">{historyLabels.subtitle}</p>
        </div>
        {notifications.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-4" />
            {(t.reminders as unknown as Record<string, string>).export ?? "Export CSV"}
          </Button>
        )}
      </div>

      {notifications.length > 0 && (
        <HistoryFilters
          search={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          channelFilter={channelFilter}
          onChannelChange={(v) => { setChannelFilter(v); setPage(1); }}
          statusFilter={statusFilter}
          onStatusChange={(v) => { setStatusFilter(v); setPage(1); }}
          labels={historyLabels}
          statusLabels={statusLabels}
        />
      )}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Clock}
              title={historyLabels.empty.title}
              description={historyLabels.empty.description}
            />
          </CardContent>
        </Card>
      ) : (
        <HistoryTable
          paginated={paginated}
          filtered={filtered}
          pageSize={PAGE_SIZE}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          labels={historyLabels}
          statusLabels={statusLabels}
        />
      )}
    </div>
  );
}
