import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import type { Tables } from "@/lib/supabase/types";

type MessageTemplate = Tables<"message_templates">;

interface UseTemplateFormParams {
  professionalId: string;
  professionalUserId: string;
  editTemplate?: MessageTemplate | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (template: MessageTemplate) => void;
}

export function useTemplateForm({
  professionalId,
  professionalUserId,
  editTemplate,
  onOpenChange,
  onSaved,
}: UseTemplateFormParams) {
  const { t, locale } = useProfessionalI18n();

  const [name, setName] = useState(editTemplate?.name ?? "");
  const [channel, setChannel] = useState(editTemplate?.channel ?? "sms");
  const [timingKey, setTimingKey] = useState(editTemplate?.timing_key ?? "j-1");
  const [subject, setSubject] = useState(editTemplate?.subject ?? "");
  const [body, setBody] = useState(editTemplate?.content ?? "");
  const [saving, setSaving] = useState(false);

  const isEmail = channel === "email";
  const isSms = channel === "sms";
  const smsLength = body.length;
  const smsOverLimit = isSms && smsLength > 160;

  const insertVariable = useCallback((varKey: string) => {
    setBody((prev) => prev + varKey);
  }, []);

  const canSave = name.trim() && body.trim() && (!isEmail || subject.trim());

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);

    const supabase = createClient();
    const payload = {
      professional_id: professionalId,
      professional_user_id: professionalUserId,
      name: name.trim(),
      type: editTemplate?.type ?? "custom",
      channel,
      timing_key: timingKey,
      subject: isEmail ? subject.trim() : null,
      content: body.trim(),
      is_active: editTemplate?.is_active ?? true,
      is_default: false,
      is_global: false,
      locale,
    };

    if (editTemplate && !editTemplate.is_global) {
      const { data, error } = await supabase
        .from("message_templates")
        .update(payload)
        .eq("id", editTemplate.id)
        .select("*")
        .single();

      if (error) {
        toast.error(t.reminders.toast.error);
      } else {
        toast.success(t.reminders.toast.templateUpdated);
        onSaved(data);
        onOpenChange(false);
      }
    } else {
      const { data, error } = await supabase
        .from("message_templates")
        .insert(payload)
        .select("*")
        .single();

      if (error) {
        toast.error(t.reminders.toast.error);
      } else {
        toast.success(t.reminders.toast.templateCreated);
        onSaved(data);
        onOpenChange(false);
      }
    }
    setSaving(false);
  };

  return {
    t,
    name,
    setName,
    channel,
    setChannel,
    timingKey,
    setTimingKey,
    subject,
    setSubject,
    body,
    setBody,
    saving,
    isEmail,
    isSms,
    smsLength,
    smsOverLimit,
    insertVariable,
    canSave,
    handleSave,
  };
}
