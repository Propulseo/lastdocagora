"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Plus } from "lucide-react";
import { useMemo } from "react";
import { useReminders } from "../_hooks/useReminders";
import { RemindersKpiStrip } from "./RemindersKpiStrip";
import { RulesCard } from "./RulesCard";
import { NotificationTrendsChart } from "./NotificationTrendsChart";
import { ChannelDistributionChart } from "./ChannelDistributionChart";
import { DeliveryStatusChart } from "./DeliveryStatusChart";
import { HistoryTab } from "./HistoryTab";
import { SettingsTab } from "./SettingsTab";
import { NewReminderDialog } from "./NewReminderDialog";
import { TemplatesTab } from "./TemplatesTab";
import type { RemindersClientProps } from "../_types/reminders";

export function RemindersClient({
  professionalId,
  professionalUserId,
  initialRules,
  initialTemplates,
  initialNotifications,
  initialSettings,
  kpiData,
  chartsData,
}: RemindersClientProps) {
  const {
    t,
    rules,
    notifications,
    settings,
    deliverabilityRate,
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
  } = useReminders({
    professionalUserId,
    initialRules,
    initialNotifications,
    initialSettings,
    kpiData,
  });

  const liveKpiData = useMemo(
    () => ({
      ...kpiData,
      activeRulesCount: rules.filter((r) => r.is_enabled).length,
      totalRulesCount: rules.length,
    }),
    [kpiData, rules],
  );

  return (
    <TooltipProvider>
      <Tabs defaultValue="reminders" className="space-y-5">
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="reminders" className="min-h-[44px]">{t.reminders.tabs.reminders}</TabsTrigger>
          <TabsTrigger value="templates" className="min-h-[44px]">{t.reminders.tabs.templates}</TabsTrigger>
          <TabsTrigger value="history" className="min-h-[44px]">{t.reminders.tabs.history}</TabsTrigger>
          <TabsTrigger value="settings" className="min-h-[44px]">{t.reminders.tabs.settings}</TabsTrigger>
        </TabsList>

        {/* Reminders tab */}
        <TabsContent value="reminders" className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">{t.reminders.auto.title}</h2>
              <p className="text-muted-foreground text-sm">
                {t.reminders.auto.subtitle}
              </p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
              <Plus className="size-4" />
              {t.reminders.auto.ctaNew}
            </Button>
          </div>

          <RemindersKpiStrip
            kpiData={liveKpiData}
            deliverabilityRate={deliverabilityRate}
            t={t}
          />

          {/* Charts row */}
          <div className="grid gap-5 lg:grid-cols-2">
            <NotificationTrendsChart data={chartsData.trends} />
            <ChannelDistributionChart data={chartsData.channelBreakdown} />
          </div>

          {/* Full-width status chart */}
          <DeliveryStatusChart data={chartsData.statusBreakdown} />

          <RulesCard
            rules={rules}
            onNewRule={() => setDialogOpen(true)}
            onEditRule={openEditDialog}
            onToggleRule={handleRuleToggle}
            t={t}
          />
        </TabsContent>

        {/* Templates tab */}
        <TabsContent value="templates" className="space-y-5">
          <TemplatesTab
            professionalId={professionalId}
            professionalUserId={professionalUserId}
            initialTemplates={initialTemplates}
          />
        </TabsContent>

        {/* History tab */}
        <TabsContent value="history" className="space-y-5">
          <HistoryTab notifications={notifications} t={t} />
        </TabsContent>

        {/* Settings tab */}
        <TabsContent value="settings" className="space-y-5">
          <SettingsTab
            settings={settings}
            onSettingChange={handleSettingChange}
            t={t}
          />
        </TabsContent>
      </Tabs>

      <NewReminderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        professionalId={professionalId}
        professionalUserId={professionalUserId}
        templates={initialTemplates}
        onSaved={handleRuleCreated}
      />

      <NewReminderDialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeEditDialog();
        }}
        professionalId={professionalId}
        professionalUserId={professionalUserId}
        templates={initialTemplates}
        editRule={editingRule}
        onSaved={handleRuleUpdated}
        onDeleted={handleRuleDeleted}
      />
    </TooltipProvider>
  );
}
