"use client"

import { usePatientTranslations } from "@/locales/locale-context"
import { PageHeader } from "@/components/shared/page-header"

type PatientPageSection = "profile" | "settings" | "messages"

export function PatientPageHeader({
  section,
  action,
}: {
  section: PatientPageSection
  action?: React.ReactNode
}) {
  const { t } = usePatientTranslations()
  const sectionData = t[section] as { title: string; description: string }
  return (
    <PageHeader
      title={sectionData.title}
      description={sectionData.description}
      action={action}
    />
  )
}
