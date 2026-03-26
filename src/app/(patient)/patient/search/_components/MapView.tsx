"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Search, Crosshair, Loader2 } from "lucide-react"
import { useIsPatientMobile } from "@/hooks/use-patient-mobile"
import { usePatientTranslations } from "@/locales/locale-context"
import { BookingModal } from "./booking-modal"
import { ProMapCard } from "./ProMapCard"
import {
  getProfessionalName,
} from "@/app/(patient)/_components/professional-name"
import { translateSpecialty } from "@/locales/patient/specialties"
import type { ProfessionalResult } from "./professional-card"
import type { PatientTranslations } from "@/locales/patient"

function MapSkeleton({ t }: { t: PatientTranslations["search"] }) {
  return (
    <div className="flex h-[calc(100vh-14rem)] items-center justify-center rounded-lg border bg-muted/30">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t.mapLoading}</p>
      </div>
    </div>
  )
}

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-lg border bg-muted/30">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  ),
})

interface MapViewProps {
  professionals: ProfessionalResult[]
  locale: string
  t: PatientTranslations["search"]
}

export function MapView({ professionals, locale, t }: MapViewProps) {
  const router = useRouter()
  const isMobile = useIsPatientMobile()
  const { t: fullT } = usePatientTranslations()
  const labels = fullT.professional

  const [selectedProf, setSelectedProf] = useState<ProfessionalResult | null>(null)
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null)
  const [filterText, setFilterText] = useState("")
  const [geoLoading, setGeoLoading] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const filteredProfessionals = useMemo(() => {
    if (!filterText) return professionals
    const lower = filterText.toLowerCase()
    return professionals.filter((p) => {
      const name = `${p.users?.first_name ?? ""} ${p.users?.last_name ?? ""}`.toLowerCase()
      const specialty = (translateSpecialty(p.specialty, locale) ?? "").toLowerCase()
      const city = (p.city ?? "").toLowerCase()
      return name.includes(lower) || specialty.includes(lower) || city.includes(lower)
    })
  }, [professionals, filterText, locale])

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error(t.mapLocationDenied)
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude])
        setGeoLoading(false)
      },
      () => {
        toast.error(t.mapLocationDenied)
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [t.mapLocationDenied])

  const handleSelectProfessional = useCallback((prof: ProfessionalResult | null) => {
    setSelectedProf(prof)
    if (prof && !isMobile) {
      const el = cardRefs.current.get(prof.id)
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [isMobile])

  const handleViewProfile = useCallback((profId: string) => {
    router.push(`/patient/search/${profId}`)
  }, [router])

  const handleBook = useCallback((prof: ProfessionalResult) => {
    setSelectedProf(prof)
    setBookingOpen(true)
  }, [])

  const profName = selectedProf
    ? getProfessionalName(
        selectedProf as { specialty?: string | null; users?: { first_name?: string | null; last_name?: string | null } | null },
        labels
      )
    : ""

  const geoProfs = useMemo(
    () => filteredProfessionals.filter((p) => p.latitude != null && p.longitude != null),
    [filteredProfessionals]
  )

  if (isMobile) {
    return (
      <>
        <div className="relative">
          {/* Filter + locate FAB over map */}
          <div className="absolute left-3 right-3 top-3 z-[1000] flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t.mapFilterMap}
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="rounded-xl bg-background/95 pl-9 shadow-md backdrop-blur-sm"
              />
            </div>
            <Button
              size="icon"
              variant="secondary"
              className="size-10 shrink-0 rounded-xl shadow-md"
              onClick={handleLocateMe}
              disabled={geoLoading}
            >
              {geoLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Crosshair className="size-4" />
              )}
            </Button>
          </div>

          {/* Map */}
          <div className="h-[calc(100dvh-12rem)] rounded-lg overflow-hidden">
            <MapComponent
              professionals={filteredProfessionals}
              locale={locale}
              t={t}
              labels={labels}
              onSelectProfessional={handleSelectProfessional}
              selectedProfessionalId={selectedProf?.id ?? null}
              userPosition={userPosition}
              isMobile
              highlightedId={highlightedId}
              searchFilter={filterText}
            />
          </div>
        </div>

        {/* Bottom sheet on marker click */}
        <Sheet
          open={selectedProf !== null && !bookingOpen}
          onOpenChange={(open) => { if (!open) setSelectedProf(null) }}
        >
          <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-6 pt-4">
            {selectedProf && (
              <ProMapCard
                prof={selectedProf}
                locale={locale}
                t={t}
                labels={labels}
                onViewProfile={() => handleViewProfile(selectedProf.id)}
                onBook={() => handleBook(selectedProf)}
              />
            )}
          </SheetContent>
        </Sheet>

        {selectedProf && (
          <BookingModal
            open={bookingOpen}
            onOpenChange={setBookingOpen}
            professionalId={selectedProf.id}
            professionalName={profName}
            professionalSpecialty={selectedProf.specialty}
          />
        )}
      </>
    )
  }

  // Desktop layout
  return (
    <>
      <div className="flex gap-4 h-[calc(100vh-14rem)]">
        {/* Left sidebar list */}
        <div className="w-[340px] shrink-0 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t.mapFilterMap}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="rounded-xl pl-9"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {geoProfs.length} {t.mapNearbyPros.toLowerCase()}
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5"
              onClick={handleLocateMe}
              disabled={geoLoading}
            >
              {geoLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Crosshair className="size-4" />
              )}
              {t.mapLocateMe}
            </Button>
          </div>
          <ScrollArea className="flex-1 -mr-2 pr-2">
            <div className="space-y-3">
              {geoProfs.map((prof) => (
                <div
                  key={prof.id}
                  ref={(el) => {
                    if (el) cardRefs.current.set(prof.id, el)
                  }}
                  className={`cursor-pointer transition-all ${
                    selectedProf?.id === prof.id
                      ? "ring-2 ring-primary rounded-xl"
                      : ""
                  }`}
                  onClick={() => handleSelectProfessional(prof)}
                  onMouseEnter={() => setHighlightedId(prof.id)}
                  onMouseLeave={() => setHighlightedId(null)}
                >
                  <ProMapCard
                    prof={prof}
                    locale={locale}
                    t={t}
                    labels={labels}
                    onViewProfile={() => handleViewProfile(prof.id)}
                    onBook={() => handleBook(prof)}
                  />
                </div>
              ))}
              {geoProfs.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {t.mapNoCoordinates}
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right map */}
        <div className="flex-1 rounded-lg overflow-hidden border">
          <MapComponent
            professionals={filteredProfessionals}
            locale={locale}
            t={t}
            labels={labels}
            onSelectProfessional={handleSelectProfessional}
            selectedProfessionalId={selectedProf?.id ?? null}
            userPosition={userPosition}
            isMobile={false}
            highlightedId={highlightedId}
            searchFilter={filterText}
          />
        </div>
      </div>

      {selectedProf && (
        <BookingModal
          open={bookingOpen}
          onOpenChange={setBookingOpen}
          professionalId={selectedProf.id}
          professionalName={profName}
          professionalSpecialty={selectedProf.specialty}
        />
      )}
    </>
  )
}
