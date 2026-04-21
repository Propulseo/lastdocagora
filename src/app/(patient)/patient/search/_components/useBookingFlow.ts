"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { format, getDay } from "date-fns"
import { getBookingData, createAppointment } from "@/app/(patient)/_actions/booking"
import type { BookingService, BookingAvailability } from "@/app/(patient)/_actions/booking"
import { usePatientTranslations } from "@/locales/locale-context"

export type Slot = { slot_start: string; slot_end: string }
export type BookingStep = "loading" | "service" | "datetime" | "confirm"

/** Keep only slots where enough consecutive 30-min blocks are free */
function filterSlotsByDuration(slots: Slot[], mins: number): Slot[] {
  if (mins <= 30) return slots
  const available = new Set(slots.map((s) => s.slot_start.slice(0, 5)))
  const needed = Math.ceil(mins / 30)
  return slots.filter((s) => {
    const [h, m] = s.slot_start.split(":").map(Number)
    const start = h * 60 + m
    for (let i = 1; i < needed; i++) {
      const t = start + i * 30
      const key = `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`
      if (!available.has(key)) return false
    }
    return true
  })
}

interface UseBookingFlowParams {
  open: boolean
  onOpenChange: (open: boolean) => void
  professionalId: string
  preselectedDate?: string
  preselectedTime?: string
}

export function useBookingFlow({
  open,
  onOpenChange,
  professionalId,
  preselectedDate,
  preselectedTime,
}: UseBookingFlowParams) {
  const router = useRouter()
  const supabase = createClient()
  const { t, locale, dateLocale } = usePatientTranslations()

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

    getBookingData(professionalId).then(async (result) => {
      if (!result.success) {
        setLoadError(result.error === "self_booking_not_allowed" ? t.booking.selfBookingError : result.error)
        return
      }
      const { data } = result
      setServices(data.services)
      setAvailability(data.availability)
      setPatientInsurance(data.patientInsurance ?? null)

      // Auto-select service if only one
      const autoService = data.services.length === 1 ? data.services[0] : null
      if (autoService) {
        setSelectedService(autoService)
      }

      // If preselected date+time from slot grid, jump to datetime and load slots
      if (preselectedDate && autoService) {
        setStep("datetime")
        const preDate = new Date(preselectedDate + "T00:00:00")
        setSelectedDate(preDate)
        setLoadingSlots(true)
        try {
          const { data: slotData, error } = await supabase.rpc("get_available_slots", {
            p_date: preselectedDate,
            p_professional_id: professionalId,
          })
          if (!error) {
            const rawSlots = (slotData as Slot[]) ?? []
            // Filter past slots for today
            const nowPre = new Date()
            const todayMid = new Date()
            todayMid.setHours(0, 0, 0, 0)
            let fetchedSlots = preDate.getTime() === todayMid.getTime()
              ? rawSlots.filter((s) => new Date(`${preselectedDate}T${s.slot_start}`).getTime() > nowPre.getTime() + 30 * 60 * 1000)
              : rawSlots
            fetchedSlots = filterSlotsByDuration(fetchedSlots, autoService.duration_minutes)
            setSlots(fetchedSlots)
            // Auto-select the matching time slot
            if (preselectedTime) {
              const matchingSlot = fetchedSlots.find(
                (s) => s.slot_start.slice(0, 5) === preselectedTime
              )
              if (matchingSlot) {
                setSelectedSlot(matchingSlot.slot_start.slice(0, 5))
                setStep("confirm")
              }
            }
          }
        } catch {
          // Fall through to manual selection
        } finally {
          setLoadingSlots(false)
        }
      } else if (autoService) {
        setStep("datetime")
      } else {
        setStep("service")
      }
    })
  }, [open, professionalId, t.booking.selfBookingError, preselectedDate, preselectedTime, supabase])

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
      const raw = (data as Slot[]) ?? []
      // Filter out past slots for today (start > now + 30min)
      const now = new Date()
      const todayMidnight = new Date()
      todayMidnight.setHours(0, 0, 0, 0)
      let filtered = raw
      if (date && date.getTime() === todayMidnight.getTime()) {
        const cutoff = now.getTime() + 30 * 60 * 1000
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
        const errorMsg =
          result.error === "self_booking_not_allowed"
            ? t.booking.selfBookingError
            : result.error === "SLOT_UNAVAILABLE"
              ? t.booking.slotUnavailable
              : result.error === "SLOT_IN_PAST"
                ? t.booking.slotInPast
                : result.error === "SLOT_TOO_SHORT"
                  ? t.booking.slotTooShort
                  : result.error === "PATIENT_SLOT_CONFLICT"
                    ? t.booking.patientSlotConflict
                    : t.booking.errorBooking
        toast.error(errorMsg)
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

  return {
    step, services, availability, selectedService, selectedDate, selectedSlot,
    slots, loadingSlots, submitting, notes, setNotes, loadError, patientInsurance,
    locale, dateLocale, t, isDayDisabled, handleDateSelect, handleServiceSelect,
    handleSlotSelect, handleConfirm, handleBack,
  }
}
