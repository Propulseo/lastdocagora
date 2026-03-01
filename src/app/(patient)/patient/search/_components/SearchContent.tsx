"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Search as SearchIcon } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { usePatientTranslations } from "@/locales/locale-context"
import { SearchTabs } from "./search-tabs"
import { ProfessionalCard, type ProfessionalResult } from "./professional-card"

interface SearchContentProps {
  professionals: ProfessionalResult[]
  specialties: (string | null)[]
  query: string
  specialtyFilter: string
  cityFilter: string
}

export function SearchContent({
  professionals,
  specialties,
  query,
  specialtyFilter,
  cityFilter,
}: SearchContentProps) {
  const { t, locale } = usePatientTranslations()

  const classicContent = (
    <>
      {/* Search Filters */}
      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" placeholder={t.search.namePlaceholder} defaultValue={query} className="rounded-xl pl-9" />
            </div>
            <div className="w-full md:w-48">
              <Select name="specialty" defaultValue={specialtyFilter || undefined}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue placeholder={t.search.specialtyPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map((s) => (
                    <SelectItem key={s} value={s ?? ""}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Input name="city" placeholder={t.search.cityPlaceholder} defaultValue={cityFilter} className="rounded-xl" />
            </div>
            <Button type="submit" className="rounded-xl">
              <SearchIcon className="size-4" />
              {t.search.searchButton}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <p className="mb-4 text-sm text-muted-foreground">
          {t.search.resultCount.replace("{count}", String(professionals.length))}
        </p>

        {professionals.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {professionals.map((prof) => (
              <ProfessionalCard
                key={prof.id}
                prof={prof}
                locale={locale}
                t={t.search}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={SearchIcon}
            title={t.search.noResults}
            description={t.search.noResultsDescription}
            action={
              <Button asChild>
                <Link href="/patient/search">{t.search.clearFilters}</Link>
              </Button>
            }
          />
        )}
      </div>
    </>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.search.title}
        description={t.search.description}
      />

      <SearchTabs
        classicContent={classicContent}
        locale={locale}
        t={t.search}
      />
    </div>
  )
}
