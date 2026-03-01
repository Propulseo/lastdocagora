"use client"

import { Search as SearchIcon } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import {
  ProfessionalCard,
  type ProfessionalResult,
} from "./professional-card"
import type { PatientTranslations } from "@/locales/patient"

export function ProfessionalGrid({
  professionals,
  locale,
  t,
}: {
  professionals: ProfessionalResult[]
  locale: string
  t: PatientTranslations["search"]
}) {
  if (professionals.length === 0) {
    return (
      <EmptyState
        icon={SearchIcon}
        title={t.noResults}
        description={t.noResultsDescription}
      />
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {professionals.map((prof) => (
        <ProfessionalCard
          key={prof.id}
          prof={prof}
          locale={locale}
          t={t}
        />
      ))}
    </div>
  )
}
