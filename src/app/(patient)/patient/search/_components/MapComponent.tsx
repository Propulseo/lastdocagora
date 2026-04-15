"use client"

import { useMemo, useEffect, useCallback, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet"
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

const PORTUGAL_CENTER: [number, number] = [39.3999, -8.2245]
const PIN_SIZE = 36
const SELECTED_SIZE = 47 // 36 × 1.3
const HIGHLIGHTED_SIZE = 42

function createProIcon(initials: string, isSelected: boolean, isHighlighted: boolean): L.DivIcon {
  const size = isSelected ? SELECTED_SIZE : isHighlighted ? HIGHLIGHTED_SIZE : PIN_SIZE
  const cls = isSelected ? " selected" : isHighlighted ? " highlighted" : ""
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
    html: `<div class="pro-marker-pin${cls}"><span>${initials}</span></div>`,
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

const USER_ICON = L.divIcon({ className: "", iconSize: [22, 22], iconAnchor: [11, 11], html: `<div class="user-location-marker"></div>` })

function UserMarker({ position }: { position: [number, number] }) {
  return <Marker position={position} icon={USER_ICON} />
}

function MapEventsSync({
  professionals,
  onVisibleChange,
  onDeselect,
  markerClickRef,
}: {
  professionals: ProfessionalResult[]
  onVisibleChange: ((visible: ProfessionalResult[]) => void) | null
  onDeselect: () => void
  markerClickRef: React.RefObject<number>
}) {
  const map = useMap()

  const updateVisible = useCallback(() => {
    if (!onVisibleChange) return
    const bounds = map.getBounds()
    const visible = professionals.filter((p) => {
      if (p.latitude == null || p.longitude == null) return false
      return bounds.contains([p.latitude, p.longitude])
    })
    onVisibleChange(visible)
  }, [map, professionals, onVisibleChange])

  useMapEvents({
    moveend: updateVisible,
    zoomend: updateVisible,
    click: () => {
      if (Date.now() - markerClickRef.current < 100) return
      onDeselect()
    },
  })

  useEffect(() => {
    const timer = setTimeout(updateVisible, 400)
    return () => clearTimeout(timer)
  }, [updateVisible])

  return null
}

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
  onVisibleChange?: (visible: ProfessionalResult[]) => void
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
  onVisibleChange,
}: MapComponentProps) {
  const markerClickRef = useRef(0)

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
      const isSelected = prof.id === selectedProfessionalId
      const isHighlighted = prof.id === highlightedId
      map.set(prof.id, createProIcon(initials, isSelected, isHighlighted))
    }
    return map
  }, [geoProfs, selectedProfessionalId, highlightedId, labels])

  const lowerFilter = searchFilter.toLowerCase()

  const center = userPosition ?? PORTUGAL_CENTER
  const zoom = userPosition ? 13 : 7

  return (
    <MapContainer center={center} zoom={zoom} className="leaflet-container h-full w-full rounded-lg">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds professionals={geoProfs} userPosition={userPosition} />
      {userPosition && <UserMarker position={userPosition} />}
      <MapEventsSync
        professionals={geoProfs}
        onVisibleChange={onVisibleChange ?? null}
        onDeselect={() => onSelectProfessional(null)}
        markerClickRef={markerClickRef}
      />
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
                click: () => {
                  markerClickRef.current = Date.now()
                  onSelectProfessional(prof)
                },
              }}
            />
          )
        })}
      </MarkerClusterGroup>
    </MapContainer>
  )
}
