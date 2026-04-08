"use client";

import { useState } from "react";
import { CalendarPlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RADIUS } from "@/lib/design-tokens";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { HOUR_HEIGHT, START_HOUR } from "../_lib/agenda-constants";
import type { AvailabilitySlot } from "../_types/agenda";
import { deleteAvailabilitySlot } from "@/app/(professional)/_actions/availability";

/* ─── Slot Separators ─── */
function SlotSeparators({
  startTime,
  endTime,
  slotDuration = 30,
}: {
  startTime: string;
  endTime: string;
  slotDuration?: number;
}) {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const totalMinutes = endH * 60 + endM - (startH * 60 + startM);
  const slotCount = Math.floor(totalMinutes / slotDuration);
  const pixelsPerMinute = HOUR_HEIGHT / 60;

  if (slotCount < 2) return null;

  return (
    <>
      {Array.from({ length: slotCount - 1 }, (_, i) => (
        <div
          key={i}
          className="absolute left-2 right-2 border-t border-dashed border-emerald-300/50 dark:border-emerald-600/30 pointer-events-none"
          style={{ top: (i + 1) * slotDuration * pixelsPerMinute }}
        />
      ))}
    </>
  );
}

/* ─── Main Component ─── */
interface AvailabilityBlockProps {
  slot: AvailabilitySlot;
  onCreateAppointment: (startTime: string, endTime: string) => void;
  onDeleted?: () => void;
}

export function AvailabilityBlock({
  slot,
  onCreateAppointment,
  onDeleted,
}: AvailabilityBlockProps) {
  const { t } = useProfessionalI18n();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [startH, startM] = slot.start_time.split(":").map(Number);
  const [endH, endM] = slot.end_time.split(":").map(Number);

  const topOffset = (startH - START_HOUR + startM / 60) * HOUR_HEIGHT;
  const durationMinutes = endH * 60 + endM - (startH * 60 + startM);
  const height = (durationMinutes / 60) * HOUR_HEIGHT;

  const startDisplay = slot.start_time.slice(0, 5);
  const endDisplay = slot.end_time.slice(0, 5);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteAvailabilitySlot(slot.id);
    if (result.success) {
      toast.success(t.agenda.deleteSlotSuccess);
      setShowDeleteDialog(false);
      onDeleted?.();
    } else {
      toast.error(result.error ?? t.agenda.deleteSlotError);
    }
    setIsDeleting(false);
  };

  return (
    <>
      <div
        className={cn(
          "absolute left-16 right-2 z-[1] overflow-hidden",
          // Shape
          "rounded-xl border border-emerald-200/80 dark:border-emerald-700/50",
          "bg-emerald-50/70 dark:bg-emerald-950/30",
          // Hover
          "cursor-pointer transition-all duration-150",
          "hover:shadow-md hover:-translate-y-0.5",
          "hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50",
          "group",
        )}
        style={{
          top: `${topOffset}px`,
          height: `${Math.max(height, 24)}px`,
        }}
        onClick={() => onCreateAppointment(startDisplay, endDisplay)}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-1">
          <span className="inline-flex items-center gap-1 text-[10px] leading-4 font-medium text-emerald-600/80 dark:text-emerald-400/80">
            <CalendarPlus className="h-3 w-3 shrink-0" />
            {t.agenda.availableLabel}
            <span className="opacity-60 tabular-nums">
              {startDisplay}–{endDisplay}
            </span>
          </span>

          {/* Delete button — visible on hover */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className={cn(
              "flex size-5 items-center justify-center rounded",
              "text-emerald-600 hover:text-red-600",
              "hover:bg-red-50 dark:hover:bg-red-950/30",
              "opacity-0 group-hover:opacity-100",
              "transition-all duration-150",
            )}
            title={t.agenda.deleteSlotTitle}
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Slot separators every 30 min */}
        <SlotSeparators startTime={startDisplay} endTime={endDisplay} />
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className={RADIUS.card}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.agenda.deleteSlotTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {(t.agenda.deleteSlotDescription as string).replace(
                "{{time}}",
                `${startDisplay}–${endDisplay}`,
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {t.common.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t.common.delete
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
