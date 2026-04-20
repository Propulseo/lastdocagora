"use client"

import { useState, useMemo, useCallback, useTransition } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Search as SearchIcon, Loader2, MapPin } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { usePatientTranslations } from "@/locales/locale-context"
import { searchProfessionals } from "../_actions/search-professionals"
import { SearchTabs } from "./search-tabs"
import { SearchFilters } from "./SearchFilters"
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
  professionals: initialProfessionals,
  query,
  specialtyFilter,
  cityFilter,
  insuranceFilter,
  insuranceProviders,
}: SearchContentProps) {
  const { t, locale } = usePatientTranslations()
  const labels = t.professional

  // Search state
  const [professionals, setProfessionals] = useState<ProfessionalResult[]>(initialProfessionals)
  const [searchQuery, setSearchQuery] = useState(query)
  const [searchSpecialty, setSearchSpecialty] = useState(specialtyFilter || "all")
  const [searchCity, setSearchCity] = useState(cityFilter)
  const [searchInsurance, setSearchInsurance] = useState(insuranceFilter || "all")
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const executeSearch = useCallback(
    (q: string, spec: string, city: string, ins: string) => {
      startTransition(async () => {
        const results = await searchProfessionals({
          query: q.trim() || undefined,
          specialty: spec !== "all" ? spec : undefined,
          city: city.trim() || undefined,
          insurance: ins !== "all" ? ins : undefined,
        })
        setProfessionals(results as ProfessionalResult[])

        // Sync URL for shareability (no navigation, just replace)
        const params = new URLSearchParams()
        if (q.trim()) params.set("q", q.trim())
        if (spec && spec !== "all") params.set("specialty", spec)
        if (city.trim()) params.set("city", city.trim())
        if (ins && ins !== "all") params.set("insurance", ins)
        const qs = params.toString()
        window.history.replaceState(null, "", `/patient/search${qs ? `?${qs}` : ""}`)
      })
    },
    []
  )

  const handleSearch = useCallback(() => {
    executeSearch(searchQuery, searchSpecialty, searchCity, searchInsurance)
  }, [executeSearch, searchQuery, searchSpecialty, searchCity, searchInsurance])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSearch()
    }
  }, [handleSearch])

  const handleClearFilters = useCallback(() => {
    setSearchQuery("")
    setSearchSpecialty("all")
    setSearchCity("")
    setSearchInsurance("all")
    executeSearch("", "all", "", "all")
  }, [executeSearch])

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
    <SearchFilters
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      searchSpecialty={searchSpecialty}
      onSearchSpecialtyChange={setSearchSpecialty}
      searchCity={searchCity}
      onSearchCityChange={setSearchCity}
      searchInsurance={searchInsurance}
      onSearchInsuranceChange={setSearchInsurance}
      insuranceProviders={insuranceProviders}
      isPending={isPending}
      onSearch={handleSearch}
      onKeyDown={handleKeyDown}
      locale={locale}
      t={t.search}
    />
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
              <Button onClick={handleClearFilters}>
                {t.search.clearFilters}
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
