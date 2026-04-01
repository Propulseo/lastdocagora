"use client"

import { type UseFormSetValue, type FieldErrors } from "react-hook-form"
import { usePatientTranslations } from "@/locales/locale-context"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { type RegisterValues } from "./register-schema"

interface RegisterRgpdSectionProps {
  setValue: UseFormSetValue<RegisterValues>
  errors: FieldErrors<RegisterValues>
}

export function RegisterRgpdSection({ setValue, errors }: RegisterRgpdSectionProps) {
  const { t } = usePatientTranslations()

  return (
    <div className="space-y-3 pt-2">
      {/* Terms - required */}
      <div className="flex items-start gap-2.5">
        <Checkbox
          id="reg-terms"
          onCheckedChange={(checked) =>
            setValue("terms", checked === true ? true : (undefined as unknown as true), {
              shouldValidate: true,
            })
          }
        />
        <label
          htmlFor="reg-terms"
          className={cn(
            "text-xs leading-relaxed cursor-pointer",
            errors.terms ? "text-red-500" : "text-muted-foreground"
          )}
        >
          {t.auth.rgpdTerms} *
        </label>
      </div>

      {/* Privacy - required */}
      <div className="flex items-start gap-2.5">
        <Checkbox
          id="reg-privacy"
          onCheckedChange={(checked) =>
            setValue("privacy", checked === true ? true : (undefined as unknown as true), {
              shouldValidate: true,
            })
          }
        />
        <label
          htmlFor="reg-privacy"
          className={cn(
            "text-xs leading-relaxed cursor-pointer",
            errors.privacy ? "text-red-500" : "text-muted-foreground"
          )}
        >
          {t.auth.rgpdPrivacy} *
        </label>
      </div>

      {/* Health data - required */}
      <div className="flex items-start gap-2.5">
        <Checkbox
          id="reg-healthData"
          onCheckedChange={(checked) =>
            setValue("healthData", checked === true ? true : (undefined as unknown as true), {
              shouldValidate: true,
            })
          }
        />
        <label
          htmlFor="reg-healthData"
          className={cn(
            "text-xs leading-relaxed cursor-pointer",
            errors.healthData ? "text-red-500" : "text-muted-foreground"
          )}
        >
          {t.auth.rgpdHealthData} *
        </label>
      </div>

      {/* Marketing - optional */}
      <div className="flex items-start gap-2.5">
        <Checkbox
          id="reg-marketing"
          onCheckedChange={(checked) =>
            setValue("marketing", checked === true)
          }
        />
        <label
          htmlFor="reg-marketing"
          className="text-xs leading-relaxed text-muted-foreground cursor-pointer"
        >
          {t.auth.rgpdMarketing}
        </label>
      </div>
    </div>
  )
}
