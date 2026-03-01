"use client"

import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n"
import { EmptyState } from "@/components/shared/empty-state"
import { SettingsForm } from "./settings-form"

interface Setting {
  id: string
  setting_key: string
  setting_value: unknown
  description: string | null
  updated_at: string | null
}

interface SettingsContentProps {
  groups: Record<string, Setting[]>
  isEmpty: boolean
}

export function SettingsContent({ groups, isEmpty }: SettingsContentProps) {
  const { t } = useAdminI18n()

  if (isEmpty) {
    return (
      <EmptyState
        title={t.settings.emptyTitle}
        description={t.settings.emptyDescription}
      />
    )
  }

  return <SettingsForm groups={groups} />
}
