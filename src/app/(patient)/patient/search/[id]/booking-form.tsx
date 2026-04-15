"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { format, getDay } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, CheckCircle2 } from "lucide-react"
import { createAppointment } from "@/app/(patient)/_actions/booking"
import { usePatientTranslations } from "@/locales/locale-context"
import { ServiceSelector, SlotPicker, type Service, type Slot } from "./booking-form-steps"

type Availability = {
  day_of_week: number; start_time: string; end_time: string
  is_recurring: boolean | null; specific_date: string | null
}

/** Keep only slots whose free window >= service duration */
function filterSlotsByDuration(slots: Slot[], durationMinutes: number): Slot[] {
  return slots.filter((s) => {
    const [sH, sM] = s.slot_start.split(":").map(Number)
    const [eH, eM] = s.slot_end.split(":").map(Number)
    return (eH * 60 + eM) - (sH * 60 + sM) >= durationMinutes
  })
}

interface BookingFormProps {
  professionalId: string; professionalUserId: string
  patientUserId: string
  services: Service[]; availability: Availability[]
}

export function BookingForm({
  professionalId,
  professionalUserId,
  patientUserId,
  services,
  availability,
}: BookingFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const { t, locale, dateLocale } = usePatientTranslations()

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { register, handleSubmit } = useForm<{ notes: string }>({ defaultValues: { notes: "" } })
  const availableDays = new Set(availability.map((a) => a.day_of_week))

  function isDayDisabled(date: Date): boolean {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) return true
    const dow = getDay(date)
    return !availableDays.has(dow)
  }

  async function handleDateSelect(date: Date | undefined) {
    setSelectedDate(date)
    setSelectedSlot(null)
    setSlots([])
    if (!date) return
    setLoadingSlots(true)
    try {
      const dateStr = format(date, "yyyy-MM-dd")
      const { data, error } = await supabase.rpc("get_available_slots", {
        p_date: dateStr,
        p_professional_id: professionalId,
      })
      if (error) throw error
      const raw = (data as Slot[]) ?? []
      // Filter out past slots for today (start_time > now + 30min margin)
      const now = new Date()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let filtered = raw
      if (date.getTime() === today.getTime()) {
        const marginMs = 30 * 60 * 1000
        const cutoff = now.getTime() + marginMs
        filtered = raw.filter((s) => new Date(`${dateStr}T${s.slot_start}`).getTime() > cutoff)
      }
      if (selectedService) {
        filtered = filterSlotsByDuration(filtered, selectedService.duration_minutes)
      }
      setSlots(filtered)
    } catch {
      toast.error(t.booking.errorLoadSlots)
    } finally {
      setLoadingSlots(false)
    }
  }

  async function onSubmit(values: { notes: string }) {
    if (!selectedService || !selectedDate || !selectedSlot) {
      return toast.error(t.booking.errorRequired)
    }
    setSubmitting(true)
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      const timeStr = selectedSlot.length === 5 ? `${selectedSlot}:00` : selectedSlot
      const result = await createAppointment({
        professionalId,
        serviceId: selectedService.id,
        appointmentDate: dateStr,
        appointmentTime: timeStr,
        notes: values.notes || undefined,
      })

      if (!result.success) {
        if (result.error === "self_booking_not_allowed") {
          toast.error(t.booking.selfBookingError)
        } else if (result.error === "SLOT_UNAVAILABLE") {
          toast.error(t.booking.slotUnavailable)
        } else if (result.error === "SLOT_IN_PAST") {
          toast.error(t.booking.slotInPast)
        } else if (result.error === "SLOT_TOO_SHORT") {
          toast.error(t.booking.slotTooShort)
        } else {
          toast.error(t.booking.errorBooking)
        }
        return
      }

      toast.success(t.booking.successBooked)
      router.push("/patient/appointments")
    } catch {
      toast.error(t.booking.errorBooking)
    } finally {
      setSubmitting(false)
    }
  }

  const isSelfBooking = patientUserId === professionalUserId
  const canBook = selectedService && selectedDate && selectedSlot && !isSelfBooking

  if (isSelfBooking) {
    return (
      <Card>
        <CardHeader><CardTitle>{t.booking.title}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t.booking.selfBookingError}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t.booking.title}</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <ServiceSelector
            services={services}
            selectedServiceId={selectedService?.id ?? null}
            onSelect={setSelectedService}
            locale={locale}
            t={t}
          />

          {selectedService && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t.booking.step2}</p>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={isDayDisabled}
                locale={dateLocale}
                className="mx-auto"
              />
            </div>
          )}

          {selectedDate && (
            <SlotPicker
              slots={slots}
              selectedSlot={selectedSlot}
              onSelect={setSelectedSlot}
              loading={loadingSlots}
              t={t}
            />
          )}

          {selectedSlot && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t.booking.step4}</p>
              <Textarea
                {...register("notes")}
                placeholder={t.booking.notesPlaceholder}
                rows={3}
              />
            </div>
          )}

          {canBook && (
            <div className="space-y-1.5 rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-medium">{t.booking.summary}</p>
              <p className="text-muted-foreground"><strong className="text-foreground">{t.booking.summaryService}</strong> {(selectedService as Record<string, unknown>)[`name_${locale}`] as string ?? selectedService.name_pt ?? selectedService.name}</p>
              <p className="text-muted-foreground"><strong className="text-foreground">{t.booking.summaryDate}</strong> {format(selectedDate, t.booking.dateFormat, { locale: dateLocale })}</p>
              <p className="text-muted-foreground"><strong className="text-foreground">{t.booking.summaryTime}</strong> {selectedSlot}</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={!canBook || submitting}>
            {submitting
              ? <><Loader2 className="size-4 animate-spin" />{t.booking.submitting}</>
              : <><CheckCircle2 className="size-4" />{t.booking.confirm}</>}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
