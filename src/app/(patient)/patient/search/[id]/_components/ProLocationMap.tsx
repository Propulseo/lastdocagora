"use client"

import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer, Marker } from "react-leaflet"

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
})

interface ProLocationMapProps {
  latitude: number
  longitude: number
}

export default function ProLocationMap({ latitude, longitude }: ProLocationMapProps) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={15}
      scrollWheelZoom={false}
      dragging={false}
      zoomControl={false}
      attributionControl={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} />
    </MapContainer>
  )
}
