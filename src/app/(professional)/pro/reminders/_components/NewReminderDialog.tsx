"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/shared/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useReminderForm } from "../_hooks/useReminderForm";
import { ReminderFormFields } from "./ReminderFormFields";
import type { ReminderRule } from "../_hooks/useReminderForm";

interface NewReminderDialogProps {
  professionalId: string;
  professionalUserId: string;
  templates: Array<{ id: string; name: string; channel: string }>;
  editRule?: ReminderRule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (rule: ReminderRule) => void;
  onDeleted?: (ruleId: string) => void;
}

function ReminderForm({
  professionalId,
  professionalUserId,
  templates,
  editRule,
  onOpenChange,
  onSaved,
  onDeleted,
}: Omit<NewReminderDialogProps, "open">) {
  const form = useReminderForm({
    professionalId,
    professionalUserId,
    templates,
    editRule,
    onOpenChange,
    onSaved,
    onDeleted,
  });

  return (
    <ResponsiveDialogContent className="sm:max-w-md">
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>
          {editRule
            ? form.t.reminders.dialog.editTitle
            : form.t.reminders.dialog.newTitle}
        </ResponsiveDialogTitle>
        <ResponsiveDialogDescription>
          {editRule
            ? form.t.reminders.dialog.editTitle
            : form.t.reminders.dialog.newTitle}
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>

      <ReminderFormFields
        type={form.type}
        onTypeChange={form.setType}
        channel={form.channel}
        onChannelChange={form.handleChannelChange}
        triggerMoment={form.triggerMoment}
        onTriggerChange={form.setTriggerMoment}
        delayValue={form.delayValue}
        onDelayValueChange={form.setDelayValue}
        delayUnit={form.delayUnit}
        onDelayUnitChange={form.setDelayUnit}
        effectiveTemplateId={form.effectiveTemplateId}
        onTemplateChange={form.setTemplateId}
        filteredTemplates={form.filteredTemplates}
        onlyIfNotConfirmed={form.onlyIfNotConfirmed}
        onOnlyIfNotConfirmedChange={form.setOnlyIfNotConfirmed}
        excludeWeekends={form.excludeWeekends}
        onExcludeWeekendsChange={form.setExcludeWeekends}
        t={form.t}
      />

      <ResponsiveDialogFooter
        className={editRule ? "sm:justify-between" : "sm:justify-end"}
      >
        {editRule && (
          <div className="flex items-center gap-2">
            {form.showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <div className="text-destructive text-sm">
                  <p className="font-medium">
                    {form.t.reminders.dialog.deleteConfirm}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {form.t.reminders.dialog.deleteDescription}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={form.handleDelete}
                >
                  {form.t.reminders.dialog.delete}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => form.setShowDeleteConfirm(false)}
                >
                  {form.t.common.cancel}
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => form.setShowDeleteConfirm(true)}
              >
                <Trash2 className="mr-1 size-4" />
                {form.t.reminders.dialog.delete}
              </Button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {!editRule && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {form.t.common.cancel}
            </Button>
          )}
          <Button onClick={form.handleSave} disabled={form.saving}>
            {form.saving
              ? form.t.common.saving
              : editRule
                ? form.t.reminders.dialog.save
                : form.t.reminders.dialog.create}
          </Button>
        </div>
      </ResponsiveDialogFooter>
    </ResponsiveDialogContent>
  );
}

export function NewReminderDialog({
  open,
  onOpenChange,
  ...formProps
}: NewReminderDialogProps) {
  const formKey = `${formProps.editRule?.id ?? "new"}-${String(open)}`;

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <ReminderForm
          key={formKey}
          onOpenChange={onOpenChange}
          {...formProps}
        />
      )}
    </ResponsiveDialog>
  );
}
