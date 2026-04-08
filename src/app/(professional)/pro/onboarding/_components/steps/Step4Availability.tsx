"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, X, Clock } from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import type { StepHandle } from "./Step1Profile";

interface TimeSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface ExistingSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
}

interface Step4Props {
  existingAvailability: ExistingSlot[];
  onSubmit: (data: {
    slots: { day_of_week: number; start_time: string; end_time: string }[];
  }) => void;
}

let slotCounter = 0;
function genSlotId() {
  return `slot-${++slotCounter}`;
}

export const Step4Availability = forwardRef<StepHandle, Step4Props>(
  function Step4Availability({ existingAvailability, onSubmit }, ref) {
    const { t } = useProfessionalI18n();
    const ob = t.onboarding;

    const [newSlots, setNewSlots] = useState<TimeSlot[]>([]);
    const [error, setError] = useState("");

    const dayOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun
    const dayLabels = ob.step4.days;

    function addSlot(dayOfWeek: number, startTime: string, endTime: string) {
      setNewSlots((prev) => [
        ...prev,
        { id: genSlotId(), day_of_week: dayOfWeek, start_time: startTime, end_time: endTime },
      ]);
    }

    function removeSlot(id: string) {
      setNewSlots((prev) => prev.filter((s) => s.id !== id));
    }

    function addQuickSlot(dayOfWeek: number, type: "morning" | "afternoon") {
      if (type === "morning") {
        addSlot(dayOfWeek, "09:00", "13:00");
      } else {
        addSlot(dayOfWeek, "14:00", "18:00");
      }
    }

    function updateSlotTime(id: string, field: "start_time" | "end_time", value: string) {
      setNewSlots((prev) =>
        prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
      );
    }

    useImperativeHandle(ref, () => ({
      submit() {
        const total = existingAvailability.length + newSlots.length;
        if (total === 0) {
          setError(ob.step4.minOneSlot);
          return false;
        }
        // Validate start < end
        for (const slot of newSlots) {
          if (slot.start_time >= slot.end_time) {
            setError(ob.step4.startBeforeEnd);
            return false;
          }
        }
        setError("");

        if (newSlots.length > 0) {
          onSubmit({
            slots: newSlots.map((s) => ({
              day_of_week: s.day_of_week,
              start_time: s.start_time,
              end_time: s.end_time,
            })),
          });
        } else {
          onSubmit({ slots: [] });
        }
        return true;
      },
    }));

    // Group existing slots by day
    const existingByDay: Record<number, ExistingSlot[]> = {};
    for (const slot of existingAvailability) {
      if (!existingByDay[slot.day_of_week]) existingByDay[slot.day_of_week] = [];
      existingByDay[slot.day_of_week].push(slot);
    }

    // Group new slots by day
    const newByDay: Record<number, TimeSlot[]> = {};
    for (const slot of newSlots) {
      if (!newByDay[slot.day_of_week]) newByDay[slot.day_of_week] = [];
      newByDay[slot.day_of_week].push(slot);
    }

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">{ob.step4.title}</h2>
          <p className="text-sm text-muted-foreground">{ob.step4.subtitle}</p>
        </div>

        <div className="space-y-4">
          {dayOrder.map((day) => {
            const dayKey = String(day) as keyof typeof dayLabels;
            const existing = existingByDay[day] ?? [];
            const added = newByDay[day] ?? [];

            return (
              <Card key={day}>
                <CardContent className="space-y-3 pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">
                      {dayLabels[dayKey]}
                    </Label>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => addQuickSlot(day, "morning")}
                      >
                        {ob.step4.morning}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => addQuickSlot(day, "afternoon")}
                      >
                        {ob.step4.afternoon}
                      </Button>
                    </div>
                  </div>

                  {/* Existing slots (readonly) */}
                  {existing.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-1.5 text-sm"
                    >
                      <Clock className="size-3.5 text-muted-foreground" />
                      <span>
                        {slot.start_time} — {slot.end_time}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({ob.step4.existingSlots})
                      </span>
                    </div>
                  ))}

                  {/* New slots (editable) */}
                  {added.map((slot) => (
                    <div key={slot.id} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={slot.start_time}
                        onChange={(e) =>
                          updateSlotTime(slot.id, "start_time", e.target.value)
                        }
                        className="h-8 w-28"
                      />
                      <span className="text-sm text-muted-foreground">—</span>
                      <Input
                        type="time"
                        value={slot.end_time}
                        onChange={(e) =>
                          updateSlotTime(slot.id, "end_time", e.target.value)
                        }
                        className="h-8 w-28"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 text-destructive hover:text-destructive"
                        onClick={() => removeSlot(slot.id)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() => addSlot(day, "09:00", "10:00")}
                  >
                    <Plus className="size-3" />
                    {ob.step4.addSlot}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  },
);
