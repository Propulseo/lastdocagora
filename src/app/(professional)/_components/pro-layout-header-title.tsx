"use client"

import { useProfessionalI18n } from "@/lib/i18n/pro"

export function ProLayoutHeaderTitle() {
  const { t } = useProfessionalI18n()
  return (
    <span className="text-sm font-medium text-muted-foreground">
      {t.header.panelTitle}
    </span>
  )
}
