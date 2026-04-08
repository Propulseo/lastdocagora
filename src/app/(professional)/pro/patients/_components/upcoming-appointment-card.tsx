"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RADIUS, SHADOW } from "@/lib/design-tokens";
import { updateAppointmentStatus } from "@/app/(professional)/_actions/attendance";
import type { PatientDetailEnhanced } from "@/app/(professional)/_actions/patients";
import { STATUS_VARIANT } from "./patient-drawer-helpers";

type UpcomingItem = PatientDetailEnhanced["upcomingAppointments"][number];

interface ActionLabels {
  confirm: string;
  cancel: string;
  confirmed: string;
  cancelled: string;
  error: string;
}

interface UpcomingAppointmentCardProps {
  apt: UpcomingItem;
  dateLocale: "pt-PT" | "fr-FR" | "en-GB";
  statusLabels: Record<string, string>;
  actionLabels: ActionLabels;
  onStatusChange: (aptId: string, newStatus: "confirmed" | "cancelled") => void;
}

export function UpcomingAppointmentCard({
  apt,
  dateLocale,
  statusLabels,
  actionLabels,
  onStatusChange,
}: UpcomingAppointmentCardProps) {
  const [loading, setLoading] = useState<"confirming" | "cancelling" | null>(null);
  const [open, setOpen] = useState(false);

  const isActionable = apt.status === "pending" || apt.status === "confirmed";

  async function handleAction(newStatus: "confirmed" | "cancelled") {
    setLoading(newStatus === "confirmed" ? "confirming" : "cancelling");
    const result = await updateAppointmentStatus(apt.id, newStatus);
    setLoading(null);
    if (result.success) {
      toast.success(
        newStatus === "confirmed"
          ? actionLabels.confirmed
          : actionLabels.cancelled,
      );
      setOpen(false);
      onStatusChange(apt.id, newStatus);
    } else {
      toast.error(actionLabels.error);
    }
  }

  const card = (
    <div
      className={`flex items-start justify-between ${RADIUS.element} border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-800 dark:bg-blue-950/30 ${SHADOW.subtle} ${
        isActionable
          ? "cursor-pointer transition-colors hover:bg-blue-100/70 dark:hover:bg-blue-900/40"
          : ""
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium">
          {new Date(apt.date).toLocaleDateString(dateLocale)}{" "}
          <span className="font-normal text-muted-foreground">
            {apt.time.slice(0, 5)}
          </span>
        </p>
        {apt.serviceName && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {apt.serviceName}
          </p>
        )}
      </div>
      <Badge
        variant={STATUS_VARIANT[apt.status] ?? "outline"}
        className="ml-2 shrink-0 text-xs"
      >
        {statusLabels[apt.status] ?? apt.status}
      </Badge>
    </div>
  );

  if (!isActionable) return card;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{card}</PopoverTrigger>
      <PopoverContent className={`w-56 p-2 ${RADIUS.element}`} align="end">
        <div className="flex flex-col gap-1.5">
          {apt.status === "pending" && (
            <Button
              variant="ghost"
              size="sm"
              className="min-h-11 w-full justify-start gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
              disabled={loading !== null}
              onClick={() => handleAction("confirmed")}
            >
              {loading === "confirming" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle className="size-4" />
              )}
              {actionLabels.confirm}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11 w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            disabled={loading !== null}
            onClick={() => handleAction("cancelled")}
          >
            {loading === "cancelling" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <XCircle className="size-4" />
            )}
            {actionLabels.cancel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
