"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { useProfessionalI18n } from "@/lib/i18n/pro";
import type { ProfessionalSettings } from "../_types/reminders";
import { SHADOW, RADIUS } from "@/lib/design-tokens";

interface SettingsTabProps {
  settings: ProfessionalSettings | null;
  onSettingChange: (key: string, value: boolean) => void;
  t: ReturnType<typeof useProfessionalI18n>["t"];
}

function SettingRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function SettingsTab({ settings, onSettingChange, t }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          {t.reminders.settings.title}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t.reminders.settings.subtitle}
        </p>
      </div>

      <Card className={`${RADIUS.card} ${SHADOW.card}`}>
        <CardContent className="divide-y pt-6">
          <SettingRow
            label={t.reminders.settings.patientReminders}
            description={t.reminders.settings.patientRemindersDesc}
            checked={settings?.patient_reminders ?? false}
            onChange={(v) => onSettingChange("patient_reminders", v)}
          />
          <SettingRow
            label={t.reminders.settings.channelEmail}
            description={t.reminders.settings.channelEmailDesc}
            checked={settings?.channel_email ?? false}
            onChange={(v) => onSettingChange("channel_email", v)}
          />
          <SettingRow
            label={t.reminders.settings.channelSms}
            description={t.reminders.settings.channelSmsDesc}
            checked={settings?.channel_sms ?? false}
            onChange={(v) => onSettingChange("channel_sms", v)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
