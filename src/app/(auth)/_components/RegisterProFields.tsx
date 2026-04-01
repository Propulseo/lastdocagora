"use client"

import { type UseFormRegister, type UseFormSetValue } from "react-hook-form"
import { usePatientTranslations } from "@/locales/locale-context"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getSpecialtyOptions } from "@/locales/patient/specialties"
import { type RegisterValues } from "./register-schema"

interface RegisterProFieldsProps {
  register: UseFormRegister<RegisterValues>
  setValue: UseFormSetValue<RegisterValues>
  loading: boolean
  inputClasses: string
}

export function RegisterProFields({
  register: formRegister,
  setValue,
  loading,
  inputClasses,
}: RegisterProFieldsProps) {
  const { t, locale } = usePatientTranslations()
  const specialtyOptions = getSpecialtyOptions(locale)

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground tracking-wide">
          {t.auth.specialty}
        </label>
        <Select onValueChange={(v) => setValue("specialty", v)}>
          <SelectTrigger className={inputClasses}>
            <SelectValue placeholder={t.auth.specialtyPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            {specialtyOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground tracking-wide">
          {t.auth.orderNumber}
        </label>
        <Input
          placeholder={t.auth.orderNumberPlaceholder}
          disabled={loading}
          className={inputClasses}
          {...formRegister("orderNumber")}
        />
      </div>
    </div>
  )
}
