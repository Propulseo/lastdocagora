"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useProfessionalI18n } from "@/lib/i18n/pro";

const REASON_KEYS = [
  "schedule_conflict",
  "outside_scope",
  "patient_unknown",
  "other",
] as const;

type ReasonKey = (typeof REASON_KEYS)[number];

interface RejectAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, notifyPatient: boolean) => void;
  isUpdating: boolean;
}

export function RejectAppointmentDialog({
  open,
  onOpenChange,
  onConfirm,
  isUpdating,
}: RejectAppointmentDialogProps) {
  const { t } = useProfessionalI18n();
  const [reasonKey, setReasonKey] = useState<ReasonKey | "">("");
  const [otherText, setOtherText] = useState("");
  const [notifyPatient, setNotifyPatient] = useState(false);

  const reasons = t.agenda.rejection.reasons;

  function reset() {
    setReasonKey("");
    setOtherText("");
    setNotifyPatient(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }

  function handleConfirm() {
    if (!reasonKey) return;
    const reason =
      reasonKey === "other"
        ? otherText.trim() || reasonKey
        : reasonKey;
    onConfirm(reason, notifyPatient);
  }

  const canConfirm = reasonKey !== "" && !isUpdating;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.agenda.rejection.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.agenda.rejection.description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Reason select */}
          <div className="space-y-2">
            <Label>{t.agenda.rejection.reason}</Label>
            <Select
              value={reasonKey}
              onValueChange={(v) => setReasonKey(v as ReasonKey)}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t.agenda.rejection.reasonPlaceholder}
                />
              </SelectTrigger>
              <SelectContent>
                {REASON_KEYS.map((key) => (
                  <SelectItem key={key} value={key}>
                    {reasons[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Free text for "other" */}
          {reasonKey === "other" && (
            <div className="space-y-2">
              <Label>{t.agenda.rejection.otherReason}</Label>
              <Textarea
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder={t.agenda.rejection.otherReasonPlaceholder}
                rows={2}
              />
            </div>
          )}

          {/* Notify patient */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="notify-patient-reject"
              checked={notifyPatient}
              onCheckedChange={(checked) =>
                setNotifyPatient(checked === true)
              }
            />
            <Label htmlFor="notify-patient-reject" className="cursor-pointer">
              {t.agenda.rejection.notifyPatient}
            </Label>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            {t.agenda.rejection.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
