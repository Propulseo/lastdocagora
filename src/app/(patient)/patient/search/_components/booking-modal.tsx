"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { format, getDay } from "date-fns"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from "@/components/shared/responsive-dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Clock,
  Loader2,
  CheckCircle2,
  ArrowLeft,
  CalendarDays,
  Sun,
  Sunset,
} from "lucide-react"
import { getBookingData, createAppointment } from "@/app/(patient)/_actions/booking"
import type {
  BookingService,
  BookingAvailability,
} from "@/app/(patient)/_actions/booking"
import { usePatientTranslations } from "@/locales/locale-context"

type Slot = { slot_start: string; slot_end: string }

type BookingStep = "loading" | "service" | "datetime" | "confirm"

interface BookingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  professionalId: string
  professionalName: string
  professionalSpecialty: string | null
}

function groupSlotsByPeriod(slots: Slot[]) {
  const morning: Slot[] = []
  const afternoon: Slot[] = []

  for (const slot of slots) {
    const hour = parseInt(slot.slot_start.slice(0, 2), 10)
    if (hour < 13) {
      morning.push(slot)
    } else {
      afternoon.push(slot)
    }
  }

  return { morning, afternoon }
}

export function BookingModal({
  open,
  onOpenChange,
  professionalId,
  professionalName,
  professionalSpecialty,
}: BookingModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const { t, dateLocale } = usePatientTranslations()

  const [step, setStep] = useState<BookingStep>("loading")
  const [services, setServices] = useState<BookingService[]>([])
  const [availability, setAvailability] = useState<BookingAvailability[]>([])
  const [selectedService, setSelectedService] = useState<BookingService | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notes, setNotes] = useState("")
  const [loadError, setLoadError] = useState<string | null>(null)
  const [patientInsurance, setPatientInsurance] = useState<{ name: string; number: string | null } | null>(null)
  const loadedRef = useRef(false)

  // Load booking data when modal opens
  useEffect(() => {
    if (!open) {
      loadedRef.current = false
      return
    }
    if (loadedRef.current) return
    loadedRef.current = true

    setStep("loading")
    setLoadError(null)
    setSelectedService(null)
    setSelectedDate(undefined)
    setSelectedSlot(null)
    setSlots([])
    setNotes("")

    getBookingData(professionalId).then((result) => {
      if (!result.success) {
        if (result.error === "self_booking_not_allowed") {
          setLoadError(t.booking.selfBookingError)
        } else {
          setLoadError(result.error)
        }
        return
      }

      const { data } = result
      setServices(data.services)
      setAvailability(data.availability)
      setPatientInsurance(data.patientInsurance ?? null)

      if (data.services.length === 1) {
        setSelectedService(data.services[0])
        setStep("datetime")
      } else {
        setStep("service")
      }
    })
  }, [open, professionalId, t.booking.selfBookingError])

  const availableDays = new Set(availability.map((a) => a.day_of_week))

  function isDayDisabled(date: Date): boolean {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (date < today) return true
    return !availableDays.has(getDay(date))
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

  function handleServiceSelect(svc: BookingService) {
    setSelectedService(svc)
    setStep("datetime")
  }

  function handleSlotSelect(time: string) {
    setSelectedSlot(time)
    setStep("confirm")
  }

  async function handleConfirm() {
    if (!selectedService || !selectedDate || !selectedSlot) return
    setSubmitting(true)
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      const timeStr = selectedSlot.length === 5 ? `${selectedSlot}:00` : selectedSlot
      const result = await createAppointment({
        professionalId,
        serviceId: selectedService.id,
        appointmentDate: dateStr,
        appointmentTime: timeStr,
        notes: notes || undefined,
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
      onOpenChange(false)
      router.push("/patient/appointments")
    } catch {
      toast.error(t.booking.errorBooking)
    } finally {
      setSubmitting(false)
    }
  }

  const { morning, afternoon } = groupSlotsByPeriod(slots)

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <ResponsiveDialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            {step !== "loading" && step !== "service" && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={() => {
                  if (step === "confirm") setStep("datetime")
                  else if (step === "datetime" && services.length > 1) setStep("service")
                }}
              >
                <ArrowLeft className="size-4" />
              </Button>
            )}
            <div className="min-w-0">
              <ResponsiveDialogTitle className="truncate">{professionalName}</ResponsiveDialogTitle>
              <ResponsiveDialogDescription className="truncate">
                {professionalSpecialty}
                {selectedService && step !== "service" && (
                  <> &middot; {selectedService.name}</>
                )}
              </ResponsiveDialogDescription>
            </div>
          </div>
        </ResponsiveDialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-6 py-5">
            {/* Loading */}
            {step === "loading" && (
              <div className="flex flex-col items-center justify-center py-12">
                {loadError ? (
                  <p className="text-sm text-destructive">{loadError}</p>
                ) : (
                  <>
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <p className="mt-3 text-sm text-muted-foreground">
                      {t.booking.loadingSlots}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Step 1: Service */}
            {step === "service" && (
              <div className="space-y-3">
                <p className="text-sm font-medium">{t.booking.step1}</p>
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    {t.booking.noServices}
                  </p>
                ) : (
                  services.map((svc) => (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => handleServiceSelect(svc)}
                      className="w-full rounded-xl border p-4 text-left transition-all hover:border-primary/50 hover:bg-primary/5 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{svc.name}</p>
                        <p className="shrink-0 text-sm font-semibold">
                          {svc.price > 0 ? `${svc.price} \u20ac` : t.booking.priceOnRequest}
                        </p>
                      </div>
                      {svc.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {svc.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        <span>{svc.duration_minutes} {t.professionalDetail.min}</span>
                        <span>&middot;</span>
                        <span>{svc.consultation_type === "online" ? t.professionalDetail.online : t.professionalDetail.inPerson}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Step 2: Date + Time */}
            {step === "datetime" && (
              <div className="space-y-5">
                {/* Calendar */}
                {availability.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CalendarDays className="size-8 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">{t.booking.noSlots}</p>
                  </div>
                ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{t.booking.step2}</p>
                  </div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={isDayDisabled}
                    locale={dateLocale}
                    className="mx-auto rounded-xl border p-3"
                  />
                </div>
                )}

                {/* Time slots */}
                {selectedDate && (
                  <div className="space-y-3">
                    <Separator />
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {t.booking.step3} &mdash;{" "}
                        <span className="font-normal text-muted-foreground">
                          {format(selectedDate, t.booking.dateFormat, {
                            locale: dateLocale,
                          })}
                        </span>
                      </p>
                    </div>

                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">
                          {t.booking.loadingSlots}
                        </span>
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        {t.booking.noSlots}
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {morning.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              <Sun className="size-3" />
                              <span>{t.booking.morning}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                              {morning.map((slot) => {
                                const time = slot.slot_start.slice(0, 5)
                                return (
                                  <Button
                                    key={slot.slot_start}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="min-h-[44px] rounded-lg font-mono text-sm hover:bg-primary hover:text-primary-foreground"
                                    onClick={() => handleSlotSelect(time)}
                                  >
                                    {time}
                                  </Button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                        {afternoon.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              <Sunset className="size-3" />
                              <span>{t.booking.afternoon}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                              {afternoon.map((slot) => {
                                const time = slot.slot_start.slice(0, 5)
                                return (
                                  <Button
                                    key={slot.slot_start}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="min-h-[44px] rounded-lg font-mono text-sm hover:bg-primary hover:text-primary-foreground"
                                    onClick={() => handleSlotSelect(time)}
                                  >
                                    {time}
                                  </Button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === "confirm" && selectedService && selectedDate && selectedSlot && (
              <div className="space-y-5">
                {/* Summary card */}
                <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                  <p className="text-sm font-semibold">{t.booking.summary}</p>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-muted-foreground">{t.booking.summaryService}</span>
                    <span className="font-medium text-right">{selectedService.name}</span>
                    <span className="text-muted-foreground">{t.booking.summaryDate}</span>
                    <span className="font-medium text-right">
                      {format(selectedDate, t.booking.dateFormat, { locale: dateLocale })}
                    </span>
                    <span className="text-muted-foreground">{t.booking.summaryTime}</span>
                    <span className="font-medium text-right">{selectedSlot}</span>
                    {patientInsurance && (
                      <>
                        <span className="text-muted-foreground">{t.booking.summaryInsurance}</span>
                        <span className="font-medium text-right">{patientInsurance.name}</span>
                        {patientInsurance.number && (
                          <>
                            <span className="text-muted-foreground">{t.booking.summaryInsuranceNumber}</span>
                            <span className="font-medium text-right">{patientInsurance.number}</span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t.booking.step4}</p>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t.booking.notesPlaceholder}
                    rows={3}
                    className="rounded-xl"
                  />
                </div>

                {/* Confirm button */}
                <Button
                  className="w-full rounded-xl h-12 text-base"
                  onClick={handleConfirm}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {t.booking.submitting}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      {t.booking.confirm}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
