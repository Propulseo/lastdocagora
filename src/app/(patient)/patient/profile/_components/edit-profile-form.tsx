"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/shared/responsive-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pencil, Loader2, CalendarDays } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, parse } from "date-fns"
import { usePatientTranslations } from "@/locales/locale-context"

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

type InsuranceProviderOption = { id: string; name: string; slug: string }

type PatientData = {
  first_name: string | null; last_name: string | null; phone: string | null
  date_of_birth: string | null; address: string | null; city: string | null
  postal_code: string | null; gender: string | null; languages_spoken: string[] | null
  insurance_provider: string | null
  insurance_provider_id: string | null
  insurance_number: string | null
  emergency_contact_name: string | null; emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
}

type FormValues = {
  first_name: string; last_name: string; phone: string; date_of_birth: string
  gender: string; address: string; city: string; postal_code: string
  emergency_contact_name: string; emergency_contact_phone: string
  emergency_contact_relationship: string
}

export function EditProfileForm({
  patient,
  userId,
}: {
  patient: PatientData | null
  userId: string
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { t, dateLocale } = usePatientTranslations()

  const [gender, setGender] = useState(patient?.gender ?? "")
  const [insurance, setInsurance] = useState(patient?.insurance_provider ?? "")
  const [insuranceProviderId, setInsuranceProviderId] = useState(patient?.insurance_provider_id ?? "")
  const [insuranceNumber, setInsuranceNumber] = useState(patient?.insurance_number ?? "")
  const [insuranceProviders, setInsuranceProviders] = useState<InsuranceProviderOption[]>([])
  const [languages, setLanguages] = useState<string[]>(patient?.languages_spoken ?? [])
  const [birthDate, setBirthDate] = useState<Date | undefined>(
    patient?.date_of_birth ? parse(patient.date_of_birth, "yyyy-MM-dd", new Date()) : undefined
  )

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("insurance_providers")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => {
        if (data) setInsuranceProviders(data)
      })
  }, [])

  const { register, handleSubmit, setValue } = useForm<FormValues>({
    defaultValues: {
      first_name: patient?.first_name ?? "",
      last_name: patient?.last_name ?? "",
      phone: patient?.phone ?? "",
      date_of_birth: patient?.date_of_birth ?? "",
      gender: patient?.gender ?? "",
      address: patient?.address ?? "",
      city: patient?.city ?? "",
      postal_code: patient?.postal_code ?? "",
      emergency_contact_name: patient?.emergency_contact_name ?? "",
      emergency_contact_phone: patient?.emergency_contact_phone ?? "",
      emergency_contact_relationship: patient?.emergency_contact_relationship ?? "",
    },
  })

  async function onSubmit(data: FormValues) {
    setSaving(true)
    const supabase = createClient()

    const str = (v: string) => v || null
    const payload = {
      user_id: userId, first_name: str(data.first_name), last_name: str(data.last_name),
      phone: str(data.phone), date_of_birth: str(data.date_of_birth), gender: str(data.gender),
      address: str(data.address), city: str(data.city), postal_code: str(data.postal_code),
      emergency_contact_name: str(data.emergency_contact_name),
      emergency_contact_phone: str(data.emergency_contact_phone),
      emergency_contact_relationship: str(data.emergency_contact_relationship),
      languages_spoken: languages.length > 0 ? languages : [],
      insurance_provider: insurance || null,
      insurance_provider_id: insuranceProviderId || null,
      insurance_number: insuranceNumber || null,
    }
    const [{ error: pErr }, { error: uErr }] = await Promise.all([
      supabase.from("patients").upsert(payload, { onConflict: "user_id" }),
      supabase
        .from("users")
        .update({
          first_name: data.first_name || undefined,
          last_name: data.last_name || undefined,
          phone: data.phone || null,
        })
        .eq("id", userId),
    ])

    if (pErr || uErr) {
      toast.error(t.profile.errorSave)
      setSaving(false)
      return
    }

    toast.success(t.profile.successSave)
    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="size-4" />
          {t.profile.editProfile}
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t.profile.editProfile}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-muted-foreground">
              {t.profile.personalInfo}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.profile.firstName} id="first_name">
                <Input id="first_name" {...register("first_name")} />
              </Field>
              <Field label={t.profile.lastName} id="last_name">
                <Input id="last_name" {...register("last_name")} />
              </Field>
              <Field label={t.profile.phone} id="phone">
                <Input id="phone" type="tel" inputMode="tel" {...register("phone")} />
              </Field>
              <Field label={t.profile.birthDate} id="date_of_birth">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarDays className="mr-2 size-4 text-muted-foreground" />
                      {birthDate
                        ? format(birthDate, "dd/MM/yyyy")
                        : <span className="text-muted-foreground">{t.profile.selectPlaceholder}</span>}
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
              <Field label={t.profile.gender} id="gender">
                <Select value={gender || undefined} onValueChange={(v) => { setGender(v); setValue("gender", v) }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t.profile.selectPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">{t.profile.genderMale}</SelectItem>
                    <SelectItem value="female">{t.profile.genderFemale}</SelectItem>
                    <SelectItem value="other">{t.profile.genderOther}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t.profile.insuranceProvider} id="insurance_provider">
                <Select
                  value={insuranceProviderId || insurance || undefined}
                  onValueChange={(v) => {
                    setInsuranceProviderId(v)
                    const provider = insuranceProviders.find((p) => p.id === v)
                    setInsurance(provider?.slug ?? v)
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t.profile.selectPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t.profile.insuranceNone}</SelectItem>
                    {insuranceProviders.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label={t.profile.insuranceNumber} id="insurance_number">
                <Input
                  id="insurance_number"
                  value={insuranceNumber}
                  onChange={(e) => setInsuranceNumber(e.target.value)}
                  placeholder={t.profile.insuranceNumberPlaceholder}
                  maxLength={50}
                />
              </Field>
              <Field label={t.profile.languagesSpoken} id="languages_spoken" className="sm:col-span-2">
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
                      {t.profile[lang.labelKey as keyof typeof t.profile]}
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          </fieldset>

          {/* Address */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-muted-foreground">
              {t.profile.addressSection}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.profile.addressLabel} id="address" className="sm:col-span-2">
                <Input id="address" {...register("address")} />
              </Field>
              <Field label={t.profile.city} id="city">
                <Input id="city" {...register("city")} />
              </Field>
              <Field label={t.profile.postalCode} id="postal_code">
                <Input id="postal_code" {...register("postal_code")} />
              </Field>
            </div>
          </fieldset>

          {/* Emergency */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium text-muted-foreground">
              {t.profile.emergencyContact}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.profile.name} id="ec_name">
                <Input id="ec_name" {...register("emergency_contact_name")} />
              </Field>
              <Field label={t.profile.phone} id="ec_phone">
                <Input id="ec_phone" type="tel" {...register("emergency_contact_phone")} />
              </Field>
              <Field label={t.profile.relationship} id="ec_rel">
                <Input id="ec_rel" {...register("emergency_contact_relationship")} />
              </Field>
            </div>
          </fieldset>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="min-h-[48px] w-full sm:w-auto"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              {t.profile.cancel}
            </Button>
            <Button type="submit" className="min-h-[48px] w-full sm:w-auto" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {t.profile.save}
            </Button>
          </div>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function Field({ label, id, className, children }: { label: string; id: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-1.5">{label}</Label>
      {children}
    </div>
  )
}
