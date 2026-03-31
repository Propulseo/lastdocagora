"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Settings, Bell, Calendar, Palette, Sun, Moon, Monitor } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/shared/page-header";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type NotificationKey = "notify_new_appointments" | "notify_cancellations" | "notify_reminders";

interface SettingsData {
  auto_confirm: boolean;
  notify_new_appointments: boolean;
  notify_cancellations: boolean;
  notify_reminders: boolean;
  patient_reminders: boolean;
  channel_email: boolean;
  channel_sms: boolean;
  default_duration_minutes: number;
  min_booking_hours: number;
}

interface SettingDisplay {
  label: string;
  description: string;
  value: boolean;
  settingKey?: NotificationKey;
}

interface SettingsClientProps {
  settings: SettingsData;
}

export function SettingsClient({ settings }: SettingsClientProps) {
  const { t } = useProfessionalI18n();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    notify_new_appointments: settings.notify_new_appointments,
    notify_cancellations: settings.notify_cancellations,
    notify_reminders: settings.notify_reminders,
  });

  useEffect(() => setMounted(true), []);

  async function handleToggle(key: NotificationKey, value: boolean) {
    const prev = notifSettings[key];
    setNotifSettings((s) => ({ ...s, [key]: value }));

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("professional_settings")
      .upsert(
        { user_id: user.id, [key]: value, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

    if (error) {
      setNotifSettings((s) => ({ ...s, [key]: prev }));
      toast.error("Erro ao guardar definição");
    } else {
      toast.success("Definição atualizada");
    }
  }

  const appointmentSettings: SettingDisplay[] = [
    {
      label: t.settings.autoConfirm,
      description: t.settings.autoConfirmDesc,
      value: settings.auto_confirm,
    },
    {
      label: t.settings.patientReminders,
      description: t.settings.patientRemindersDesc,
      value: settings.patient_reminders,
    },
  ];

  const notificationSettings: SettingDisplay[] = [
    {
      label: t.settings.newAppointments,
      description: t.settings.newAppointmentsDesc,
      value: notifSettings.notify_new_appointments,
      settingKey: "notify_new_appointments",
    },
    {
      label: t.settings.cancellations,
      description: t.settings.cancellationsDesc,
      value: notifSettings.notify_cancellations,
      settingKey: "notify_cancellations",
    },
    {
      label: t.settings.remindersLabel,
      description: t.settings.remindersDesc,
      value: notifSettings.notify_reminders,
      settingKey: "notify_reminders",
    },
  ];

  const channelSettings: SettingDisplay[] = [
    {
      label: t.settings.emailChannel,
      description: t.settings.emailChannelDesc,
      value: settings.channel_email,
    },
    {
      label: t.settings.smsChannel,
      description: t.settings.smsChannelDesc,
      value: settings.channel_sms,
    },
  ];

  const sections = [
    {
      title: t.settings.appointments,
      description: t.settings.appointmentsDesc,
      icon: Calendar,
      settings: appointmentSettings,
      extra: [
        {
          label: t.settings.defaultDuration,
          description: t.settings.defaultDurationDesc,
          value: `${settings.default_duration_minutes} ${t.common.min}`,
        },
        {
          label: t.settings.minBooking,
          description: t.settings.minBookingDesc,
          value: `${settings.min_booking_hours}h`,
        },
      ],
    },
    {
      title: t.settings.notifications,
      description: t.settings.notificationsDesc,
      icon: Bell,
      settings: notificationSettings,
    },
    {
      title: t.settings.notificationChannels,
      description: t.settings.notificationChannelsDesc,
      icon: Settings,
      settings: channelSettings,
    },
  ];

  const themeOptions = [
    { value: "light", label: t.settings.themeLight, icon: Sun },
    { value: "dark", label: t.settings.themeDark, icon: Moon },
    { value: "system", label: t.settings.themeSystem, icon: Monitor },
  ] as const;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t.settings.title}
        description={t.settings.description}
      />

      {/* Appearance / Theme card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="size-5" />
            {t.settings.appearance}
          </CardTitle>
          <CardDescription>{t.settings.appearanceDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{t.settings.theme}</p>
              <p className="text-xs text-muted-foreground">
                {t.settings.themeDesc}
              </p>
            </div>
            {mounted && (
              <div className="flex gap-1 rounded-lg border p-1">
                {themeOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isActive = theme === opt.value;
                  return (
                    <Button
                      key={opt.value}
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => setTheme(opt.value)}
                    >
                      <Icon className="size-3.5" />
                      {opt.label}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <section.icon className="size-5" />
              {section.title}
            </CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {section.settings.map((setting, idx) => (
              <div key={setting.label}>
                {idx > 0 && <Separator />}
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{setting.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {setting.description}
                    </p>
                  </div>
                  {setting.settingKey ? (
                    <Switch
                      checked={setting.value}
                      onCheckedChange={(v) => handleToggle(setting.settingKey!, v)}
                    />
                  ) : (
                    <Badge variant={setting.value ? "default" : "secondary"}>
                      {setting.value ? t.settings.active : t.settings.inactive}
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {section.extra?.map((item) => (
              <div key={item.label}>
                <Separator />
                <div className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
