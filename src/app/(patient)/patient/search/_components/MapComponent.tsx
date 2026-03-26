"use client"

import { useMemo, useEffect } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import MarkerClusterGroup from "react-leaflet-cluster"
import { getProfessionalInitials } from "@/app/(patient)/_components/professional-name"
import { translateSpecialty } from "@/locales/patient/specialties"
import type { PatientTranslations } from "@/locales/patient"
import type { ProfessionalResult } from "./professional-card"

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
})

const SPECIALTY_COLORS: Record<string, string> = {
  general_practitioner: "#3B82F6",
  cardiology: "#EF4444",
  dentist: "#10B981",
  dermatology: "#F59E0B",
  gynecology: "#EC4899",
  neurology: "#8B5CF6",
  ophthalmology: "#06B6D4",
  orthopedics: "#F97316",
  pediatrics: "#84CC16",
  psychiatry: "#6366F1",
}

const DEFAULT_COLOR = "#6B7280"
const PORTUGAL_CENTER: [number, number] = [39.3999, -8.2245]

interface MapComponentProps {
  professionals: ProfessionalResult[]
  locale: string
  t: PatientTranslations["search"]
  labels: PatientTranslations["professional"]
  onSelectProfessional: (prof: ProfessionalResult | null) => void
  selectedProfessionalId: string | null
  userPosition: [number, number] | null
  isMobile: boolean
  highlightedId: string | null
  searchFilter: string
}

function createProIcon(initials: string, specialty: string | null, isSelected: boolean): L.DivIcon {
  const color = SPECIALTY_COLORS[specialty ?? ""] ?? DEFAULT_COLOR
  const size = isSelected ? 44 : 36
  const borderWidth = isSelected ? 3 : 2
  const selectedClass = isSelected ? " selected" : ""

  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
    html: `<div class="pro-marker-pin${selectedClass}" style="background:${color};width:${size}px;height:${size}px;border-width:${borderWidth}px;">
      <span>${initials}</span>
    </div>`,
  })
}

function FitBounds({ professionals, userPosition }: { professionals: ProfessionalResult[]; userPosition: [number, number] | null }) {
  const map = useMap()

  useEffect(() => {
    const points: [number, number][] = professionals
      .filter((p) => p.latitude != null && p.longitude != null)
      .map((p) => [p.latitude!, p.longitude!])

    if (userPosition) points.push(userPosition)

    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 13)
      return
    }

    const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)))
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
  }, [professionals, userPosition, map])

  return null
}

function UserMarker({ position }: { position: [number, number] }) {
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "",
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        html: `<div class="user-location-marker"></div>`,
      }),
    []
  )

  return <Marker position={position} icon={icon} />
}

export default function MapComponent({
  professionals,
  locale,
  t,
  labels,
  onSelectProfessional,
  selectedProfessionalId,
  userPosition,
  isMobile,
  highlightedId,
  searchFilter,
}: MapComponentProps) {
  const geoProfs = useMemo(
    () =>
      professionals
        .filter((p) => p.latitude != null && p.longitude != null)
        .slice(0, 100),
    [professionals]
  )

  const icons = useMemo(() => {
    const map = new Map<string, L.DivIcon>()
    for (const prof of geoProfs) {
      const profData = prof as {
        specialty?: string | null
        users?: { first_name?: string | null; last_name?: string | null } | null
      }
      const initials = getProfessionalInitials(profData, labels)
      const isSelected = prof.id === selectedProfessionalId || prof.id === highlightedId
      map.set(prof.id, createProIcon(initials, prof.specialty, isSelected))
    }
    return map
  }, [geoProfs, selectedProfessionalId, highlightedId, labels])

  const lowerFilter = searchFilter.toLowerCase()

  const center = userPosition ?? PORTUGAL_CENTER
  const zoom = userPosition ? 13 : 7

  return (
    <MapContainer center={center} zoom={zoom} className="leaflet-container h-full w-full rounded-lg">
      <TileLayer
        attribution='&copy; Google Maps'
        url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
      />
      <FitBounds professionals={geoProfs} userPosition={userPosition} />
      {userPosition && <UserMarker position={userPosition} />}
      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={(cluster: { getChildCount: () => number }) => {
          return L.divIcon({
            html: `<div class="marker-cluster-custom">${cluster.getChildCount()}</div>`,
            className: "",
            iconSize: L.point(40, 40),
          })
        }}
      >
        {geoProfs.map((prof) => {
          const icon = icons.get(prof.id)
          if (!icon) return null

          const matchesFilter =
            !searchFilter ||
            getProfessionalInitials(
              prof as { specialty?: string | null; users?: { first_name?: string | null; last_name?: string | null } | null },
              labels
            )
              .toLowerCase()
              .includes(lowerFilter) ||
            (prof.users?.first_name ?? "").toLowerCase().includes(lowerFilter) ||
            (prof.users?.last_name ?? "").toLowerCase().includes(lowerFilter) ||
            (prof.specialty ?? "").toLowerCase().includes(lowerFilter) ||
            (translateSpecialty(prof.specialty, locale) ?? "").toLowerCase().includes(lowerFilter) ||
            (prof.city ?? "").toLowerCase().includes(lowerFilter)

          return (
            <Marker
              key={prof.id}
              position={[prof.latitude!, prof.longitude!]}
              icon={icon}
              opacity={matchesFilter ? 1 : 0.3}
              eventHandlers={{
                click: () => onSelectProfessional(prof),
              }}
            >
              {!isMobile && (
                <Popup>
                  <div className="min-w-[200px] text-sm">
                    <p className="font-semibold">
                      {prof.users
                        ? `Dr. ${prof.users.first_name ?? ""} ${prof.users.last_name ?? ""}`.trim()
                        : t.mapNearbyPros}
                    </p>
                    <p className="text-muted-foreground">
                      {translateSpecialty(prof.specialty, locale)}
                    </p>
                    {prof.city && (
                      <p className="text-muted-foreground mt-1">{prof.city}</p>
                    )}
                  </div>
                </Popup>
              )}
            </Marker>
          )
        })}
      </MarkerClusterGroup>
    </MapContainer>
  )
}
