"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useProfessionalI18n } from "@/lib/i18n/pro";

interface PostConsultationModalProps {
  appointmentId: string;
  patientId: string;
  patientName: string;
  professionalId: string;
  open: boolean;
  onClose: () => void;
}

export function PostConsultationModal({
  appointmentId,
  patientId,
  patientName,
  open,
  onClose,
}: PostConsultationModalProps) {
  const { t } = useProfessionalI18n();
  const pc = t.today.postConsultation;

  const [notes, setNotes] = useState("");
  const [followUpEnabled, setFollowUpEnabled] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load existing consultation notes on mount
  useEffect(() => {
    if (!open || !appointmentId) return;

    let cancelled = false;

    async function loadNotes() {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data } = await (supabase.from as unknown as (table: string) => ReturnType<typeof supabase.from>)("consultation_notes")
          .select("content, follow_up_needed, follow_up_suggested_date")
          .eq("appointment_id", appointmentId)
          .maybeSingle() as unknown as { data: { content: string | null; follow_up_needed: boolean; follow_up_suggested_date: string | null } | null };

        if (!cancelled && data) {
          setNotes(data.content ?? "");
          if (data.follow_up_needed) {
            setFollowUpEnabled(true);
            setFollowUpDate(data.follow_up_suggested_date ?? "");
          }
        }
      } catch {
        // Silently ignore load errors
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadNotes();
    return () => {
      cancelled = true;
    };
  }, [open, appointmentId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setNotes("");
      setFollowUpEnabled(false);
      setFollowUpDate("");
      setSaving(false);
      setLoading(false);
    }
  }, [open]);

  const fireReviewRequest = useCallback(() => {
    try {
      fetch("/api/reviews/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_id: appointmentId }),
      }).catch(() => {
        // Fire-and-forget — ignore errors
      });
    } catch {
      // Fire-and-forget
    }
  }, [appointmentId]);

  async function handleSave() {
    setSaving(true);
    try {
      const supabase = createClient();
      const now = new Date().toISOString();
      const { data: pro } = await supabase.from("professionals").select("id").single();
      if (!pro) { toast.error(pc.saveError); setSaving(false); return; }

      const followUpDateVal = followUpEnabled && followUpDate ? followUpDate : null;
      const notePayload: Record<string, unknown> = {
        appointment_id: appointmentId, professional_id: pro.id, patient_id: patientId,
        content: notes.trim(), follow_up_needed: followUpEnabled,
        follow_up_suggested_date: followUpDateVal, updated_at: now,
      };

      const fromNotes = (supabase.from as unknown as (table: string) => ReturnType<typeof supabase.from>);
      const { data: existingNote } = await fromNotes("consultation_notes")
        .select("id").eq("appointment_id", appointmentId)
        .maybeSingle() as unknown as { data: { id: string } | null };

      const updateData = { content: notes.trim(), follow_up_needed: followUpEnabled, follow_up_suggested_date: followUpDateVal, updated_at: now } as never;
      const { error } = existingNote
        ? await fromNotes("consultation_notes").update(updateData).eq("id", existingNote.id)
        : await fromNotes("consultation_notes").insert(notePayload as never);

      if (error) { toast.error(pc.saveError); setSaving(false); return; }
      toast.success(pc.saveSuccess);
      fireReviewRequest();
      onClose();
    } catch {
      toast.error(pc.saveError);
    } finally {
      setSaving(false);
    }
  }

  function handleIgnore() { fireReviewRequest(); onClose(); }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleIgnore()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{pc.title}</DialogTitle>
          <DialogDescription>{patientName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={pc.placeholder}
                className="min-h-[120px] resize-y"
                autoFocus
              />

              <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <Label
                  htmlFor="follow-up-switch"
                  className={cn(
                    "text-sm font-medium cursor-pointer select-none",
                    followUpEnabled
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {pc.followUpLabel}
                </Label>
                <Switch
                  id="follow-up-switch"
                  checked={followUpEnabled}
                  onCheckedChange={setFollowUpEnabled}
                />
              </div>

              {followUpEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="follow-up-date" className="text-sm">
                    {pc.followUpDateLabel}
                  </Label>
                  <input
                    id="follow-up-date"
                    type="date"
                    min={minDate}
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                      "ring-offset-background placeholder:text-muted-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={handleIgnore}
            disabled={saving}
            className="min-h-[44px]"
          >
            {pc.ignore}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="min-h-[44px]"
          >
            {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
            {pc.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
