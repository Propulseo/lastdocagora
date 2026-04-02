"use client"

import { Clock } from "lucide-react"
import type { BookingService } from "@/app/(patient)/_actions/booking"

interface BookingServiceStepProps {
  services: BookingService[]
  onSelect: (service: BookingService) => void
  locale?: string
  t: {
    step1: string
    noServices: string
    priceOnRequest: string
    min: string
    online: string
    inPerson: string
  }
}

function resolveServiceName(svc: BookingService, locale?: string): string {
  if (locale) {
    const key = `name_${locale}` as keyof BookingService
    const val = svc[key]
    if (typeof val === "string" && val) return val
  }
  return svc.name_pt ?? svc.name
}

export function BookingServiceStep({
  services,
  onSelect,
  locale,
  t,
}: BookingServiceStepProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{t.step1}</p>
      {services.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {t.noServices}
        </p>
      ) : (
        services.map((svc) => (
          <button
            key={svc.id}
            type="button"
            onClick={() => onSelect(svc)}
            className="w-full rounded-xl border p-4 text-left transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium">{resolveServiceName(svc, locale)}</p>
              <p className="shrink-0 text-sm font-semibold">
                {svc.price > 0 ? `${svc.price} \u20ac` : t.priceOnRequest}
              </p>
            </div>
            {svc.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {svc.description}
              </p>
            )}
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3" />
              <span>{svc.duration_minutes} {t.min}</span>
              <span>&middot;</span>
              <span>{svc.consultation_type === "online" ? t.online : t.inPerson}</span>
            </div>
          </button>
        ))
      )}
    </div>
  )
}
