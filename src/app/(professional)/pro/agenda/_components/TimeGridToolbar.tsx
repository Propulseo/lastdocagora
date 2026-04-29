"use client";

import { Check, ClipboardPaste, Copy, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { resolveErrorMessage } from "@/lib/error-messages";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { RADIUS } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { parseLocalDate } from "../_lib/date-utils";
import { deleteAllDayAvailability } from "@/app/(professional)/_actions/availability";
import type { ClipboardData } from "./DayTimeGrid";
import type { AvailabilitySlot } from "../_types/agenda";

interface TimeGridToolbarProps {
  availabilitySlots: AvailabilitySlot[];
  clipboard: ClipboardData | null;
  selectedDate: string;
  professionalId: string;
  justCopied: boolean;
  isBatchDeleting: boolean;
  onCopy: (data: ClipboardData) => void;
  onJustCopiedChange: (value: boolean) => void;
  onBatchDeletingChange: (value: boolean) => void;
  onAvailabilityDeleted: () => void;
  onPasteOpen: () => void;
}

export function TimeGridToolbar({
  availabilitySlots,
  clipboard,
  selectedDate,
  professionalId,
  justCopied,
  isBatchDeleting,
  onCopy,
  onJustCopiedChange,
  onBatchDeletingChange,
  onAvailabilityDeleted,
  onPasteOpen,
}: TimeGridToolbarProps) {
  const { t } = useProfessionalI18n();

  const canPaste =
    clipboard !== null && clipboard.sourceDate !== selectedDate;

  const handleCopy = () => {
    if (availabilitySlots.length === 0) return;
    onCopy({
      slots: availabilitySlots.map((s) => ({
        start_time: s.start_time,
        end_time: s.end_time,
      })),
      sourceDate: selectedDate,
    });
    onJustCopiedChange(true);
    setTimeout(() => onJustCopiedChange(false), 2000);
  };

  const handleBatchDelete = async () => {
    onBatchDeletingChange(true);
    const d = parseLocalDate(selectedDate);
    const result = await deleteAllDayAvailability(
      professionalId,
      d.getDay(),
      selectedDate,
    );
    if (result.success) {
      toast.success(t.agenda.clearDaySuccess);
      onAvailabilityDeleted();
    } else {
      toast.error(resolveErrorMessage(result.error, t.agenda.deleteSlotError));
    }
    onBatchDeletingChange(false);
  };

  const dateForDisplay = (() => {
    const d = parseLocalDate(selectedDate);
    const dayName = t.agenda.daysFull[d.getDay()];
    const day = d.getDate();
    const month = t.agenda.months[d.getMonth()];
    return `${dayName}, ${day} ${month}`;
  })();

  if (availabilitySlots.length === 0 && !canPaste) return null;

  return (
    <div className="flex items-center justify-end gap-2 px-4 pt-3 pb-0 flex-wrap">
      {/* Copy button */}
      {availabilitySlots.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5",
            justCopied
              ? "text-emerald-600 border-emerald-300 dark:text-emerald-400 dark:border-emerald-600"
              : clipboard
                ? "border-primary/30"
                : "",
          )}
          onClick={handleCopy}
        >
          {justCopied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              {t.agenda.slotsCopied}
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              {t.agenda.copySlots}
              {clipboard && (
                <span className="ml-1 size-1.5 rounded-full bg-primary inline-block" />
              )}
            </>
          )}
        </Button>
      )}

      {/* Paste button */}
      {canPaste && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-primary border-primary/30 hover:bg-primary/10 hover:border-primary"
          onClick={onPasteOpen}
        >
          <ClipboardPaste className="h-3.5 w-3.5" />
          {t.agenda.pasteSlots}
        </Button>
      )}

      {/* Clear day button */}
      {availabilitySlots.length > 0 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t.agenda.clearDayButton}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className={RADIUS.card}>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.agenda.clearDayTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {(t.agenda.clearDayDescription as string).replace(
                  "{{date}}",
                  dateForDisplay,
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isBatchDeleting}>
                {t.common.cancel}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBatchDelete}
                disabled={isBatchDeleting}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {isBatchDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t.agenda.clearDayConfirm
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
