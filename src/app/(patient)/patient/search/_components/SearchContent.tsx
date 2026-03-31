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
import { getSpecialtyOptions } from "@/locales/patient/specialties"
import { SearchTabs } from "./search-tabs"
import { ProfessionalCard, type ProfessionalResult } from "./professional-card"
import { MapView } from "./MapView"

type InsuranceProviderOption = { id: string; name: string; slug: string }

interface SearchContentProps {
  professionals: ProfessionalResult[]
  query: string
  specialtyFilter: string
  cityFilter: string
  insuranceFilter?: string
  insuranceProviders?: InsuranceProviderOption[]
}

export function SearchContent({
  professionals,
  query,
  specialtyFilter,
  cityFilter,
  insuranceFilter,
  insuranceProviders,
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
                  {getSpecialtyOptions(locale).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Input name="city" placeholder={t.search.cityPlaceholder} defaultValue={cityFilter} className="rounded-xl" />
            </div>
            {insuranceProviders && insuranceProviders.length > 0 && (
              <div className="w-full md:w-48">
                <Select name="insurance" defaultValue={insuranceFilter || undefined}>
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder={t.search.insuranceFilter} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.search.insuranceAll}</SelectItem>
                    {insuranceProviders.map((ins) => (
                      <SelectItem key={ins.slug} value={ins.slug}>{ins.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button type="submit" className="min-h-[48px] rounded-xl lg:min-h-0">
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
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
    <div className="space-y-5">
      <PageHeader
        title={t.search.title}
        description={t.search.description}
      />

      <SearchTabs
        classicContent={classicContent}
        mapContent={<MapView professionals={professionals} locale={locale} t={t.search} />}
        locale={locale}
        t={t.search}
      />
    </div>
  )
}
