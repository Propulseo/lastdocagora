"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pencil, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
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

type PatientData = {
  first_name: string | null; last_name: string | null; phone: string | null
  date_of_birth: string | null; address: string | null; city: string | null
  postal_code: string | null; gender: string | null; languages_spoken: string[] | null
  insurance_provider: string | null
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
  const { t } = usePatientTranslations()

  const [gender, setGender] = useState(patient?.gender ?? "")
  const [insurance, setInsurance] = useState(patient?.insurance_provider ?? "")
  const [languages, setLanguages] = useState<string[]>(patient?.languages_spoken ?? [])

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="size-4" />
          {t.profile.editProfile}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t.profile.editProfile}</DialogTitle>
        </DialogHeader>
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
                <Input id="phone" type="tel" {...register("phone")} />
              </Field>
              <Field label={t.profile.birthDate} id="date_of_birth">
                <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
              </Field>
              <Field label={t.profile.gender} id="gender">
                <Select value={gender} onValueChange={(v) => { setGender(v); setValue("gender", v) }}>
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
                <Select value={insurance} onValueChange={(v) => setInsurance(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t.profile.selectPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t.profile.insuranceNone}</SelectItem>
                    <SelectItem value="medis">{t.profile.insuranceMedis}</SelectItem>
                    <SelectItem value="multicare">{t.profile.insuranceMulticare}</SelectItem>
                    <SelectItem value="advancecare">{t.profile.insuranceAdvanceCare}</SelectItem>
                    <SelectItem value="fidelidade">{t.profile.insuranceFidelidade}</SelectItem>
                    <SelectItem value="ageas">{t.profile.insuranceAgeas}</SelectItem>
                    <SelectItem value="allianz">{t.profile.insuranceAllianz}</SelectItem>
                    <SelectItem value="other">{t.profile.insuranceOther}</SelectItem>
                  </SelectContent>
                </Select>
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

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              {t.profile.cancel}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {t.profile.save}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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
