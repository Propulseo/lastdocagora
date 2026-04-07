"use client"

import { useState, useMemo, useCallback } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Search as SearchIcon, Loader2, MapPin } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { usePatientTranslations } from "@/locales/locale-context"
import { getSpecialtyOptions } from "@/locales/patient/specialties"
import { SearchTabs } from "./search-tabs"
import { ProfessionalCard, type ProfessionalResult } from "./professional-card"
import { MapView } from "./MapView"

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-lg border bg-muted/30">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  ),
})

type InsuranceProviderOption = { id: string; name: string; slug: string }

interface SearchContentProps {
  professionals: ProfessionalResult[]
  query: string
  specialtyFilter: string
  cityFilter: string
  insuranceFilter?: string
  insuranceProviders?: InsuranceProviderOption[]
  isAuthenticated?: boolean
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
  const router = useRouter()
  const labels = t.professional

  // Controlled search state
  const [searchQuery, setSearchQuery] = useState(query)
  const [searchSpecialty, setSearchSpecialty] = useState(specialtyFilter || "all")
  const [searchCity, setSearchCity] = useState(cityFilter)
  const [searchInsurance, setSearchInsurance] = useState(insuranceFilter || "all")
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set("q", searchQuery.trim())
    if (searchSpecialty && searchSpecialty !== "all") params.set("specialty", searchSpecialty)
    if (searchCity.trim()) params.set("city", searchCity.trim())
    if (searchInsurance && searchInsurance !== "all") params.set("insurance", searchInsurance)
    const qs = params.toString()
    router.push(`/patient/search${qs ? `?${qs}` : ""}`)
  }, [searchQuery, searchSpecialty, searchCity, searchInsurance, router])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSearch()
    }
  }, [handleSearch])

  // Professionals with coordinates for the map below results
  const geoProfs = useMemo(
    () => professionals.filter((p) => p.latitude != null && p.longitude != null),
    [professionals]
  )

  const handlePinClick = useCallback((prof: ProfessionalResult | null) => {
    if (prof) {
      setHighlightedId(prof.id)
      document.getElementById(`pro-${prof.id}`)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      })
    } else {
      setHighlightedId(null)
    }
  }, [])

  // Search bar — shared above all tabs
  const searchBar = (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t.search.namePlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="rounded-xl pl-9"
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={searchSpecialty} onValueChange={setSearchSpecialty}>
              <SelectTrigger className="w-full rounded-xl">
                <SelectValue placeholder={t.search.specialtyPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.search.specialtyAll}</SelectItem>
                {getSpecialtyOptions(locale).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48">
            <Input
              placeholder={t.search.cityPlaceholder}
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              onKeyDown={handleKeyDown}
              className="rounded-xl"
            />
          </div>
          {insuranceProviders && insuranceProviders.length > 0 && (
            <div className="w-full md:w-48">
              <Select value={searchInsurance} onValueChange={setSearchInsurance}>
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
          <Button
            className="min-h-[48px] rounded-xl lg:min-h-0"
            onClick={handleSearch}
          >
            <SearchIcon className="size-4" />
            {t.search.searchButton}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const classicContent = (
    <>
      {/* Results */}
      <div>
        <p className="mb-4 text-sm text-muted-foreground">
          {t.search.resultCount.replace("{count}", String(professionals.length))}
        </p>

        {professionals.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {professionals.map((prof) => (
              <div
                key={prof.id}
                id={`pro-${prof.id}`}
                className={`transition-all ${
                  highlightedId === prof.id
                    ? "ring-2 ring-primary rounded-xl shadow-md"
                    : ""
                }`}
              >
                <ProfessionalCard
                  prof={prof}
                  locale={locale}
                  t={t.search}
                />
              </div>
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

      {/* Map with pins below results */}
      {geoProfs.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <MapPin className="size-5 text-primary" />
            {t.search.mapNearbyPros}
          </h3>
          <div className="h-[400px] sm:h-[500px] rounded-xl overflow-hidden border">
            <MapComponent
              professionals={professionals}
              locale={locale}
              t={t.search}
              labels={labels}
              onSelectProfessional={handlePinClick}
              selectedProfessionalId={highlightedId}
              userPosition={null}
              isMobile={false}
              highlightedId={highlightedId}
              searchFilter=""
            />
          </div>
        </div>
      )}
    </>
  )

  return (
    <div className="space-y-5">
      <PageHeader
        title={t.search.title}
        description={t.search.description}
      />

      {/* Search bar above tabs — shared across all views */}
      {searchBar}

      <SearchTabs
        classicContent={classicContent}
        mapContent={<MapView professionals={professionals} locale={locale} t={t.search} />}
        locale={locale}
        t={t.search}
      />
    </div>
  )
}
