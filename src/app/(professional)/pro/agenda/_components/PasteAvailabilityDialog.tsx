"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RADIUS } from "@/lib/design-tokens";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { cn } from "@/lib/utils";
import { toLocalDateStr } from "../_lib/date-utils";
import { pasteAvailabilitySlots } from "@/app/(professional)/_actions/availability";
import type { ClipboardData } from "./DayTimeGrid";

interface PasteAvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clipboard: ClipboardData | null;
  targetDate: string;
  existingCount: number;
  professionalId: string;
  onPasted: () => void;
}

function getNext7Days(today: Date): { date: string; label: string; dayIndex: number }[] {
  const days: { date: string; label: string; dayIndex: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: toLocalDateStr(d),
      label: "", // will be filled with i18n
      dayIndex: d.getDay(),
    });
  }
  return days;
}

export function PasteAvailabilityDialog({
  open,
  onOpenChange,
  clipboard,
  targetDate,
  existingCount,
  professionalId,
  onPasted,
}: PasteAvailabilityDialogProps) {
  const { t } = useProfessionalI18n();
  const [isPasting, setIsPasting] = useState(false);
  const [multiDay, setMultiDay] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  const today = new Date();
  const next7 = getNext7Days(today);

  const toggleDate = (date: string) => {
    setSelectedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date],
    );
  };

  const handlePaste = async () => {
    if (!clipboard) return;
    setIsPasting(true);

    const dates = multiDay && selectedDates.length > 0 ? selectedDates : [targetDate];
    const result = await pasteAvailabilitySlots(
      professionalId,
      clipboard.slots,
      dates,
    );

    if (result.success) {
      let msg = (t.agenda.pasteSuccess as string).replace(
        "{{created}}",
        String(result.created),
      );
      if (result.skipped > 0) {
        msg +=
          " — " +
          (t.agenda.alreadyExistsIgnored as string).replace(
            "{{skipped}}",
            String(result.skipped),
          );
      }
      toast.success(msg);
      onPasted();
      onOpenChange(false);
    } else {
      toast.error(result.error ?? t.agenda.deleteSlotError);
    }

    setIsPasting(false);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setMultiDay(false);
      setSelectedDates([]);
    }
    onOpenChange(val);
  };

  if (!clipboard) return null;

  const daysShort = t.agenda.days as string[];
  const months = t.agenda.months as string[];

  const formatDayLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const dayName = daysShort[d.getDay()];
    const day = d.getDate();
    const month = (months[d.getMonth()] ?? "").slice(0, 3).toLowerCase();
    return `${dayName} ${day} ${month}`;
  };

  const canPaste = multiDay ? selectedDates.length > 0 : true;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn(RADIUS.card, "sm:max-w-md")}>
        <DialogHeader>
          <DialogTitle>{t.agenda.pasteConfirmTitle}</DialogTitle>
          <DialogDescription>
            {t.agenda.pasteConfirmDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Slot list */}
          <div className="flex flex-wrap gap-2">
            {clipboard.slots.map((slot, i) => (
              <span
                key={i}
                className={cn(
                  "inline-flex items-center px-2.5 py-1 text-sm font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
                  RADIUS.badge,
                )}
              >
                {slot.start_time}–{slot.end_time}
              </span>
            ))}
          </div>

          {/* Warning if existing slots */}
          {!multiDay && existingCount > 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {(t.agenda.existingWarning as string).replace(
                "{{count}}",
                String(existingCount),
              )}
            </p>
          )}

          {/* Multi-day toggle */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="multi-day"
              checked={multiDay}
              onCheckedChange={(c) => {
                setMultiDay(!!c);
                if (!c) setSelectedDates([]);
              }}
            />
            <label htmlFor="multi-day" className="text-sm font-medium cursor-pointer">
              {t.agenda.pasteMultipleDays}
            </label>
          </div>

          {/* Day picker */}
          {multiDay && (
            <div className="grid grid-cols-2 gap-2">
              {next7
                .filter((d) => d.date !== clipboard.sourceDate)
                .map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => toggleDate(d.date)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors min-h-[44px]",
                      RADIUS.sm,
                      selectedDates.includes(d.date)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {formatDayLabel(d.date)}
                  </button>
                ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPasting}
          >
            {t.common.cancel}
          </Button>
          <Button onClick={handlePaste} disabled={isPasting || !canPaste}>
            {isPasting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t.agenda.paste
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
