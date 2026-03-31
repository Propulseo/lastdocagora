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
import { cn } from "@/lib/utils"
import { Clock, Loader2, CheckCircle2 } from "lucide-react"
import { createAppointment } from "@/app/(patient)/_actions/booking"
import { usePatientTranslations } from "@/locales/locale-context"

type Service = {
  id: string; name: string; description: string | null
  duration_minutes: number; price: number; consultation_type: string
}

type Availability = {
  day_of_week: number; start_time: string; end_time: string
  is_recurring: boolean | null; specific_date: string | null
}

type Slot = { slot_start: string; slot_end: string }

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
  const { t, dateLocale } = usePatientTranslations()

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
    // date-fns getDay: 0=Sunday, matches Supabase day_of_week convention
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
      setSlots((data as Slot[]) ?? [])
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
          {/* Step 1: Select service */}
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
                    onClick={() => setSelectedService(svc)}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-colors",
                      selectedService?.id === svc.id
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

          {/* Step 2: Select date */}
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

          {/* Step 3: Select time slot */}
          {selectedDate && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t.booking.step3}</p>
              {loadingSlots ? (
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
                        onClick={() => setSelectedSlot(time)}
                      >
                        {time}
                      </Button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Notes */}
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

          {/* Summary */}
          {canBook && (
            <div className="space-y-1.5 rounded-lg bg-muted/50 p-3 text-sm">
              <p className="font-medium">{t.booking.summary}</p>
              <p className="text-muted-foreground"><strong className="text-foreground">{t.booking.summaryService}</strong> {selectedService.name}</p>
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
