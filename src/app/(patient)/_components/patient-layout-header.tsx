"use client"

import { usePatientTranslations } from "@/locales/locale-context"

export function PatientLayoutHeader() {
  const { t } = usePatientTranslations()

  return (
    <span className="text-sm font-medium text-muted-foreground">
      {t.common.patientArea}
    </span>
  )
}
