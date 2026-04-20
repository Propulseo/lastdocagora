"use client"

import { ResponsiveDialog, ResponsiveDialogContent } from "@/components/shared/responsive-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"
import { BookingModalHeader } from "./booking-modal-header"
import { BookingServiceStep } from "./booking-modal-service-step"
import { BookingDateTimeStep } from "./booking-modal-datetime-step"
import { BookingConfirmStep } from "./booking-modal-confirm-step"
import { useBookingFlow } from "./useBookingFlow"

interface BookingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  professionalId: string
  professionalName: string
  professionalSpecialty: string | null
  preselectedDate?: string // "2026-04-07"
  preselectedTime?: string // "11:00"
}

export function BookingModal({
  open,
  onOpenChange,
  professionalId,
  professionalName,
  professionalSpecialty,
  preselectedDate,
  preselectedTime,
}: BookingModalProps) {
  const {
    step,
    services,
    availability,
    selectedService,
    selectedDate,
    selectedSlot,
    slots,
    loadingSlots,
    submitting,
    notes,
    setNotes,
    loadError,
    patientInsurance,
    locale,
    dateLocale,
    t,
    isDayDisabled,
    handleDateSelect,
    handleServiceSelect,
    handleSlotSelect,
    handleConfirm,
    handleBack,
  } = useBookingFlow({
    open,
    onOpenChange,
    professionalId,
    preselectedDate,
    preselectedTime,
  })

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
                locale={locale}
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
                locale={locale}
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
