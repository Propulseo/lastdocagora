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
import { UserPlus, Loader2, Zap, Clock, Pencil } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import {
  createWalkIn,
  getWalkInSlots,
  type SlotInfo,
} from "@/app/(professional)/_actions/walkins";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Locale } from "date-fns";
import { pt, enGB, fr } from "date-fns/locale";

interface ServiceOption {
  id: string;
  name: string;
}

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

/* ─── Inner form — remounted each time dialog opens ─── */

interface WalkInFormProps {
  walkInT: Record<string, string>;
  professionalId: string;
  preselectedTime?: string;
  dateLocale: Locale;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

function WalkInForm({
  walkInT,
  professionalId,
  preselectedTime,
  dateLocale,
  onOpenChange,
  onCreated,
}: WalkInFormProps) {
  const supabase = useMemo(() => createClient(), []);

  const [services, setServices] = useState<ServiceOption[]>([]);
  const [patientName, setPatientName] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Slot picker state
  const [todaySlots, setTodaySlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState(preselectedTime ?? "");
  const [currentSlot, setCurrentSlot] = useState<string | null>(null);

  // Manual mode state
  const [manualMode, setManualMode] = useState(false);
  const [manualDate, setManualDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [manualTime, setManualTime] = useState(format(new Date(), "HH:mm"));

  const todayStr = format(new Date(), "yyyy-MM-dd");

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

      setTodaySlots(result.today);
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
      }
    }

    loadServices();
    loadSlots();

    return () => {
      cancelled = true;
    };
  }, [supabase, professionalId, preselectedTime, walkInT.errorLoadSlots, todayStr]);

  function selectSlot(time: string) {
    setManualMode(false);
    setSelectedDate(todayStr);
    setSelectedTime(time);
  }

  function toggleManualMode() {
    setManualMode((prev) => {
      const next = !prev;
      if (next) {
        // Switching to manual — clear slot selection
        setSelectedDate(manualDate);
        setSelectedTime(manualTime + ":00");
      } else {
        // Switching back to slots — re-select current or first slot
        setSelectedDate(todayStr);
        if (currentSlot) {
          setSelectedTime(currentSlot);
        } else if (todaySlots.length > 0) {
          setSelectedTime(todaySlots[0].slot_start);
        } else {
          setSelectedTime("");
        }
      }
      return next;
    });
  }

  function handleManualDateChange(value: string) {
    setManualDate(value);
    setSelectedDate(value);
  }

  function handleManualTimeChange(value: string) {
    setManualTime(value);
    setSelectedTime(value + ":00");
  }

  // Derive the final time/date for submission
  const finalDate = manualMode ? manualDate : selectedDate;
  const finalTime = manualMode ? manualTime + ":00" : selectedTime;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientName.trim() || !serviceId || !finalTime) return;

    setSaving(true);
    const result = await createWalkIn({
      patientName: patientName.trim(),
      serviceId,
      scheduledTime: finalTime,
      scheduledDate: finalDate || undefined,
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
    patientName.trim() && serviceId && finalTime && !saving;

  // Format recap label
  function recapLabel(): string {
    const time = finalTime.slice(0, 5);
    if (manualMode) {
      if (finalDate === todayStr) return `${walkInT.today}, ${time}`;
      return `${finalDate}, ${time}`;
    }
    return time;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Slot Picker */}
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
                        onClick={() => selectSlot(slot.slot_start)}
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
                onChange={(e) => handleManualDateChange(e.target.value)}
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
                onChange={(e) => handleManualTimeChange(e.target.value)}
                className="min-h-[44px]"
              />
            </div>
          </div>
        )}

        {/* Toggle manual mode */}
        <button
          type="button"
          onClick={toggleManualMode}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Pencil className="size-3" />
          {manualMode ? walkInT.backToSlots : walkInT.customTime}
        </button>
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
      {finalTime && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
          <Clock className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
            {walkInT.selectedSlot}: {recapLabel()}
            {!manualMode && finalTime === currentSlot && (
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
