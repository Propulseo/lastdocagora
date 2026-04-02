"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
} from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2, Zap, Clock, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import {
  createWalkIn,
  getWalkInSlots,
  type SlotInfo,
} from "@/app/(professional)/_actions/walkins";
import { cn } from "@/lib/utils";
import { format, isToday, isTomorrow } from "date-fns";
import type { Locale } from "date-fns";
import { pt, enGB, fr } from "date-fns/locale";

interface ServiceOption {
  id: string;
  name: string;
}

type DaySlots = { date: string; slots: SlotInfo[] };

interface WalkInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalId: string;
  onCreated: () => void;
  preselectedTime?: string;
}

const dateLocaleMap: Record<string, Locale> = {
  "pt-PT": pt,
  "en-GB": enGB,
  "fr-FR": fr,
};

export function WalkInDialog({
  open,
  onOpenChange,
  professionalId,
  onCreated,
  preselectedTime,
}: WalkInDialogProps) {
  const { t } = useProfessionalI18n();
  const walkInT = t.agenda.walkIn as Record<string, string>;
  const supabase = useMemo(() => createClient(), []);

  const dateLocale =
    dateLocaleMap[t.common.dateLocale as string] ?? pt;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg p-6">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-amber-600" />
            {walkInT.dialogTitle}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        {open && (
          <WalkInForm
            walkInT={walkInT}
            supabase={supabase}
            professionalId={professionalId}
            preselectedTime={preselectedTime}
            dateLocale={dateLocale}
            onOpenChange={onOpenChange}
            onCreated={onCreated}
          />
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

/* ─── Inner form — remounted via key each time dialog opens ─── */

interface WalkInFormProps {
  walkInT: Record<string, string>;
  supabase: ReturnType<typeof createClient>;
  professionalId: string;
  preselectedTime?: string;
  dateLocale: Locale;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

function WalkInForm({
  walkInT,
  supabase,
  professionalId,
  preselectedTime,
  dateLocale,
  onOpenChange,
  onCreated,
}: WalkInFormProps) {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [patientName, setPatientName] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Slot picker state
  const [todaySlots, setTodaySlots] = useState<SlotInfo[]>([]);
  const [nextDaySlots, setNextDaySlots] = useState<DaySlots[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState(preselectedTime ?? "");
  const [currentSlot, setCurrentSlot] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadServices() {
      const { data } = await supabase
        .from("services")
        .select("id, name")
        .eq("professional_id", professionalId)
        .eq("is_active", true)
        .order("name");
      if (!cancelled) setServices(data ?? []);
    }

    async function loadSlots() {
      const result = await getWalkInSlots(professionalId);
      if (cancelled) return;
      setLoadingSlots(false);

      if (!result.success) {
        toast.error(walkInT.errorLoadSlots);
        return;
      }

      const todayStr = format(new Date(), "yyyy-MM-dd");

      setTodaySlots(result.today);
      setNextDaySlots(result.nextDays);
      setCurrentSlot(result.currentSlot);

      // Auto-select
      if (preselectedTime) {
        setSelectedTime(preselectedTime);
        setSelectedDate(todayStr);
      } else if (result.currentSlot) {
        setSelectedTime(result.currentSlot);
        setSelectedDate(todayStr);
      } else if (result.today.length > 0) {
        setSelectedTime(result.today[0].slot_start);
        setSelectedDate(todayStr);
      } else if (result.nextDays.length > 0) {
        const first = result.nextDays[0];
        setSelectedDate(first.date);
        setSelectedTime(first.slots[0].slot_start);
      }
    }

    loadServices();
    loadSlots();

    return () => {
      cancelled = true;
    };
  }, [supabase, professionalId, preselectedTime, walkInT.errorLoadSlots]);

  function selectSlot(date: string, time: string) {
    setSelectedDate(date);
    setSelectedTime(time);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientName.trim() || !serviceId || !selectedTime) return;

    setSaving(true);
    const result = await createWalkIn({
      patientName: patientName.trim(),
      serviceId,
      scheduledTime: selectedTime,
      scheduledDate: selectedDate || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setSaving(false);

    if (result.success) {
      toast.success(walkInT.success);
      onOpenChange(false);
      onCreated();
    } else {
      toast.error(walkInT.error);
    }
  }

  const canSubmit =
    patientName.trim() && serviceId && selectedTime && !saving;

  const todayStr = format(new Date(), "yyyy-MM-dd");

  function formatDateLabel(dateStr: string): string {
    const d = new Date(dateStr + "T00:00:00");
    if (isToday(d)) return walkInT.today;
    if (isTomorrow(d)) return walkInT.tomorrow;
    return format(d, "EEEE d MMMM", { locale: dateLocale });
  }

  const hasAnySlots =
    todaySlots.length > 0 || nextDaySlots.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Slot Picker */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <Clock className="size-3.5 text-muted-foreground" />
          {walkInT.selectSlot}
        </Label>

        {loadingSlots ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-border/40 bg-muted/30 py-6">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {walkInT.loadingSlots}
            </span>
          </div>
        ) : !hasAnySlots ? (
          <div className="flex items-center justify-center rounded-lg border border-border/40 bg-muted/30 py-6">
            <span className="text-sm text-muted-foreground">
              {walkInT.noSlotsAtAll}
            </span>
          </div>
        ) : (
          <div className="space-y-3 max-h-[200px] overflow-y-auto rounded-lg border border-border/40 p-3">
            {/* Today slots */}
            {todaySlots.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {walkInT.today}
                </p>
                <div className="grid grid-cols-3 gap-2">
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
                        onClick={() =>
                          selectSlot(todayStr, slot.slot_start)
                        }
                        className={cn(
                          "relative flex items-center justify-center gap-1 rounded-lg border px-2 py-2.5 text-sm font-medium transition-colors min-h-[44px]",
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

            {/* Today empty + next days */}
            {todaySlots.length === 0 && nextDaySlots.length > 0 && (
              <p className="text-xs text-muted-foreground italic mb-1">
                {walkInT.noSlotsToday}
              </p>
            )}

            {nextDaySlots.map((day) => (
              <div key={day.date}>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <CalendarDays className="size-3" />
                  {formatDateLabel(day.date)}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {day.slots.map((slot) => {
                    const time = slot.slot_start.slice(0, 5);
                    const isSelected =
                      selectedTime === slot.slot_start &&
                      selectedDate === day.date;

                    return (
                      <button
                        key={`${day.date}-${slot.slot_start}`}
                        type="button"
                        onClick={() =>
                          selectSlot(day.date, slot.slot_start)
                        }
                        className={cn(
                          "flex items-center justify-center rounded-lg border px-2 py-2.5 text-sm font-medium transition-colors min-h-[44px]",
                          isSelected
                            ? "bg-amber-500 text-white border-amber-500"
                            : "border-border bg-background hover:bg-accent/50"
                        )}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Patient name */}
      <div className="space-y-1.5">
        <Label>{walkInT.patientName}</Label>
        <Input
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          placeholder={walkInT.patientNamePlaceholder}
          autoFocus
        />
      </div>

      {/* Service */}
      <div className="space-y-1.5">
        <Label>{walkInT.service}</Label>
        <Select value={serviceId} onValueChange={setServiceId}>
          <SelectTrigger>
            <SelectValue placeholder={walkInT.servicePlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {services.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Phone + Email in a row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{walkInT.phone}</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={walkInT.phonePlaceholder}
          />
        </div>
        <div className="space-y-1.5">
          <Label>{walkInT.email}</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={walkInT.emailPlaceholder}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label>{walkInT.notes}</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={walkInT.notesPlaceholder}
          rows={2}
        />
      </div>

      {/* Selected slot recap */}
      {selectedTime && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
          <Clock className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
            {walkInT.selectedSlot}:{" "}
            {selectedDate && selectedDate !== todayStr
              ? `${formatDateLabel(selectedDate)}, `
              : ""}
            {selectedTime.slice(0, 5)}
            {selectedTime === currentSlot && (
              <span className="ml-1.5 inline-flex items-center gap-0.5 text-xs">
                <Zap className="size-3" />
                {walkInT.now}
              </span>
            )}
          </span>
        </div>
      )}

      <ResponsiveDialogFooter>
        <Button
          type="submit"
          disabled={!canSubmit}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white gap-2"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <UserPlus className="size-4" />
          )}
          {walkInT.submit}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  );
}
