import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Bell, Calendar } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

interface SettingDisplay {
  label: string;
  description: string;
  value: boolean;
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) redirect("/login");

  const { data: settings } = await supabase
    .from("professional_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const currentSettings = settings ?? {
    auto_confirm: false,
    notify_new_appointments: true,
    notify_cancellations: true,
    notify_reminders: true,
    patient_reminders: true,
    channel_email: true,
    channel_sms: false,
    default_duration_minutes: 30,
    min_booking_hours: 24,
  };

  const appointmentSettings: SettingDisplay[] = [
    {
      label: "Confirmacao Automatica",
      description:
        "Confirmar automaticamente novas marcacoes sem revisao manual",
      value: currentSettings.auto_confirm,
    },
    {
      label: "Lembretes aos Pacientes",
      description:
        "Enviar lembretes automaticos aos pacientes antes da consulta",
      value: currentSettings.patient_reminders,
    },
  ];

  const notificationSettings: SettingDisplay[] = [
    {
      label: "Novas Marcacoes",
      description:
        "Receber notificacao quando um paciente marca uma consulta",
      value: currentSettings.notify_new_appointments,
    },
    {
      label: "Cancelamentos",
      description: "Receber notificacao quando uma consulta e cancelada",
      value: currentSettings.notify_cancellations,
    },
    {
      label: "Lembretes",
      description: "Receber lembretes sobre consultas proximas",
      value: currentSettings.notify_reminders,
    },
  ];

  const channelSettings: SettingDisplay[] = [
    {
      label: "Email",
      description: "Receber notificacoes por email",
      value: currentSettings.channel_email,
    },
    {
      label: "SMS",
      description: "Receber notificacoes por SMS",
      value: currentSettings.channel_sms,
    },
  ];

  const sections = [
    {
      title: "Consultas",
      description: "Configuracoes de agendamento",
      icon: Calendar,
      settings: appointmentSettings,
      extra: [
        {
          label: "Duracao Padrao",
          description: "Duracao padrao de cada consulta",
          value: `${currentSettings.default_duration_minutes} min`,
        },
        {
          label: "Antecedencia Minima",
          description: "Horas minimas para marcacao",
          value: `${currentSettings.min_booking_hours}h`,
        },
      ],
    },
    {
      title: "Notificacoes",
      description: "Gerir as notificacoes que recebe",
      icon: Bell,
      settings: notificationSettings,
    },
    {
      title: "Canais de Notificacao",
      description: "Como pretende receber notificacoes",
      icon: Settings,
      settings: channelSettings,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuracoes"
        description="Preferencias da sua conta profissional"
      />

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
                  <Badge variant={setting.value ? "default" : "secondary"}>
                    {setting.value ? "Ativo" : "Inativo"}
                  </Badge>
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
