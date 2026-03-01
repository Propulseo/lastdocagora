"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { Clock } from "lucide-react";
import type { useProfessionalI18n } from "@/lib/i18n/pro";
import type { NotificationLog } from "../_types/reminders";

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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t.reminders.history.title}</h2>
        <p className="text-muted-foreground text-sm">
          {t.reminders.history.subtitle}
        </p>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Clock}
              title={t.reminders.history.empty.title}
              description={t.reminders.history.empty.description}
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
                    <TableHead>{t.reminders.history.date}</TableHead>
                    <TableHead>{t.reminders.history.patient}</TableHead>
                    <TableHead>{t.reminders.history.type}</TableHead>
                    <TableHead>{t.reminders.history.channel}</TableHead>
                    <TableHead>{t.reminders.history.status}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notif) => {
                    const patientName = notif.appointments?.patients
                      ? [
                          notif.appointments.patients.first_name,
                          notif.appointments.patients.last_name,
                        ]
                            .filter(Boolean)
                            .join(" ") || "\u2014"
                      : "\u2014";

                    const statusLabel =
                      t.reminders.history.statusLabels[
                        notif.status as keyof typeof t.reminders.history.statusLabels
                      ] ?? notif.status;

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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
