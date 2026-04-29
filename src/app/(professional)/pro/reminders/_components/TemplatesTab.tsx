"use client";

import { useProfessionalI18n } from "@/lib/i18n/pro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Plus, Search, Mail } from "lucide-react";
import { TemplateCard } from "./TemplateCard";
import { TemplateFormDialog } from "./TemplateFormDialog";
import { useTemplatesTab } from "../_hooks/useTemplatesTab";
import type { Tables } from "@/lib/supabase/types";

type MessageTemplate = Tables<"message_templates">;

const CHANNELS = ["sms", "email", "whatsapp"] as const;
const TIMING_KEYS = ["j-2", "j-1", "h-24", "h-2", "h-1", "apres"] as const;

interface TemplatesTabProps {
  professionalId: string;
  professionalUserId: string;
  initialTemplates: MessageTemplate[];
}

export function TemplatesTab({
  professionalId,
  professionalUserId,
  initialTemplates,
}: TemplatesTabProps) {
  const { t } = useProfessionalI18n();
  const {
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
  } = useTemplatesTab(initialTemplates);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {t.reminders.templates.title}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t.reminders.templates.subtitle}
          </p>
        </div>
        <Button onClick={handleNewTemplate} className="gap-1.5 w-full sm:w-auto">
          <Plus className="size-4" />
          {t.reminders.templates.newTemplate}
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.reminders.templates.search}
            className="pl-9"
          />
        </div>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue
              placeholder={t.reminders.templates.filterChannel}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t.reminders.templates.allChannels}
            </SelectItem>
            {CHANNELS.map((ch) => (
              <SelectItem key={ch} value={ch}>
                {ch.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={timingFilter} onValueChange={setTimingFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue
              placeholder={t.reminders.templates.filterTiming}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t.reminders.templates.allTimings}
            </SelectItem>
            {TIMING_KEYS.map((tk) => (
              <SelectItem key={tk} value={tk}>
                {t.reminders.templates.timingLabels[
                  tk as keyof typeof t.reminders.templates.timingLabels
                ] ?? tk}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Switch
            id="active-only"
            checked={activeOnly}
            onCheckedChange={setActiveOnly}
          />
          <Label
            htmlFor="active-only"
            className="text-sm cursor-pointer whitespace-nowrap"
          >
            {t.reminders.templates.activeOnly}
          </Label>
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Mail}
              title={t.reminders.templates.empty.title}
              description={t.reminders.templates.empty.description}
              action={
                <Button
                  variant="outline"
                  onClick={handleNewTemplate}
                  className="gap-1.5"
                >
                  <Plus className="size-4" />
                  {t.reminders.templates.newTemplate}
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              template={tpl}
              professionalId={professionalId}
              professionalUserId={professionalUserId}
              onEdit={handleEdit}
              onDuplicated={handleDuplicated}
              onDeleted={handleDeleted}
              onToggled={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Form dialog */}
      <TemplateFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        professionalId={professionalId}
        professionalUserId={professionalUserId}
        editTemplate={editingTemplate}
        onSaved={handleSaved}
      />
    </div>
  );
}
