"use client";

import { useProfessionalI18n } from "@/lib/i18n/pro";
import { cn } from "@/lib/utils";
import { RADIUS } from "@/lib/design-tokens";
import { toLocalDateStr } from "../_lib/date-utils";
import { RejectAppointmentDialog } from "./RejectAppointmentDialog";
import { PendingBannerHeader } from "./PendingBannerHeader";
import { PendingAppointmentCard } from "./PendingAppointmentCard";
import type { PendingAppointment } from "./PendingAppointmentCard";
import { usePendingActions } from "./usePendingActions";
import { useState } from "react";

/* ─── Types ─── */

interface PendingBannerProps {
  professionalId: string;
  onStatusChanged: () => void;
  onAppointmentUpdate: (
    appointmentId: string,
    attendanceStatus: string,
    appointmentStatus?: string,
  ) => void;
}

/* ─── Urgency grouping ─── */

type UrgencyGroup = "today" | "tomorrow" | "later";

function groupByUrgency(appointments: PendingAppointment[]): Record<UrgencyGroup, PendingAppointment[]> {
  const now = new Date();
  const todayStr = toLocalDateStr(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = toLocalDateStr(tomorrow);

  const groups: Record<UrgencyGroup, PendingAppointment[]> = {
    today: [],
    tomorrow: [],
    later: [],
  };

  for (const apt of appointments) {
    if (apt.appointment_date === todayStr) groups.today.push(apt);
    else if (apt.appointment_date === tomorrowStr) groups.tomorrow.push(apt);
    else groups.later.push(apt);
  }

  return groups;
}

const GROUP_STYLES: Record<UrgencyGroup, { dot: string; text: string }> = {
  today: {
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
  },
  tomorrow: {
    dot: "bg-orange-500",
    text: "text-orange-700 dark:text-orange-400",
  },
  later: {
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
  },
};

/* ─── Main Component ─── */

export function PendingBanner({
  professionalId,
  onStatusChanged,
  onAppointmentUpdate,
}: PendingBannerProps) {
  const { t } = useProfessionalI18n();
  const [expanded, setExpanded] = useState(false);

  const {
    pending,
    loading,
    processingIds,
    rejectTarget,
    setRejectTarget,
    isRejecting,
    handleConfirm,
    handleRejectConfirm,
    handleConfirmAll,
  } = usePendingActions({ professionalId, onStatusChanged, onAppointmentUpdate, t });

  if (loading || pending.length === 0) return null;

  const groups = groupByUrgency(pending);
  const groupOrder: UrgencyGroup[] = ["today", "tomorrow", "later"];
  const groupLabels: Record<UrgencyGroup, string> = {
    today: t.agenda.pendingBanner.groupToday,
    tomorrow: t.agenda.pendingBanner.groupTomorrow,
    later: t.agenda.pendingBanner.groupLater,
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const monthName = (t.agenda.months[monthIdx] ?? "").slice(0, 3);
    return `${day} ${monthName}`;
  };

  return (
    <>
      <div className={cn(RADIUS.element, "border border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30 overflow-hidden")}>
        <PendingBannerHeader
          count={pending.length}
          expanded={expanded}
          onToggle={() => setExpanded(!expanded)}
          onConfirmAll={handleConfirmAll}
          t={t}
        />

        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-200 ease-out",
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-1 px-4 pb-4">
              {groupOrder.map((groupKey) => {
                const items = groups[groupKey];
                if (items.length === 0) return null;

                const style = GROUP_STYLES[groupKey];

                return (
                  <div key={groupKey}>
                    <div className="flex items-center gap-2 py-2">
                      <span className={cn("size-2 rounded-full", style.dot)} />
                      <span
                        className={cn(
                          "text-xs font-semibold uppercase tracking-wider",
                          style.text,
                        )}
                      >
                        {groupLabels[groupKey]}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ({items.length})
                      </span>
                      <div className="flex-1 border-t border-orange-200/60 dark:border-orange-800/40" />
                    </div>

                    <div className="space-y-1.5">
                      {items.map((apt) => (
                        <PendingAppointmentCard
                          key={apt.id}
                          appointment={apt}
                          groupKey={groupKey}
                          isProcessing={processingIds.has(apt.id)}
                          formatDate={formatDate}
                          onConfirm={handleConfirm}
                          onReject={setRejectTarget}
                          t={t}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <RejectAppointmentDialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
        onConfirm={handleRejectConfirm}
        isUpdating={isRejecting}
      />
    </>
  );
}
