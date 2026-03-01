"use client";

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import type { Tables } from "@/lib/supabase/types";

type MessageTemplate = Tables<"message_templates">;

export function useTemplatesTab(initialTemplates: MessageTemplate[]) {
  const { t } = useProfessionalI18n();

  const [templates, setTemplates] =
    useState<MessageTemplate[]>(initialTemplates);
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [timingFilter, setTimingFilter] = useState<string>("all");
  const [activeOnly, setActiveOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<MessageTemplate | null>(null);

  const filtered = useMemo(() => {
    let result = templates;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (tpl) =>
          tpl.name.toLowerCase().includes(q) ||
          tpl.content.toLowerCase().includes(q),
      );
    }

    if (channelFilter !== "all") {
      result = result.filter((tpl) => tpl.channel === channelFilter);
    }

    if (timingFilter !== "all") {
      result = result.filter((tpl) => tpl.timing_key === timingFilter);
    }

    if (activeOnly) {
      result = result.filter((tpl) => tpl.is_active);
    }

    return result.sort((a, b) => {
      if (a.is_global !== b.is_global) return a.is_global ? 1 : -1;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [templates, search, channelFilter, timingFilter, activeOnly]);

  const handleToggle = useCallback(
    async (templateId: string, isActive: boolean) => {
      setTemplates((prev) =>
        prev.map((tpl) =>
          tpl.id === templateId ? { ...tpl, is_active: isActive } : tpl,
        ),
      );

      const supabase = createClient();
      const { error } = await supabase
        .from("message_templates")
        .update({ is_active: isActive })
        .eq("id", templateId);

      if (error) {
        setTemplates((prev) =>
          prev.map((tpl) =>
            tpl.id === templateId ? { ...tpl, is_active: !isActive } : tpl,
          ),
        );
        toast.error(t.reminders.toast.error);
      } else {
        toast.success(
          isActive
            ? t.reminders.templates.toggledActive
            : t.reminders.templates.toggledInactive,
        );
      }
    },
    [t],
  );

  const handleSaved = useCallback((template: MessageTemplate) => {
    setTemplates((prev) => {
      const exists = prev.some((tpl) => tpl.id === template.id);
      if (exists) {
        return prev.map((tpl) => (tpl.id === template.id ? template : tpl));
      }
      return [template, ...prev];
    });
  }, []);

  const handleDuplicated = useCallback((template: MessageTemplate) => {
    setTemplates((prev) => [template, ...prev]);
    setEditingTemplate(template);
    setDialogOpen(true);
  }, []);

  const handleDeleted = useCallback((templateId: string) => {
    setTemplates((prev) => prev.filter((tpl) => tpl.id !== templateId));
  }, []);

  const handleEdit = useCallback((template: MessageTemplate) => {
    setEditingTemplate(template);
    setDialogOpen(true);
  }, []);

  const handleNewTemplate = useCallback(() => {
    setEditingTemplate(null);
    setDialogOpen(true);
  }, []);

  const handleDialogChange = useCallback((open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingTemplate(null);
  }, []);

  return {
    filtered,
    search,
    setSearch,
    channelFilter,
    setChannelFilter,
    timingFilter,
    setTimingFilter,
    activeOnly,
    setActiveOnly,
    dialogOpen,
    editingTemplate,
    handleToggle,
    handleSaved,
    handleDuplicated,
    handleDeleted,
    handleEdit,
    handleNewTemplate,
    handleDialogChange,
  };
}
