"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { NotificationLog } from "../_types/reminders";
import { SHADOW, RADIUS } from "@/lib/design-tokens";

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

export interface HistoryTableProps {
  paginated: NotificationLog[];
  filtered: NotificationLog[];
  pageSize: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  labels: {
    date?: string;
    patient?: string;
    type?: string;
    channel?: string;
    status?: string;
  };
  statusLabels: Record<string, string>;
}

export function HistoryTable({
  paginated,
  filtered,
  pageSize,
  currentPage,
  totalPages,
  onPageChange,
  labels,
  statusLabels,
}: HistoryTableProps) {
  return (
    <Card className={`${RADIUS.card} ${SHADOW.card}`}>
      <CardContent className="p-0">
        <div className={`${RADIUS.sm} border overflow-x-auto`}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{labels.date}</TableHead>
                <TableHead>{labels.patient}</TableHead>
                <TableHead>{labels.type}</TableHead>
                <TableHead>{labels.channel}</TableHead>
                <TableHead>{labels.status}</TableHead>
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

        {filtered.length > pageSize && (
          <div className="flex items-center justify-between gap-4 p-4">
            <p className="text-muted-foreground text-sm">
              {(currentPage - 1) * pageSize + 1} -{" "}
              {Math.min(currentPage * pageSize, filtered.length)} /{" "}
              {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
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
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
