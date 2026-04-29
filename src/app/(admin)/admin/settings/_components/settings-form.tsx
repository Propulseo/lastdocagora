"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { updateSystemSetting } from "@/app/(admin)/_actions/admin-actions";
import { toast } from "sonner";
import { resolveErrorMessage } from "@/lib/error-messages";
import { Pencil, Check, X } from "lucide-react";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface Setting {
  id: string;
  setting_key: string;
  setting_value: unknown;
  description: string | null;
  updated_at: string | null;
}

interface SettingsFormProps {
  groups: Record<string, Setting[]>;
}

function SettingRow({ setting }: { setting: Setting }) {
  const { t } = useAdminI18n();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(formatValue(setting.setting_value));
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setConfirm(true);
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await updateSystemSetting(setting.id, value);
      if (result.success) {
        toast.success(t.settings.updated);
        setEditing(false);
      } else {
        toast.error(resolveErrorMessage(result.error, t.common.errorUpdating));
      }
      setConfirm(false);
    });
  }

  return (
    <div className="flex items-start justify-between gap-4 border-b py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-sm font-medium">{setting.setting_key}</p>
        {setting.description && (
          <p className="text-muted-foreground mt-0.5 text-sm">
            {setting.description}
          </p>
        )}
        {editing ? (
          <div className="mt-2 flex items-center gap-2">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="max-w-sm font-mono text-sm"
              aria-label={`${t.settings.valueLabel} ${setting.setting_key}`}
            />
            <Button size="sm" onClick={handleSave} aria-label={t.common.save}>
              <Check className="size-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setValue(formatValue(setting.setting_value));
              }}
              aria-label={t.common.cancel}
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <pre className="bg-muted mt-2 max-h-24 overflow-auto rounded p-2 text-xs">
            {formatValue(setting.setting_value)}
          </pre>
        )}
      </div>
      {!editing && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing(true)}
          aria-label={`${t.common.actions} ${setting.setting_key}`}
        >
          <Pencil className="size-4" />
        </Button>
      )}
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t.settings.updateConfirmTitle}
        description={t.settings.updateConfirmDesc.replace(
          "{key}",
          setting.setting_key
        )}
        confirmLabel={t.common.save}
        cancelLabel={t.common.cancel}
        loadingLabel={t.common.processing}
        loading={isPending}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export function SettingsForm({ groups }: SettingsFormProps) {
  const { t } = useAdminI18n();

  const groupLabels: Record<string, string> = {
    platform: t.settings.groupPlatform,
    notification: t.settings.groupNotification,
    appointment: t.settings.groupAppointment,
    google: t.settings.groupGoogle,
  };

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([prefix, settings]) => (
        <Card key={prefix}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {groupLabels[prefix] ?? prefix}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {settings.map((setting) => (
              <SettingRow key={setting.id} setting={setting} />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
