"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Bell,
  BellOff,
  CheckCircle2,
  Mail,
  MessageSquare,
  Plus,
  Settings2,
} from "lucide-react";
import type { useProfessionalI18n } from "@/lib/i18n/pro";
import type { ReminderRule } from "../_types/reminders";

interface RulesCardProps {
  rules: ReminderRule[];
  onNewRule: () => void;
  onEditRule: (rule: ReminderRule) => void;
  onToggleRule: (ruleId: string, enabled: boolean) => void;
  t: ReturnType<typeof useProfessionalI18n>["t"];
}

function getRuleLabel(
  type: string,
  t: ReturnType<typeof useProfessionalI18n>["t"],
): string {
  if (type === "appointment_confirmation")
    return t.reminders.rule.appointmentConfirmation;
  if (type === "appointment_reminder")
    return t.reminders.rule.appointmentReminder;
  return t.reminders.rule.custom;
}

function getScheduleLabel(
  rule: ReminderRule,
  t: ReturnType<typeof useProfessionalI18n>["t"],
): string {
  if (rule.trigger_moment === "immediate") return t.reminders.rule.immediate;
  if (rule.delay_unit === "hours")
    return t.reminders.rule.beforeHours.replace(
      "{{hours}}",
      String(rule.delay_value),
    );
  return t.reminders.rule.beforeDays.replace(
    "{{days}}",
    String(rule.delay_value),
  );
}

function getRuleIcon(rule: ReminderRule) {
  if (rule.trigger_moment === "immediate") return CheckCircle2;
  if (rule.channel === "email") return Mail;
  return MessageSquare;
}

export function RulesCard({
  rules,
  onNewRule,
  onEditRule,
  onToggleRule,
  t,
}: RulesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="size-5" />
          {t.reminders.section.appointments}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title={t.reminders.empty.title}
            description={t.reminders.empty.description}
            action={
              <Button
                variant="outline"
                onClick={onNewRule}
                className="gap-1.5"
              >
                <Plus className="size-4" />
                {t.reminders.empty.cta}
              </Button>
            }
          />
        ) : (
          <div className="divide-y">
            {rules.map((rule) => {
              const Icon = getRuleIcon(rule);
              return (
                <div
                  key={rule.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                        rule.channel === "email"
                          ? "bg-blue-500/10 text-blue-500"
                          : "bg-emerald-500/10 text-emerald-500",
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {getRuleLabel(rule.type, t)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {getScheduleLabel(rule, t)}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-1 shrink-0">
                      {rule.channel === "email"
                        ? t.reminders.channel.email
                        : t.reminders.channel.sms}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => onEditRule(rule)}
                    >
                      <Settings2 className="size-4" />
                      <span className="sr-only">
                        {t.reminders.dialog.editTitle}
                      </span>
                    </Button>
                    <Switch
                      checked={rule.is_enabled}
                      onCheckedChange={(checked) =>
                        onToggleRule(rule.id, checked)
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
