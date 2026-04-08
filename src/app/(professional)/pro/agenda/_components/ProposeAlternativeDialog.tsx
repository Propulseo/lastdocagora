"use client";

import { useState } from "react";
import { format } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { RADIUS } from "@/lib/design-tokens";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { START_HOUR, END_HOUR } from "../_lib/agenda-constants";

/** Generate time slots from START_HOUR to END_HOUR in 30-min intervals */
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`);
    slots.push(`${String(h).padStart(2, "0")}:30`);
  }
  slots.push(`${String(END_HOUR).padStart(2, "0")}:00`);
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

interface ProposeAlternativeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (date: string, time: string, message: string) => void;
  isUpdating: boolean;
}

export function ProposeAlternativeDialog({
  open,
  onOpenChange,
  onConfirm,
  isUpdating,
}: ProposeAlternativeDialogProps) {
  const { t } = useProfessionalI18n();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  function reset() {
    setDate(undefined);
    setTime("");
    setMessage("");
    setCalendarOpen(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }

  function handleConfirm() {
    if (!date || !time) return;
    onConfirm(format(date, "yyyy-MM-dd"), time, message.trim());
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const canConfirm = !!date && !!time && !isUpdating;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className={RADIUS.card}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.agenda.propose.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.agenda.propose.description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Date picker */}
          <div className="space-y-2">
            <Label>{t.agenda.propose.date}</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy") : t.agenda.propose.datePlaceholder}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    setCalendarOpen(false);
                  }}
                  disabled={(d) => d < today}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time picker */}
          <div className="space-y-2">
            <Label>{t.agenda.propose.time}</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t.agenda.propose.timePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Optional message */}
          <div className="space-y-2">
            <Label>{t.agenda.propose.message}</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.agenda.propose.messagePlaceholder}
              rows={2}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            {t.agenda.propose.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
