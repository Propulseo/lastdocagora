"use client"

import { type RefObject } from "react"
import dynamic from "next/dynamic"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Loader2, MapPin } from "lucide-react"
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
  visiblePros: ProfessionalResult[]
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
  bookingOpen: boolean
  setBookingOpen: (v: boolean) => void
  onViewProfile: (profId: string) => void
  onBook: (prof: ProfessionalResult) => void
  profName: string
  cardRefs: RefObject<Map<string, HTMLDivElement>>
  onVisibleChange: (visible: ProfessionalResult[]) => void
}

export function MapViewDesktop({
  filteredProfessionals,
  geoProfs,
  visiblePros,
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
  bookingOpen,
  setBookingOpen,
  onViewProfile,
  onBook,
  profName,
  cardRefs,
  onVisibleChange,
}: MapViewDesktopProps) {
  return (
    <>
      <div className="flex gap-4 h-[calc(100vh-14rem)]">
        <div className="w-[500px] shrink-0 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t.mapFilterMap}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="rounded-xl pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground">
              {t.mapAreaCount.replace("{count}", String(visiblePros.length))}
            </p>
            {visiblePros.length < geoProfs.length && (
              <p className="text-xs text-muted-foreground">
                {t.mapAreaTotal.replace("{count}", String(geoProfs.length))}
              </p>
            )}
          </div>
          <ScrollArea className="flex-1 -mr-2 pr-2">
            <div className="space-y-3">
              {visiblePros.length > 0 ? (
                visiblePros.map((prof) => (
                  <div
                    key={prof.id}
                    ref={(el) => {
                      if (el) cardRefs.current.set(prof.id, el)
                    }}
                    className={`cursor-pointer transition-all rounded-xl ${
                      selectedProf?.id === prof.id
                        ? "ring-2 ring-primary border-primary bg-primary/[0.04] shadow-md"
                        : highlightedId === prof.id
                          ? "ring-2 ring-primary/50 shadow-sm"
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
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <MapPin className="size-8 mb-2 opacity-30" />
                  <p className="text-sm font-medium">{t.mapAreaEmpty}</p>
                  <p className="text-xs mt-1">{t.mapAreaZoomHint}</p>
                </div>
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
            onVisibleChange={onVisibleChange}
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
