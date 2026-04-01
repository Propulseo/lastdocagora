"use client"

import { useState } from "react"
import { type UseFormRegister, type FieldErrors } from "react-hook-form"
import { Eye, EyeOff, Lock } from "lucide-react"
import { usePatientTranslations } from "@/locales/locale-context"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { type RegisterValues, getPasswordStrength } from "./register-schema"

interface RegisterPasswordSectionProps {
  register: UseFormRegister<RegisterValues>
  errors: FieldErrors<RegisterValues>
  passwordValue: string
  loading: boolean
  inputClasses: string
}

export function RegisterPasswordSection({
  register: formRegister,
  errors,
  passwordValue,
  loading,
  inputClasses,
}: RegisterPasswordSectionProps) {
  const { t } = usePatientTranslations()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const strength = getPasswordStrength(passwordValue)

  const strengthLabels = [
    "",
    t.auth.passwordWeak,
    t.auth.passwordFair,
    t.auth.passwordGood,
    t.auth.passwordStrong,
  ]
  const strengthColors = [
    "bg-zinc-200 dark:bg-zinc-700",
    "bg-red-400",
    "bg-amber-400",
    "bg-teal-400",
    "bg-green-500",
  ]

  return (
    <>
      {/* Password */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground tracking-wide">
          {t.auth.password}
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder={t.auth.passwordPlaceholder}
            autoComplete="new-password"
            disabled={loading}
            className={cn(
              inputClasses,
              "pl-10 pr-10",
              errors.password && "border-red-400"
            )}
            {...formRegister("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground/80 transition-colors"
            aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Password strength indicator */}
        {passwordValue.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <div className="flex flex-1 gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    strength >= level
                      ? strengthColors[strength]
                      : "bg-zinc-200 dark:bg-zinc-700"
                  )}
                />
              ))}
            </div>
            {strength > 0 && (
              <span className="text-[11px] text-muted-foreground">
                {strengthLabels[strength]}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Confirm password */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground tracking-wide">
          {t.auth.confirmPassword}
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type={showConfirm ? "text" : "password"}
            placeholder={t.auth.confirmPasswordPlaceholder}
            autoComplete="new-password"
            disabled={loading}
            className={cn(
              inputClasses,
              "pl-10 pr-10",
              errors.confirmPassword && "border-red-400"
            )}
            {...formRegister("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground/80 transition-colors"
            aria-label={showConfirm ? t.auth.hidePassword : t.auth.showPassword}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-red-500">{t.auth.passwordMismatch}</p>
        )}
      </div>
    </>
  )
}
