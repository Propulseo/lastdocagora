"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { useProfessionalI18n } from "@/lib/i18n/pro";

interface ReminderFormFieldsProps {
  type: string;
  onTypeChange: (v: string) => void;
  channel: string;
  onChannelChange: (v: string) => void;
  triggerMoment: string;
  onTriggerChange: (v: string) => void;
  delayValue: number;
  onDelayValueChange: (v: number) => void;
  delayUnit: string;
  onDelayUnitChange: (v: string) => void;
  effectiveTemplateId: string | null;
  onTemplateChange: (v: string | null) => void;
  filteredTemplates: Array<{ id: string; name: string }>;
  onlyIfNotConfirmed: boolean;
  onOnlyIfNotConfirmedChange: (v: boolean) => void;
  excludeWeekends: boolean;
  onExcludeWeekendsChange: (v: boolean) => void;
  t: ReturnType<typeof useProfessionalI18n>["t"];
}

export function ReminderFormFields({
  type,
  onTypeChange,
  channel,
  onChannelChange,
  triggerMoment,
  onTriggerChange,
  delayValue,
  onDelayValueChange,
  delayUnit,
  onDelayUnitChange,
  effectiveTemplateId,
  onTemplateChange,
  filteredTemplates,
  onlyIfNotConfirmed,
  onOnlyIfNotConfirmedChange,
  excludeWeekends,
  onExcludeWeekendsChange,
  t,
}: ReminderFormFieldsProps) {
  return (
    <div className="grid gap-4 py-4">
      {/* Type */}
      <div className="grid gap-2">
        <Label>{t.reminders.dialog.type}</Label>
        <Select value={type} onValueChange={onTypeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t.reminders.dialog.typePlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="appointment_confirmation">
              {t.reminders.rule.appointmentConfirmation}
            </SelectItem>
            <SelectItem value="appointment_reminder">
              {t.reminders.rule.appointmentReminder}
            </SelectItem>
            <SelectItem value="custom">
              {t.reminders.rule.custom}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Channel */}
      <div className="grid gap-2">
        <Label>{t.reminders.dialog.channel}</Label>
        <Select value={channel} onValueChange={onChannelChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t.reminders.dialog.channelPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">{t.reminders.channel.email}</SelectItem>
            <SelectItem value="sms">{t.reminders.channel.sms}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Trigger */}
      <div className="grid gap-2">
        <Label>{t.reminders.dialog.trigger}</Label>
        <Select value={triggerMoment} onValueChange={onTriggerChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="immediate">
              {t.reminders.dialog.triggerImmediate}
            </SelectItem>
            <SelectItem value="before">
              {t.reminders.dialog.triggerBefore}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Delay (only if trigger = before) */}
      {triggerMoment === "before" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>{t.reminders.dialog.delay}</Label>
            <Input
              type="number"
              min={1}
              value={delayValue}
              onChange={(e) =>
                onDelayValueChange(Math.max(1, parseInt(e.target.value) || 1))
              }
              placeholder={t.reminders.dialog.delayPlaceholder}
            />
          </div>
          <div className="grid gap-2">
            <Label>{t.reminders.dialog.delayUnit}</Label>
            <Select value={delayUnit} onValueChange={onDelayUnitChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hours">
                  {t.reminders.dialog.hours}
                </SelectItem>
                <SelectItem value="days">
                  {t.reminders.dialog.days}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Template */}
      <div className="grid gap-2">
        <Label>{t.reminders.dialog.template}</Label>
        <Select
          value={effectiveTemplateId ?? "none"}
          onValueChange={(v) => onTemplateChange(v === "none" ? null : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={t.reminders.dialog.templatePlaceholder}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              {t.reminders.dialog.noTemplates}
            </SelectItem>
            {filteredTemplates.map((tpl) => (
              <SelectItem key={tpl.id} value={tpl.id}>
                {tpl.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Only if not confirmed */}
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="only-if-not-confirmed" className="cursor-pointer">
          {t.reminders.dialog.onlyIfNotConfirmed}
        </Label>
        <Switch
          id="only-if-not-confirmed"
          checked={onlyIfNotConfirmed}
          onCheckedChange={onOnlyIfNotConfirmedChange}
        />
      </div>

      {/* Exclude weekends */}
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="exclude-weekends" className="cursor-pointer">
          {t.reminders.dialog.excludeWeekends}
        </Label>
        <Switch
          id="exclude-weekends"
          checked={excludeWeekends}
          onCheckedChange={onExcludeWeekendsChange}
        />
      </div>
    </div>
  );
}
