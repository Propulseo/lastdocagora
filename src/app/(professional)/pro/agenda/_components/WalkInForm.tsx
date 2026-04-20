"use client";

import { useEffect, useMemo, useState } from "react";
import { ResponsiveDialogFooter } from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import { UserPlus, Loader2, Zap, Clock } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  createWalkIn,
  getWalkInSlots,
  type SlotInfo,
} from "@/app/(professional)/_actions/walkins";
import { format } from "date-fns";
import { WalkInSlotPicker } from "./WalkInSlotPicker";
import { WalkInPatientFields } from "./WalkInPatientFields";
import type { WalkInCreatedData } from "./WalkInDialog";

interface WalkInFormProps {
  walkInT: Record<string, string>;
  professionalId: string;
  preselectedTime?: string;
  onOpenChange: (open: boolean) => void;
  onCreated: (data: WalkInCreatedData) => void;
}

export function WalkInForm({
  walkInT,
  professionalId,
  preselectedTime,
  onOpenChange,
  onCreated,
}: WalkInFormProps) {
  const supabase = useMemo(() => createClient(), []);

  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [patientName, setPatientName] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [todaySlots, setTodaySlots] = useState<SlotInfo[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState(preselectedTime ?? "");
  const [currentSlot, setCurrentSlot] = useState<string | null>(null);

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
        setSelectedDate(manualDate);
        setSelectedTime(manualTime + ":00");
      } else {
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
      onCreated({
        appointmentId: result.appointmentId,
        patientId: result.patientId,
        patientName: patientName.trim(),
      });
    } else {
      toast.error(walkInT.error);
    }
  }

  const canSubmit =
    patientName.trim() && serviceId && finalTime && !saving;

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
      <WalkInSlotPicker
        walkInT={walkInT}
        todayStr={todayStr}
        todaySlots={todaySlots}
        loadingSlots={loadingSlots}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        currentSlot={currentSlot}
        manualMode={manualMode}
        manualDate={manualDate}
        manualTime={manualTime}
        onSelectSlot={selectSlot}
        onToggleManualMode={toggleManualMode}
        onManualDateChange={handleManualDateChange}
        onManualTimeChange={handleManualTimeChange}
      />

      <WalkInPatientFields
        walkInT={walkInT}
        services={services}
        patientName={patientName}
        serviceId={serviceId}
        phone={phone}
        email={email}
        notes={notes}
        onPatientNameChange={setPatientName}
        onServiceIdChange={setServiceId}
        onPhoneChange={setPhone}
        onEmailChange={setEmail}
        onNotesChange={setNotes}
      />

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
