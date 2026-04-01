"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/shared/responsive-dialog"
import { Pencil, Loader2 } from "lucide-react"
import { parse } from "date-fns"
import { usePatientTranslations } from "@/locales/locale-context"
import {
  PersonalFieldset,
  AddressFieldset,
  EmergencyFieldset,
  type FormValues,
  type InsuranceProviderOption,
} from "./edit-profile-fields"

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

interface EditProfileFormProps {
  patient: PatientData | null
  userId: string
}

export function EditProfileForm({ patient, userId }: EditProfileFormProps) {
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
          <PersonalFieldset
            register={register}
            setValue={setValue}
            gender={gender}
            setGender={setGender}
            insurance={insurance}
            insuranceProviderId={insuranceProviderId}
            setInsuranceProviderId={setInsuranceProviderId}
            setInsurance={setInsurance}
            insuranceNumber={insuranceNumber}
            setInsuranceNumber={setInsuranceNumber}
            insuranceProviders={insuranceProviders}
            languages={languages}
            setLanguages={setLanguages}
            birthDate={birthDate}
            setBirthDate={setBirthDate}
            dateLocale={dateLocale}
            t={t.profile}
          />
          <AddressFieldset register={register} t={t.profile} />
          <EmergencyFieldset register={register} t={t.profile} />

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
