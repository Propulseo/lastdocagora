"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTemplateForm } from "../_hooks/useTemplateForm";
import { TemplateContentEditor } from "./TemplateContentEditor";
import type { Tables } from "@/lib/supabase/types";

type MessageTemplate = Tables<"message_templates">;

const CHANNELS = ["sms", "email", "whatsapp"] as const;
const TIMING_KEYS = ["j-2", "j-1", "h-24", "h-2", "h-1", "apres"] as const;

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professionalId: string;
  professionalUserId: string;
  editTemplate?: MessageTemplate | null;
  onSaved: (template: MessageTemplate) => void;
}

export function TemplateFormDialog({
  open,
  onOpenChange,
  professionalId,
  professionalUserId,
  editTemplate,
  onSaved,
}: TemplateFormDialogProps) {
  const formKey = `${editTemplate?.id ?? "new"}-${String(open)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <TemplateForm
          key={formKey}
          professionalId={professionalId}
          professionalUserId={professionalUserId}
          editTemplate={editTemplate}
          onOpenChange={onOpenChange}
          onSaved={onSaved}
        />
      )}
    </Dialog>
  );
}

function TemplateForm({
  professionalId,
  professionalUserId,
  editTemplate,
  onOpenChange,
  onSaved,
}: Omit<TemplateFormDialogProps, "open">) {
  const form = useTemplateForm({
    professionalId,
    professionalUserId,
    editTemplate,
    onOpenChange,
    onSaved,
  });

  return (
    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {editTemplate
            ? form.t.reminders.templates.dialog.editTitle
            : form.t.reminders.templates.dialog.newTitle}
        </DialogTitle>
        <DialogDescription>
          {editTemplate
            ? form.t.reminders.templates.dialog.editTitle
            : form.t.reminders.templates.dialog.newTitle}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        {/* Name */}
        <div className="grid gap-2">
          <Label>{form.t.reminders.templates.name}</Label>
          <Input
            value={form.name}
            onChange={(e) => form.setName(e.target.value)}
            placeholder={form.t.reminders.templates.dialog.namePlaceholder}
          />
        </div>

        {/* Channel + Timing row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>{form.t.reminders.templates.channel}</Label>
            <Select value={form.channel} onValueChange={form.setChannel}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS.map((ch) => (
                  <SelectItem key={ch} value={ch}>
                    {form.t.reminders.templates.dialog[
                      `channel${ch.charAt(0).toUpperCase() + ch.slice(1)}` as keyof typeof form.t.reminders.templates.dialog
                    ] ?? ch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>{form.t.reminders.templates.timing}</Label>
            <Select value={form.timingKey} onValueChange={form.setTimingKey}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMING_KEYS.map((tk) => (
                  <SelectItem key={tk} value={tk}>
                    {form.t.reminders.templates.timingLabels[
                      tk as keyof typeof form.t.reminders.templates.timingLabels
                    ] ?? tk}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Subject (email only) */}
        {form.isEmail && (
          <div className="grid gap-2">
            <Label>{form.t.reminders.templates.subject}</Label>
            <Input
              value={form.subject}
              onChange={(e) => form.setSubject(e.target.value)}
              placeholder={form.t.reminders.templates.dialog.subjectPlaceholder}
            />
          </div>
        )}

        <TemplateContentEditor
          body={form.body}
          onBodyChange={form.setBody}
          subject={form.subject}
          isEmail={form.isEmail}
          isSms={form.isSms}
          smsLength={form.smsLength}
          smsOverLimit={form.smsOverLimit}
          onInsertVariable={form.insertVariable}
          t={form.t}
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {form.t.common.cancel}
        </Button>
        <Button onClick={form.handleSave} disabled={form.saving || !form.canSave}>
          {form.saving
            ? form.t.common.saving
            : editTemplate
              ? form.t.reminders.templates.dialog.save
              : form.t.reminders.templates.dialog.create}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
