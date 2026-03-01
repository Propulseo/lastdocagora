import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import type { TablesInsert } from "@/lib/supabase/types";
import type {
  ReminderRule,
  NotificationLog,
  ProfessionalSettings,
} from "../_types/reminders";

interface UseRemindersParams {
  professionalUserId: string;
  initialRules: ReminderRule[];
  initialNotifications: NotificationLog[];
  initialSettings: ProfessionalSettings | null;
  kpiData: {
    sentThisMonth: number;
    totalWithStatus: number;
    deliveredCount: number;
  };
}

export function useReminders({
  professionalUserId,
  initialRules,
  initialNotifications,
  initialSettings,
  kpiData,
}: UseRemindersParams) {
  const { t } = useProfessionalI18n();

  const [rules, setRules] = useState<ReminderRule[]>(initialRules);
  const [notifications] = useState<NotificationLog[]>(initialNotifications);
  const [settings, setSettings] = useState<ProfessionalSettings | null>(
    initialSettings,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ReminderRule | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const deliverabilityRate = useMemo(() => {
    if (kpiData.totalWithStatus > 0) {
      return (
        Math.round(
          (kpiData.deliveredCount / kpiData.totalWithStatus) * 100,
        ) + "%"
      );
    }
    return "\u2014";
  }, [kpiData]);

  const handleRuleToggle = useCallback(
    async (ruleId: string, is_enabled: boolean) => {
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, is_enabled } : r)),
      );

      const supabase = createClient();
      const { error } = await supabase
        .from("reminder_rules")
        .update({ is_enabled })
        .eq("id", ruleId);

      if (error) {
        setRules((prev) =>
          prev.map((r) =>
            r.id === ruleId ? { ...r, is_enabled: !is_enabled } : r,
          ),
        );
        toast.error(t.reminders.toast.error);
      } else {
        toast.success(t.reminders.toast.ruleToggled);
      }
    },
    [t],
  );

  const handleSettingChange = useCallback(
    async (key: string, value: boolean) => {
      setSettings((prev) => (prev ? { ...prev, [key]: value } : null));

      const supabase = createClient();
      const { error } = await supabase
        .from("professional_settings")
        .upsert(
          { user_id: professionalUserId, [key]: value } as TablesInsert<"professional_settings">,
          { onConflict: "user_id" },
        );

      if (error) {
        toast.error(t.reminders.toast.error);
        setSettings((prev) => (prev ? { ...prev, [key]: !value } : null));
      } else {
        toast.success(t.reminders.settings.saved);
      }
    },
    [professionalUserId, t],
  );

  const handleRuleCreated = useCallback((newRule: ReminderRule) => {
    setRules((prev) => [newRule, ...prev]);
  }, []);

  const handleRuleUpdated = useCallback((updatedRule: ReminderRule) => {
    setRules((prev) =>
      prev.map((r) => (r.id === updatedRule.id ? updatedRule : r)),
    );
  }, []);

  const handleRuleDeleted = useCallback((ruleId: string) => {
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
  }, []);

  const openEditDialog = useCallback((rule: ReminderRule) => {
    setEditingRule(rule);
    setEditDialogOpen(true);
  }, []);

  const closeEditDialog = useCallback(() => {
    setEditDialogOpen(false);
    setEditingRule(null);
  }, []);

  return {
    t,
    rules,
    notifications,
    settings,
    deliverabilityRate,
    kpiData,
    dialogOpen,
    setDialogOpen,
    editingRule,
    editDialogOpen,
    openEditDialog,
    closeEditDialog,
    handleRuleToggle,
    handleSettingChange,
    handleRuleCreated,
    handleRuleUpdated,
    handleRuleDeleted,
  };
}
