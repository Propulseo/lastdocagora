"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Clock, Loader2 } from "lucide-react"
import type { PatientTranslations } from "@/locales/patient"

export type Service = {
  id: string; name: string; description: string | null
  duration_minutes: number; price: number; consultation_type: string
}

export type Slot = { slot_start: string; slot_end: string }

interface ServiceSelectorProps {
  services: Service[]
  selectedServiceId: string | null
  onSelect: (service: Service) => void
  t: PatientTranslations
}

export function ServiceSelector({ services, selectedServiceId, onSelect, t }: ServiceSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{t.booking.step1}</p>
      <div className="space-y-2">
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t.booking.noServices}
          </p>
        ) : (
          services.map((svc) => (
            <button
              key={svc.id}
              type="button"
              onClick={() => onSelect(svc)}
              className={cn(
                "w-full rounded-lg border p-3 text-left transition-colors",
                selectedServiceId === svc.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "hover:border-primary/40 hover:bg-primary/[0.02]"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{svc.name}</p>
                <p className="shrink-0 text-xs font-semibold">
                  {svc.price > 0 ? `${svc.price} \u20ac` : t.booking.priceOnRequest}
                </p>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="size-3" />
                <span>{svc.duration_minutes} {t.professionalDetail.min}</span>
                <span>&middot;</span>
                <span>{svc.consultation_type === "online" ? t.professionalDetail.online : t.professionalDetail.inPerson}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

interface SlotPickerProps {
  slots: Slot[]
  selectedSlot: string | null
  onSelect: (time: string) => void
  loading: boolean
  t: PatientTranslations
}

export function SlotPicker({ slots, selectedSlot, onSelect, loading, t }: SlotPickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{t.booking.step3}</p>
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">{t.booking.loadingSlots}</span>
        </div>
      ) : slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.booking.noSlots}</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {slots.map((slot) => {
            const time = slot.slot_start.slice(0, 5)
            return (
              <Button
                key={slot.slot_start}
                type="button"
                variant={selectedSlot === time ? "default" : "outline"}
                size="sm"
                onClick={() => onSelect(time)}
              >
                {time}
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )
}
