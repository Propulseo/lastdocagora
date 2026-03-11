"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Bell } from "lucide-react"
import { usePatientTranslations } from "@/locales/locale-context"

type Settings = {
  email_notifications: boolean; sms_notifications: boolean; appointment_reminders: boolean
  marketing_emails: boolean; reminder_frequency: string
}

const defaults: Settings = {
  email_notifications: true, sms_notifications: false, appointment_reminders: true,
  marketing_emails: false, reminder_frequency: "24h",
}

export function SettingsForm({
  settings,
  userId,
}: {
  settings: Settings | null
  userId: string
}) {
  const [state, setState] = useState<Settings>(settings ?? defaults)
  const { t } = usePatientTranslations()

  const save = useCallback(
    async (key: keyof Settings, value: boolean | string) => {
      const prev = state[key]
      setState((s) => ({ ...s, [key]: value }))

      const supabase = createClient()
      const { error } = await supabase
        .from("patient_settings")
        .upsert(
          { user_id: userId, ...state, [key]: value },
          { onConflict: "user_id" }
        )

      if (error) {
        setState((s) => ({ ...s, [key]: prev }))
        toast.error(t.settings.errorSave)
        return
      }
      toast.success(t.settings.successSave)
    },
    [state, userId]
  )

  return (
    <div className="grid gap-6">
      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5 text-primary" />
            {t.settings.notifications}
          </CardTitle>
          <CardDescription>
            {t.settings.notificationsDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow
            id="email_notifications"
            label={t.settings.emailNotifications}
            description={t.settings.emailNotificationsDesc}
            checked={state.email_notifications}
            onToggle={(v) => save("email_notifications", v)}
          />
          <ToggleRow
            id="sms_notifications"
            label={t.settings.smsNotifications}
            description={t.settings.smsNotificationsDesc}
            checked={state.sms_notifications}
            onToggle={(v) => save("sms_notifications", v)}
          />
          <ToggleRow
            id="appointment_reminders"
            label={t.settings.appointmentReminders}
            description={t.settings.appointmentRemindersDesc}
            checked={state.appointment_reminders}
            onToggle={(v) => save("appointment_reminders", v)}
          />
          <ToggleRow
            id="marketing_emails"
            label={t.settings.marketingEmails}
            description={t.settings.marketingEmailsDesc}
            checked={state.marketing_emails}
            onToggle={(v) => save("marketing_emails", v)}
          />
          <SelectRow
            label={t.settings.reminderFrequency}
            value={state.reminder_frequency}
            onValueChange={(v) => save("reminder_frequency", v)}
            options={[
              { value: "1h", label: t.settings.hours1 },
              { value: "2h", label: t.settings.hours2 },
              { value: "12h", label: t.settings.hours12 },
              { value: "24h", label: t.settings.hours24 },
              { value: "48h", label: t.settings.hours48 },
            ]}
          />
        </CardContent>
      </Card>

    </div>
  )
}

function ToggleRow({ id, label, description, checked, onToggle }: { id: string; label: string; description: string; checked: boolean; onToggle: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
      <div>
        <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onToggle} />
    </div>
  )
}

function SelectRow({ label, value, onValueChange, options }: { label: string; value: string; onValueChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
      <p className="text-sm font-medium">{label}</p>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
