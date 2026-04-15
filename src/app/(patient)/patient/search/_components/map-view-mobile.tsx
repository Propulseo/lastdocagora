"use client"

import dynamic from "next/dynamic"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Search, Loader2 } from "lucide-react"
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

interface MapViewMobileProps {
  filteredProfessionals: ProfessionalResult[]
  locale: string
  t: PatientTranslations["search"]
  labels: PatientTranslations["professional"]
  selectedProf: ProfessionalResult | null
  onSelectProfessional: (prof: ProfessionalResult | null) => void
  userPosition: [number, number] | null
  highlightedId: string | null
  filterText: string
  setFilterText: (v: string) => void
  bookingOpen: boolean
  setBookingOpen: (v: boolean) => void
  onViewProfile: (profId: string) => void
  onBook: (prof: ProfessionalResult) => void
  profName: string
  onVisibleChange: (visible: ProfessionalResult[]) => void
}

export function MapViewMobile({
  filteredProfessionals,
  locale,
  t,
  labels,
  selectedProf,
  onSelectProfessional,
  userPosition,
  highlightedId,
  filterText,
  setFilterText,
  bookingOpen,
  setBookingOpen,
  onViewProfile,
  onBook,
  profName,
  onVisibleChange,
}: MapViewMobileProps) {
  return (
    <>
      <div className="relative">
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
        </div>

        <div className="h-[calc(100dvh-12rem)] rounded-lg overflow-hidden">
          <MapComponent
            professionals={filteredProfessionals}
            locale={locale}
            t={t}
            labels={labels}
            onSelectProfessional={onSelectProfessional}
            selectedProfessionalId={selectedProf?.id ?? null}
            userPosition={userPosition}
            isMobile
            highlightedId={highlightedId}
            searchFilter={filterText}
            onVisibleChange={onVisibleChange}
          />
        </div>
      </div>

      <Sheet
        open={selectedProf !== null && !bookingOpen}
        onOpenChange={(open) => { if (!open) onSelectProfessional(null) }}
      >
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-6 pt-4">
          {selectedProf && (
            <ProMapCard
              prof={selectedProf}
              locale={locale}
              t={t}
              labels={labels}
              onViewProfile={() => onViewProfile(selectedProf.id)}
              onBook={() => onBook(selectedProf)}
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
