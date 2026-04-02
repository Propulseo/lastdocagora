"use client";

import { useState, useTransition } from "react";
import { ClipboardEdit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { requestFieldChange } from "@/app/_actions/profile-change-request";

interface ApprovalFieldProps {
  label: string;
  value: string | null | undefined;
  fallbackLabel: string;
  fieldName: string;
  professionalId: string;
}

export function ApprovalField({ label, value, fallbackLabel, fieldName, professionalId }: ApprovalFieldProps) {
  const { t } = useProfessionalI18n();
  const [open, setOpen] = useState(false);
  const [requestedValue, setRequestedValue] = useState("");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!requestedValue.trim()) return;

    startTransition(async () => {
      const result = await requestFieldChange({
        professionalId,
        fieldName,
        currentValue: value ?? "",
        requestedValue: requestedValue.trim(),
        reason: reason.trim() || undefined,
      });

      if (result.success) {
        toast.success(t.profile.requestSuccess);
        setOpen(false);
        setRequestedValue("");
        setReason("");
      } else {
        toast.error(t.profile.requestError);
      }
    });
  }

  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-right text-sm font-medium">{value || fallbackLabel}</span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 shrink-0">
              <ClipboardEdit className="size-3.5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t.profile.requestChangeTitle}</DialogTitle>
              <DialogDescription>{t.profile.requestChangeDescription}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">{t.profile.currentValue}</Label>
                <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                  {value || fallbackLabel}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t.profile.requestedValue}</Label>
                <Textarea
                  value={requestedValue}
                  onChange={(e) => setRequestedValue(e.target.value)}
                  placeholder={t.profile.requestedValuePlaceholder}
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-muted-foreground">{t.profile.requestReason}</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t.profile.requestReasonPlaceholder}
                  rows={2}
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={isPending || !requestedValue.trim()}
                className="w-full"
              >
                {isPending ? (
                  <><Loader2 className="size-4 animate-spin" />{t.profile.requestSubmit}</>
                ) : (
                  t.profile.requestSubmit
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
