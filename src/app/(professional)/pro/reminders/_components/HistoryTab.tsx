"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { Clock, Search, ChevronLeft, ChevronRight, Download } from "lucide-react";
import type { useProfessionalI18n } from "@/lib/i18n/pro";
import type { NotificationLog } from "../_types/reminders";

const PAGE_SIZE = 20;
const CHANNELS = ["email", "sms", "whatsapp"] as const;
const STATUSES = ["pending", "sent", "delivered", "failed", "bounced"] as const;

interface HistoryTabProps {
  notifications: NotificationLog[];
  t: ReturnType<typeof useProfessionalI18n>["t"];
}

function getStatusVariant(
  status: string,
): "secondary" | "outline" | "default" | "destructive" {
  switch (status) {
    case "pending":
      return "secondary";
    case "sent":
      return "outline";
    case "delivered":
      return "default";
    case "failed":
    case "bounced":
      return "destructive";
    default:
      return "secondary";
  }
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

    // Search by patient name
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

    // Channel filter
    if (channelFilter !== "all") {
      result = result.filter((n) => n.channel === channelFilter);
    }

    // Status filter
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
    const headers = ["Date", "Patient", "Type", "Channel", "Status"];
    const csvLines = [headers.join(",")];

    for (const n of filtered) {
      const patientName = n.appointments?.patients
        ? [n.appointments.patients.first_name, n.appointments.patients.last_name]
            .filter(Boolean)
            .join(" ") || "-"
        : "-";

      csvLines.push(
        [
          format(new Date(n.created_at), "yyyy-MM-dd HH:mm"),
          `"${patientName.replace(/"/g, '""')}"`,
          n.type,
          n.channel,
          n.status,
        ].join(","),
      );
    }

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `docagora-reminders-history-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

      {/* Filters */}
      {notifications.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-xs">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder={historyLabels.searchPlaceholder ?? "Search..."}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>

          <Select
            value={channelFilter}
            onValueChange={(v) => {
              setChannelFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-auto min-w-[140px]">
              <SelectValue placeholder={historyLabels.channel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {historyLabels.allChannels ?? "All"}
              </SelectItem>
              {CHANNELS.map((ch) => (
                <SelectItem key={ch} value={ch}>
                  {ch.charAt(0).toUpperCase() + ch.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-auto min-w-[140px]">
              <SelectValue placeholder={historyLabels.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {historyLabels.allStatuses ?? "All"}
              </SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {statusLabels[s] ?? s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
        <Card>
          <CardContent className="p-0">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{historyLabels.date}</TableHead>
                    <TableHead>{historyLabels.patient}</TableHead>
                    <TableHead>{historyLabels.type}</TableHead>
                    <TableHead>{historyLabels.channel}</TableHead>
                    <TableHead>{historyLabels.status}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((notif) => {
                    const patientName = notif.appointments?.patients
                      ? [
                          notif.appointments.patients.first_name,
                          notif.appointments.patients.last_name,
                        ]
                          .filter(Boolean)
                          .join(" ") || "\u2014"
                      : "\u2014";

                    const statusLabel =
                      statusLabels[notif.status] ?? notif.status;

                    return (
                      <TableRow key={notif.id}>
                        <TableCell className="tabular-nums">
                          {format(
                            new Date(notif.created_at),
                            "dd/MM/yyyy HH:mm",
                          )}
                        </TableCell>
                        <TableCell>{patientName}</TableCell>
                        <TableCell>{notif.type}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{notif.channel}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusVariant(notif.status)}
                            className={cn(
                              notif.status === "delivered" &&
                                "bg-emerald-500/10 text-emerald-700 border-emerald-200",
                            )}
                          >
                            {statusLabel}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between gap-4 p-4">
                <p className="text-muted-foreground text-sm">
                  {(currentPage - 1) * PAGE_SIZE + 1} -{" "}
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)} /{" "}
                  {filtered.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-sm tabular-nums">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
