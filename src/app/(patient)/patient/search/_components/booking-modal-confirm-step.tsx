"use client"

import { format } from "date-fns"
import type { Locale } from "date-fns"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, CheckCircle2 } from "lucide-react"
import type { BookingService } from "@/app/(patient)/_actions/booking"

function resolveServiceName(svc: BookingService, locale?: string): string {
  if (locale) {
    const key = `name_${locale}` as keyof BookingService
    const val = svc[key]
    if (typeof val === "string" && val) return val
  }
  return svc.name_pt ?? svc.name
}

interface BookingConfirmStepProps {
  selectedService: BookingService
  selectedDate: Date
  selectedSlot: string
  dateLocale: Locale
  locale?: string
  notes: string
  onNotesChange: (notes: string) => void
  submitting: boolean
  onConfirm: () => void
  patientInsurance: { name: string; number: string | null } | null
  t: {
    summary: string
    summaryService: string
    summaryDate: string
    summaryTime: string
    summaryInsurance: string
    summaryInsuranceNumber: string
    dateFormat: string
    step4: string
    notesPlaceholder: string
    submitting: string
    confirm: string
  }
}

export function BookingConfirmStep({
  selectedService,
  selectedDate,
  selectedSlot,
  dateLocale,
  locale,
  notes,
  onNotesChange,
  submitting,
  onConfirm,
  patientInsurance,
  t,
}: BookingConfirmStepProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
        <p className="text-sm font-semibold">{t.summary}</p>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-muted-foreground">{t.summaryService}</span>
          <span className="font-medium text-right">{resolveServiceName(selectedService, locale)}</span>
          <span className="text-muted-foreground">{t.summaryDate}</span>
          <span className="font-medium text-right">
            {format(selectedDate, t.dateFormat, { locale: dateLocale })}
          </span>
          <span className="text-muted-foreground">{t.summaryTime}</span>
          <span className="font-medium text-right">{selectedSlot}</span>
          {patientInsurance && (
            <>
              <span className="text-muted-foreground">{t.summaryInsurance}</span>
              <span className="font-medium text-right">{patientInsurance.name}</span>
              {patientInsurance.number && (
                <>
                  <span className="text-muted-foreground">{t.summaryInsuranceNumber}</span>
                  <span className="font-medium text-right">{patientInsurance.number}</span>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">{t.step4}</p>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder={t.notesPlaceholder}
          rows={3}
          className="rounded-xl"
        />
      </div>

      <Button
        className="w-full rounded-xl h-12 text-base"
        onClick={onConfirm}
        disabled={submitting}
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {t.submitting}
          </>
        ) : (
          <>
            <CheckCircle2 className="size-4" />
            {t.confirm}
          </>
        )}
      </Button>
    </div>
  )
}
