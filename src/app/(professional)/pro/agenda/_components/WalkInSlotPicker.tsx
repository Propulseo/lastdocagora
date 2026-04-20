"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Zap, Clock, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { RADIUS } from "@/lib/design-tokens";
import type { SlotInfo } from "@/app/(professional)/_actions/walkins";

export interface WalkInSlotPickerProps {
  walkInT: Record<string, string>;
  todayStr: string;
  todaySlots: SlotInfo[];
  loadingSlots: boolean;
  selectedDate: string;
  selectedTime: string;
  currentSlot: string | null;
  manualMode: boolean;
  manualDate: string;
  manualTime: string;
  onSelectSlot: (time: string) => void;
  onToggleManualMode: () => void;
  onManualDateChange: (value: string) => void;
  onManualTimeChange: (value: string) => void;
}

export function WalkInSlotPicker({
  walkInT,
  todayStr,
  todaySlots,
  loadingSlots,
  selectedDate,
  selectedTime,
  currentSlot,
  manualMode,
  manualDate,
  manualTime,
  onSelectSlot,
  onToggleManualMode,
  onManualDateChange,
  onManualTimeChange,
}: WalkInSlotPickerProps) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <Clock className="size-3.5 text-muted-foreground" />
        {walkInT.selectSlot}
      </Label>

      {!manualMode && (
        <>
          {loadingSlots ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-border/40 bg-muted/30 py-6">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {walkInT.loadingSlots}
              </span>
            </div>
          ) : todaySlots.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-border/40 bg-muted/30 py-6">
              <span className="text-sm text-muted-foreground">
                {walkInT.noSlotsToday}
              </span>
            </div>
          ) : (
            <div className="space-y-3 max-h-[200px] overflow-y-auto rounded-lg border border-border/40 p-3">
              <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {walkInT.today}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {todaySlots.map((slot) => {
                  const time = slot.slot_start.slice(0, 5);
                  const isNow = slot.slot_start === currentSlot;
                  const isSelected =
                    selectedTime === slot.slot_start &&
                    selectedDate === todayStr;

                  return (
                    <button
                      key={slot.slot_start}
                      type="button"
                      onClick={() => onSelectSlot(slot.slot_start)}
                      className={cn(
                        "relative flex items-center justify-center gap-1 border px-2 py-2.5 text-sm font-medium transition-colors min-h-[44px]", RADIUS.element,
                        isSelected
                          ? "bg-amber-500 text-white border-amber-500"
                          : isNow
                            ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-600"
                            : "border-border bg-background hover:bg-accent/50"
                      )}
                    >
                      {isNow && (
                        <Zap className="size-3 shrink-0" />
                      )}
                      <span>{time}</span>
                      {isNow && !isSelected && (
                        <span className="absolute -top-1.5 -right-1.5 rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white leading-tight">
                          {walkInT.now}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Manual mode fields */}
      {manualMode && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/40 p-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {walkInT.manualDate}
            </Label>
            <Input
              type="date"
              value={manualDate}
              onChange={(e) => onManualDateChange(e.target.value)}
              className="min-h-[44px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {walkInT.manualTime}
            </Label>
            <Input
              type="time"
              value={manualTime}
              onChange={(e) => onManualTimeChange(e.target.value)}
              className="min-h-[44px]"
            />
          </div>
        </div>
      )}

      {/* Toggle manual mode */}
      <button
        type="button"
        onClick={onToggleManualMode}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Pencil className="size-3" />
        {manualMode ? walkInT.backToSlots : walkInT.customTime}
      </button>
    </div>
  );
}
