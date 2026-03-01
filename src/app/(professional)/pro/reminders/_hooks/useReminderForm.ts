import { useState, useMemo } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useProfessionalI18n } from "@/lib/i18n/pro";

type ReminderRule = {
  id: string;
  professional_id: string;
  professional_user_id: string;
  type: string;
  channel: string;
  trigger_moment: string;
  delay_value: number;
  delay_unit: string;
  template_id: string | null;
  is_enabled: boolean;
  only_if_not_confirmed: boolean;
  exclude_weekends: boolean;
  created_at: string;
  updated_at: string;
  message_templates: { name: string; content: string; channel: string } | null;
};

interface UseReminderFormParams {
  professionalId: string;
  professionalUserId: string;
  templates: Array<{ id: string; name: string; channel: string }>;
  editRule?: ReminderRule | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (rule: ReminderRule) => void;
  onDeleted?: (ruleId: string) => void;
}

export type { ReminderRule };

export function useReminderForm({
  professionalId,
  professionalUserId,
  templates,
  editRule,
  onOpenChange,
  onSaved,
  onDeleted,
}: UseReminderFormParams) {
  const { t } = useProfessionalI18n();

  const [type, setType] = useState(editRule?.type ?? "appointment_reminder");
  const [channel, setChannel] = useState(editRule?.channel ?? "email");
  const [triggerMoment, setTriggerMoment] = useState(
    editRule?.trigger_moment ?? "before",
  );
  const [delayValue, setDelayValue] = useState(editRule?.delay_value ?? 24);
  const [delayUnit, setDelayUnit] = useState(editRule?.delay_unit ?? "hours");
  const [templateId, setTemplateId] = useState<string | null>(
    editRule?.template_id ?? null,
  );
  const [onlyIfNotConfirmed, setOnlyIfNotConfirmed] = useState(
    editRule?.only_if_not_confirmed ?? false,
  );
  const [excludeWeekends, setExcludeWeekends] = useState(
    editRule?.exclude_weekends ?? false,
  );
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const filteredTemplates = useMemo(
    () => templates.filter((tpl) => tpl.channel === channel),
    [templates, channel],
  );

  const effectiveTemplateId = useMemo(() => {
    if (!templateId) return null;
    return filteredTemplates.some((tpl) => tpl.id === templateId)
      ? templateId
      : null;
  }, [templateId, filteredTemplates]);

  function handleChannelChange(v: string) {
    setChannel(v);
    if (templateId) {
      const stillValid = templates.some(
        (tpl) => tpl.id === templateId && tpl.channel === v,
      );
      if (!stillValid) setTemplateId(null);
    }
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const payload = {
      professional_id: professionalId,
      professional_user_id: professionalUserId,
      type,
      channel,
      trigger_moment: triggerMoment,
      delay_value: triggerMoment === "immediate" ? 0 : delayValue,
      delay_unit: triggerMoment === "immediate" ? "hours" : delayUnit,
      template_id: effectiveTemplateId,
      only_if_not_confirmed: onlyIfNotConfirmed,
      exclude_weekends: excludeWeekends,
      is_enabled: editRule?.is_enabled ?? true,
    };

    if (editRule) {
      const { data, error } = await supabase
        .from("reminder_rules")
        .update(payload)
        .eq("id", editRule.id)
        .select("*, message_templates(name, content, channel)")
        .single();
      if (error) {
        toast.error(t.reminders.toast.error);
      } else {
        toast.success(t.reminders.toast.ruleUpdated);
        onSaved(data as ReminderRule);
        onOpenChange(false);
      }
    } else {
      const { data, error } = await supabase
        .from("reminder_rules")
        .insert(payload)
        .select("*, message_templates(name, content, channel)")
        .single();
      if (error) {
        toast.error(t.reminders.toast.error);
      } else {
        toast.success(t.reminders.toast.ruleCreated);
        onSaved(data as ReminderRule);
        onOpenChange(false);
      }
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!editRule) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("reminder_rules")
      .delete()
      .eq("id", editRule.id);
    if (error) {
      toast.error(t.reminders.toast.error);
    } else {
      toast.success(t.reminders.toast.ruleDeleted);
      onDeleted?.(editRule.id);
      onOpenChange(false);
    }
  }

  return {
    t,
    type,
    setType,
    channel,
    handleChannelChange,
    triggerMoment,
    setTriggerMoment,
    delayValue,
    setDelayValue,
    delayUnit,
    setDelayUnit,
    effectiveTemplateId,
    setTemplateId,
    filteredTemplates,
    onlyIfNotConfirmed,
    setOnlyIfNotConfirmed,
    excludeWeekends,
    setExcludeWeekends,
    saving,
    showDeleteConfirm,
    setShowDeleteConfirm,
    handleSave,
    handleDelete,
  };
}
