"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useIsPatientMobile } from "@/hooks/use-patient-mobile"
import { usePatientTranslations } from "@/locales/locale-context"
import {
  getProfessionalName,
} from "@/app/(patient)/_components/professional-name"
import { translateSpecialty } from "@/locales/patient/specialties"
import { MapViewMobile } from "./map-view-mobile"
import { MapViewDesktop } from "./map-view-desktop"
import type { ProfessionalResult } from "./professional-card"
import type { PatientTranslations } from "@/locales/patient"

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
  const [filterText, setFilterText] = useState("")
  const [bookingOpen, setBookingOpen] = useState(false)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [visiblePros, setVisiblePros] = useState<ProfessionalResult[]>([])

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

  const handleVisibleChange = useCallback((visible: ProfessionalResult[]) => {
    setVisiblePros(visible)
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

  const sharedProps = {
    filteredProfessionals,
    locale,
    t,
    labels,
    selectedProf,
    onSelectProfessional: handleSelectProfessional,
    userPosition: null as [number, number] | null,
    highlightedId,
    filterText,
    setFilterText,
    bookingOpen,
    setBookingOpen,
    onViewProfile: handleViewProfile,
    onBook: handleBook,
    profName,
    onVisibleChange: handleVisibleChange,
  }

  if (isMobile) {
    return <MapViewMobile {...sharedProps} />
  }

  return (
    <MapViewDesktop
      {...sharedProps}
      geoProfs={geoProfs}
      visiblePros={visiblePros}
      setHighlightedId={setHighlightedId}
      cardRefs={cardRefs}
    />
  )
}
