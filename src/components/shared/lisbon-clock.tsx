"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"
import { formatInLisbon } from "@/lib/timezone"

export function LisbonClock() {
  const [time, setTime] = useState(() => formatInLisbon(new Date(), "HH:mm"))

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(formatInLisbon(new Date(), "HH:mm"))
    }, 30_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground" title="Hora de Lisboa">
      <Clock className="size-3.5 shrink-0 opacity-60" />
      <span>{time}</span>
      <span className="hidden sm:inline text-[10px] opacity-60">Lisboa</span>
    </div>
  )
}
