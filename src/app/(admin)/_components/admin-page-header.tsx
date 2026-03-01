"use client"

import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n"
import { PageHeader } from "@/components/shared/page-header"

type AdminPageSection =
  | "users"
  | "professionals"
  | "appointments"
  | "content"
  | "settings"
  | "support"

interface AdminPageHeaderProps {
  section: AdminPageSection
  action?: React.ReactNode
}

export function AdminPageHeader({ section, action }: AdminPageHeaderProps) {
  const { t } = useAdminI18n()
  const sectionData = t[section] as Record<string, string>

  return (
    <PageHeader
      title={sectionData.title}
      description={sectionData.description}
      action={action}
    />
  )
}
