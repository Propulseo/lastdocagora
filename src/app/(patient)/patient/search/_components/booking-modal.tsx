"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { format, getDay } from "date-fns"
import { ResponsiveDialog, ResponsiveDialogContent } from "@/components/shared/responsive-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import { getBookingData, createAppointment } from "@/app/(patient)/_actions/booking"
import type { BookingService, BookingAvailability } from "@/app/(patient)/_actions/booking"
import { usePatientTranslations } from "@/locales/locale-context"
import { BookingModalHeader } from "./booking-modal-header"
import { BookingServiceStep } from "./booking-modal-service-step"
import { BookingDateTimeStep } from "./booking-modal-datetime-step"
import { BookingConfirmStep } from "./booking-modal-confirm-step"

type Slot = { slot_start: string; slot_end: string }
type BookingStep = "loading" | "service" | "datetime" | "confirm"

interface BookingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  professionalId: string
  professionalName: string
  professionalSpecialty: string | null
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

  useEffect(() => {
    if (!open) { loadedRef.current = false; return }
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
        setLoadError(result.error === "self_booking_not_allowed" ? t.booking.selfBookingError : result.error)
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
        toast.error(result.error === "self_booking_not_allowed" ? t.booking.selfBookingError : t.booking.errorBooking)
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

  function handleBack() {
    if (step === "confirm") setStep("datetime")
    else if (step === "datetime" && services.length > 1) setStep("service")
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 gap-0 overflow-hidden">
        <BookingModalHeader
          step={step}
          professionalName={professionalName}
          professionalSpecialty={professionalSpecialty}
          selectedService={selectedService}
          serviceCount={services.length}
          onBack={handleBack}
        />
        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-6 py-5">
            {step === "loading" && (
              <div className="flex flex-col items-center justify-center py-12">
                {loadError ? (
                  <p className="text-sm text-destructive">{loadError}</p>
                ) : (
                  <>
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <p className="mt-3 text-sm text-muted-foreground">{t.booking.loadingSlots}</p>
                  </>
                )}
              </div>
            )}
            {step === "service" && (
              <BookingServiceStep
                services={services}
                onSelect={handleServiceSelect}
                t={{
                  step1: t.booking.step1,
                  noServices: t.booking.noServices,
                  priceOnRequest: t.booking.priceOnRequest,
                  min: t.professionalDetail.min,
                  online: t.professionalDetail.online,
                  inPerson: t.professionalDetail.inPerson,
                }}
              />
            )}
            {step === "datetime" && (
              <BookingDateTimeStep
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                isDayDisabled={isDayDisabled}
                dateLocale={dateLocale}
                slots={slots}
                loadingSlots={loadingSlots}
                onSlotSelect={handleSlotSelect}
                hasAvailability={availability.length > 0}
                t={{
                  step2: t.booking.step2,
                  step3: t.booking.step3,
                  dateFormat: t.booking.dateFormat,
                  loadingSlots: t.booking.loadingSlots,
                  noSlots: t.booking.noSlots,
                  morning: t.booking.morning,
                  afternoon: t.booking.afternoon,
                }}
              />
            )}
            {step === "confirm" && selectedService && selectedDate && selectedSlot && (
              <BookingConfirmStep
                selectedService={selectedService}
                selectedDate={selectedDate}
                selectedSlot={selectedSlot}
                dateLocale={dateLocale}
                notes={notes}
                onNotesChange={setNotes}
                submitting={submitting}
                onConfirm={handleConfirm}
                patientInsurance={patientInsurance}
                t={{
                  summary: t.booking.summary,
                  summaryService: t.booking.summaryService,
                  summaryDate: t.booking.summaryDate,
                  summaryTime: t.booking.summaryTime,
                  summaryInsurance: t.booking.summaryInsurance,
                  summaryInsuranceNumber: t.booking.summaryInsuranceNumber,
                  dateFormat: t.booking.dateFormat,
                  step4: t.booking.step4,
                  notesPlaceholder: t.booking.notesPlaceholder,
                  submitting: t.booking.submitting,
                  confirm: t.booking.confirm,
                }}
              />
            )}
          </div>
        </ScrollArea>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
