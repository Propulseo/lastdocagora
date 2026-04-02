"use client"

import dynamic from "next/dynamic"

const ProLocationMap = dynamic(() => import("./ProLocationMap"), { ssr: false })

interface ProLocationMapWrapperProps {
  latitude: number
  longitude: number
}

export function ProLocationMapWrapper({ latitude, longitude }: ProLocationMapWrapperProps) {
  return <ProLocationMap latitude={latitude} longitude={longitude} />
}
