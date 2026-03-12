"use client"

import { useProfessionalI18n } from "@/lib/i18n/pro"
import { PageHeader } from "@/components/shared/page-header"

type ProPageSection = "patients" | "services" | "reminders" | "support"

const descriptionKeys: Record<ProPageSection, "description" | "subtitle"> = {
  patients: "description",
  services: "description",
  reminders: "subtitle",
  support: "description",
}

interface ProPageHeaderProps {
  section: ProPageSection
  action?: React.ReactNode
}

export function ProPageHeader({ section, action }: ProPageHeaderProps) {
  const { t } = useProfessionalI18n()
  const sectionData = t[section] as Record<string, unknown>
  const descKey = descriptionKeys[section]

  return (
    <PageHeader
      title={sectionData.title as string}
      description={sectionData[descKey] as string}
      action={action}
    />
  )
}
