"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
} from "@/components/shared/responsive-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale/pt";
import { RADIUS } from "@/lib/design-tokens";
import { useProfessionalI18n } from "@/lib/i18n/pro";

interface NewAvailabilityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalId: string;
  userId: string;
  onCreated: () => void;
  initialStartTime?: string;
  initialEndTime?: string;
  initialDate?: string;
}

export function NewAvailabilityModal({
  open,
  onOpenChange,
  professionalId,
  userId,
  onCreated,
  initialStartTime,
  initialEndTime,
  initialDate,
}: NewAvailabilityModalProps) {
  const { t } = useProfessionalI18n();
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [isRecurring, setIsRecurring] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [specificDate, setSpecificDate] = useState("");
  const [specificDateObj, setSpecificDateObj] = useState<Date | undefined>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill from drag when modal opens
  useEffect(() => {
    if (!open) return;
    if (initialStartTime) setStartTime(initialStartTime);
    if (initialEndTime) setEndTime(initialEndTime);
    if (initialDate) {
      setSpecificDate(initialDate);
      setSpecificDateObj(new Date(initialDate + "T00:00:00"));
      setIsRecurring(false);
    }
  }, [open, initialStartTime, initialEndTime, initialDate]);

  const dayOptions = t.agenda.days.map((label, index) => ({
    value: String(index),
    label,
  }));

  const handleSave = async () => {
    setError("");

    if (startTime >= endTime) {
      setError(t.agenda.startBeforeEnd);
      return;
    }

    if (!isRecurring && !specificDate) {
      setError(t.agenda.selectDateOrRecurring);
      return;
    }

    setSaving(true);
    const supabase = createClient();

    const { error: insertError } = await supabase
      .from("availability")
      .insert({
        professional_id: professionalId,
        professional_user_id: userId,
        day_of_week: isRecurring
          ? parseInt(dayOfWeek)
          : new Date(specificDate + "T00:00:00").getDay(),
        start_time: startTime,
        end_time: endTime,
        is_recurring: isRecurring,
        specific_date: isRecurring ? null : specificDate,
      });

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    onOpenChange(false);
    onCreated();
    setStartTime("09:00");
    setEndTime("10:00");
    setIsRecurring(false);
    setDayOfWeek("1");
    setSpecificDate("");
    setSpecificDateObj(undefined);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className={`p-6 ${RADIUS.card}`}>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t.agenda.newAvailabilityTitle}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
              id="recurring"
            />
            <Label htmlFor="recurring">{t.agenda.recurring}</Label>
          </div>

          {isRecurring ? (
            <div className="space-y-2">
              <Label>{t.agenda.dayOfWeek}</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dayOptions.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t.agenda.specificDate}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarDays className="mr-2 size-4 text-muted-foreground" />
                    {specificDateObj
                      ? format(specificDateObj, "dd/MM/yyyy")
                      : <span className="text-muted-foreground">{t.agenda.specificDate}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={specificDateObj}
                    onSelect={(d) => {
                      setSpecificDateObj(d)
                      setSpecificDate(d ? format(d, "yyyy-MM-dd") : "")
                    }}
                    locale={pt}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t.agenda.startTime}</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.agenda.endTime}</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <ResponsiveDialogFooter>
          <Button variant="outline" className="min-h-[48px]" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button className="min-h-[48px]" onClick={handleSave} disabled={saving}>
            {saving ? t.common.saving : t.agenda.createSlot}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
