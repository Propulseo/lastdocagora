"use client"

import { type RefObject } from "react"
import dynamic from "next/dynamic"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Crosshair, Loader2 } from "lucide-react"
import { BookingModal } from "./booking-modal"
import { ProMapCard } from "./ProMapCard"
import type { ProfessionalResult } from "./professional-card"
import type { PatientTranslations } from "@/locales/patient"

const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-lg border bg-muted/30">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  ),
})

interface MapViewDesktopProps {
  filteredProfessionals: ProfessionalResult[]
  geoProfs: ProfessionalResult[]
  locale: string
  t: PatientTranslations["search"]
  labels: PatientTranslations["professional"]
  selectedProf: ProfessionalResult | null
  onSelectProfessional: (prof: ProfessionalResult | null) => void
  userPosition: [number, number] | null
  highlightedId: string | null
  setHighlightedId: (id: string | null) => void
  filterText: string
  setFilterText: (v: string) => void
  geoLoading: boolean
  onLocateMe: () => void
  bookingOpen: boolean
  setBookingOpen: (v: boolean) => void
  onViewProfile: (profId: string) => void
  onBook: (prof: ProfessionalResult) => void
  profName: string
  cardRefs: RefObject<Map<string, HTMLDivElement>>
}

export function MapViewDesktop({
  filteredProfessionals,
  geoProfs,
  locale,
  t,
  labels,
  selectedProf,
  onSelectProfessional,
  userPosition,
  highlightedId,
  setHighlightedId,
  filterText,
  setFilterText,
  geoLoading,
  onLocateMe,
  bookingOpen,
  setBookingOpen,
  onViewProfile,
  onBook,
  profName,
  cardRefs,
}: MapViewDesktopProps) {
  return (
    <>
      <div className="flex gap-4 h-[calc(100vh-14rem)]">
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
              onClick={onLocateMe}
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
                  onClick={() => onSelectProfessional(prof)}
                  onMouseEnter={() => setHighlightedId(prof.id)}
                  onMouseLeave={() => setHighlightedId(null)}
                >
                  <ProMapCard
                    prof={prof}
                    locale={locale}
                    t={t}
                    labels={labels}
                    onViewProfile={() => onViewProfile(prof.id)}
                    onBook={() => onBook(prof)}
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

        <div className="flex-1 rounded-lg overflow-hidden border">
          <MapComponent
            professionals={filteredProfessionals}
            locale={locale}
            t={t}
            labels={labels}
            onSelectProfessional={onSelectProfessional}
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
