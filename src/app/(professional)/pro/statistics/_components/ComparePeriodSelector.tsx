"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import type { PeriodPreset } from "../_lib/compare-utils";

const PRESETS: PeriodPreset[] = ["this-month", "last-month", "3-months", "this-year", "custom"];

export function usePresetLabels() {
  const { t } = useProfessionalI18n();
  return {
    "this-month": t.statistics.compare?.thisMonth ?? "Este m\u00eas",
    "last-month": t.statistics.compare?.lastMonth ?? "M\u00eas passado",
    "3-months": t.statistics.compare?.last3Months ?? "3 \u00faltimos meses",
    "this-year": t.statistics.compare?.thisYear ?? "Este ano",
    "custom": t.statistics.compare?.custom ?? "Per\u00edodo personalizado",
  } as Record<PeriodPreset, string>;
}

export interface PeriodSelectorProps {
  label: string;
  color: string;
  borderColor: string;
  value: PeriodPreset;
  onChange: (v: PeriodPreset, customRange?: { from: string; to: string } | null) => void;
  labels: Record<PeriodPreset, string>;
}

export function PeriodSelector({ label, color, borderColor, value, onChange, labels }: PeriodSelectorProps) {
  const { t } = useProfessionalI18n();
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  const handlePresetChange = (v: string) => {
    const preset = v as PeriodPreset;
    if (preset !== "custom") {
      onChange(preset);
      setCustomFrom(undefined);
      setCustomTo(undefined);
    } else {
      onChange(preset);
    }
  };

  const handleDateChange = (type: "from" | "to", date: Date | undefined) => {
    const newFrom = type === "from" ? date : customFrom;
    const newTo = type === "to" ? date : customTo;
    if (type === "from") setCustomFrom(date);
    if (type === "to") setCustomTo(date);

    if (newFrom && newTo) {
      const fromStr = newFrom.toISOString().split("T")[0];
      const toStr = newTo.toISOString().split("T")[0];
      onChange("custom", { from: fromStr, to: toStr });
    }
  };

  return (
    <Card className={`flex-1 border-l-[3px] ${borderColor}`}>
      <CardContent className="flex flex-col gap-3 p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <span className={`inline-block size-2.5 shrink-0 rounded-full ${color}`} />
          <div className="min-w-0 flex-1">
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <Select value={value} onValueChange={handlePresetChange}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESETS.map((p) => (
                  <SelectItem key={p} value={p}>{labels[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {value === "custom" && (
          <div className="flex flex-wrap gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <CalendarIcon className="size-3.5" />
                  {customFrom ? format(customFrom, "dd/MM/yyyy") : (t.statistics.compare?.startDate ?? "Inicio")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customFrom} onSelect={(d) => handleDateChange("from", d)} />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                  <CalendarIcon className="size-3.5" />
                  {customTo ? format(customTo, "dd/MM/yyyy") : (t.statistics.compare?.endDate ?? "Fim")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customTo} onSelect={(d) => handleDateChange("to", d)} />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
