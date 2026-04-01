"use client"

import {
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
} from "@/components/shared/responsive-dialog"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import type { BookingService } from "@/app/(patient)/_actions/booking"

type BookingStep = "loading" | "service" | "datetime" | "confirm"

interface BookingModalHeaderProps {
  step: BookingStep
  professionalName: string
  professionalSpecialty: string | null
  selectedService: BookingService | null
  serviceCount: number
  onBack: () => void
}

export function BookingModalHeader({
  step,
  professionalName,
  professionalSpecialty,
  selectedService,
  serviceCount,
  onBack,
}: BookingModalHeaderProps) {
  return (
    <ResponsiveDialogHeader className="px-6 pt-6 pb-4 border-b">
      <div className="flex items-center gap-3">
        {step !== "loading" && step !== "service" && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={onBack}
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
  )
}
