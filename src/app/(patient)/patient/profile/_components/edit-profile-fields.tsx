"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarDays } from "lucide-react"
import { format } from "date-fns"
import type { UseFormRegister, UseFormSetValue } from "react-hook-form"
import type { PatientTranslations } from "@/locales/patient"
import type { DateFnsLocale } from "@/locales/patient"

const LANGUAGE_OPTIONS = [
  { value: "fr", labelKey: "langFr" },
  { value: "en", labelKey: "langEn" },
  { value: "pt", labelKey: "langPt" },
  { value: "es", labelKey: "langEs" },
  { value: "de", labelKey: "langDe" },
  { value: "ar", labelKey: "langAr" },
  { value: "ru", labelKey: "langRu" },
  { value: "zh", labelKey: "langZh" },
  { value: "it", labelKey: "langIt" },
] as const

export type FormValues = {
  first_name: string; last_name: string; phone: string; date_of_birth: string
  gender: string; address: string; city: string; postal_code: string
  emergency_contact_name: string; emergency_contact_phone: string
  emergency_contact_relationship: string
}

export type InsuranceProviderOption = { id: string; name: string; slug: string }

export function Field({ label, id, className, children }: { label: string; id: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-1.5">{label}</Label>
      {children}
    </div>
  )
}

interface PersonalFieldsetProps {
  register: UseFormRegister<FormValues>
  setValue: UseFormSetValue<FormValues>
  gender: string
  setGender: (v: string) => void
  insurance: string
  insuranceProviderId: string
  setInsuranceProviderId: (v: string) => void
  setInsurance: (v: string) => void
  insuranceNumber: string
  setInsuranceNumber: (v: string) => void
  insuranceProviders: InsuranceProviderOption[]
  languages: string[]
  setLanguages: React.Dispatch<React.SetStateAction<string[]>>
  birthDate: Date | undefined
  setBirthDate: (d: Date | undefined) => void
  dateLocale: DateFnsLocale
  t: PatientTranslations["profile"]
}

export function PersonalFieldset({
  register, setValue, gender, setGender,
  insurance, insuranceProviderId, setInsuranceProviderId,
  setInsurance, insuranceNumber, setInsuranceNumber,
  insuranceProviders, languages, setLanguages,
  birthDate, setBirthDate, dateLocale, t,
}: PersonalFieldsetProps) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-medium text-muted-foreground">
        {t.personalInfo}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.firstName} id="first_name">
          <Input id="first_name" {...register("first_name")} />
        </Field>
        <Field label={t.lastName} id="last_name">
          <Input id="last_name" {...register("last_name")} />
        </Field>
        <Field label={t.phone} id="phone">
          <Input id="phone" type="tel" inputMode="tel" {...register("phone")} />
        </Field>
        <Field label={t.birthDate} id="date_of_birth">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarDays className="mr-2 size-4 text-muted-foreground" />
                {birthDate
                  ? format(birthDate, "dd/MM/yyyy")
                  : <span className="text-muted-foreground">{t.selectPlaceholder}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={birthDate}
                onSelect={(d) => {
                  setBirthDate(d)
                  setValue("date_of_birth", d ? format(d, "yyyy-MM-dd") : "")
                }}
                locale={dateLocale}
                captionLayout="dropdown"
                fromYear={1920}
                toYear={new Date().getFullYear()}
                disabled={(d) => d > new Date()}
              />
            </PopoverContent>
          </Popover>
        </Field>
        <Field label={t.gender} id="gender">
          <Select value={gender || undefined} onValueChange={(v) => { setGender(v); setValue("gender", v) }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t.selectPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">{t.genderMale}</SelectItem>
              <SelectItem value="female">{t.genderFemale}</SelectItem>
              <SelectItem value="other">{t.genderOther}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label={t.insuranceProvider} id="insurance_provider">
          <Select
            value={insuranceProviderId || insurance || undefined}
            onValueChange={(v) => {
              setInsuranceProviderId(v)
              const provider = insuranceProviders.find((p) => p.id === v)
              setInsurance(provider?.slug ?? v)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t.selectPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t.insuranceNone}</SelectItem>
              {insuranceProviders.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label={t.insuranceNumber} id="insurance_number">
          <Input
            id="insurance_number"
            value={insuranceNumber}
            onChange={(e) => setInsuranceNumber(e.target.value)}
            placeholder={t.insuranceNumberPlaceholder}
            maxLength={50}
          />
        </Field>
        <Field label={t.languagesSpoken} id="languages_spoken" className="sm:col-span-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {LANGUAGE_OPTIONS.map((lang) => (
              <label
                key={lang.value}
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={languages.includes(lang.value)}
                  onCheckedChange={(checked) => {
                    setLanguages((prev) =>
                      checked
                        ? [...prev, lang.value]
                        : prev.filter((l) => l !== lang.value)
                    )
                  }}
                />
                {t[lang.labelKey as keyof typeof t]}
              </label>
            ))}
          </div>
        </Field>
      </div>
    </fieldset>
  )
}

interface AddressFieldsetProps {
  register: UseFormRegister<FormValues>
  t: PatientTranslations["profile"]
}

export function AddressFieldset({ register, t }: AddressFieldsetProps) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-medium text-muted-foreground">
        {t.addressSection}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.addressLabel} id="address" className="sm:col-span-2">
          <Input id="address" {...register("address")} />
        </Field>
        <Field label={t.city} id="city">
          <Input id="city" {...register("city")} />
        </Field>
        <Field label={t.postalCode} id="postal_code">
          <Input id="postal_code" {...register("postal_code")} />
        </Field>
      </div>
    </fieldset>
  )
}

interface EmergencyFieldsetProps {
  register: UseFormRegister<FormValues>
  t: PatientTranslations["profile"]
}

export function EmergencyFieldset({ register, t }: EmergencyFieldsetProps) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-medium text-muted-foreground">
        {t.emergencyContact}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.name} id="ec_name">
          <Input id="ec_name" {...register("emergency_contact_name")} />
        </Field>
        <Field label={t.phone} id="ec_phone">
          <Input id="ec_phone" type="tel" {...register("emergency_contact_phone")} />
        </Field>
        <Field label={t.relationship} id="ec_rel">
          <Input id="ec_rel" {...register("emergency_contact_relationship")} />
        </Field>
      </div>
    </fieldset>
  )
}
