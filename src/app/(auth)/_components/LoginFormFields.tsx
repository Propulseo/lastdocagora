"use client"

import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { UseFormRegister, FieldErrors } from "react-hook-form"

type LoginValues = { email: string; password: string }

const inputClasses = "h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus:border-[#0891B2] focus:ring-[#0891B2]/20 text-sm transition-colors"

interface LoginFormFieldsProps {
  register: UseFormRegister<LoginValues>
  errors: FieldErrors<LoginValues>
  loading: boolean
  showPassword: boolean
  setShowPassword: (show: boolean) => void
  authError: string | null
  setAuthError: (error: string | null) => void
  wrongPortal: "patient" | "professional" | null
  setWrongPortal: (portal: "patient" | "professional" | null) => void
  setRole: (role: "patient" | "professional") => void
  t: {
    email: string
    emailPlaceholder: string
    password: string
    passwordPlaceholder: string
    forgotPassword: string
    showPassword: string
    hidePassword: string
    loginSwitchToTab: string
    rolePatient: string
    roleProfessional: string
  }
}

export function LoginFormFields({
  register,
  errors,
  loading,
  showPassword,
  setShowPassword,
  authError,
  setAuthError,
  wrongPortal,
  setWrongPortal,
  setRole,
  t,
}: LoginFormFieldsProps) {
  return (
    <>
      {/* Email */}
      <div className="space-y-1.5">
        <label
          htmlFor="login-email"
          className="text-xs font-medium text-muted-foreground tracking-wide"
        >
          {t.email}
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="login-email"
            type="email"
            placeholder={t.emailPlaceholder}
            autoComplete="email"
            disabled={loading}
            className={cn(inputClasses, "pl-10", errors.email && "border-red-400")}
            {...register("email", { onChange: () => setAuthError(null) })}
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="login-password"
            className="text-xs font-medium text-muted-foreground tracking-wide"
          >
            {t.password}
          </label>
          <button
            type="button"
            tabIndex={-1}
            className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            {t.forgotPassword}
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder={t.passwordPlaceholder}
            autoComplete="current-password"
            disabled={loading}
            className={cn(
              inputClasses,
              "pl-10 pr-10",
              errors.password && "border-red-400"
            )}
            {...register("password", { onChange: () => setAuthError(null) })}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground/80 transition-colors"
            aria-label={showPassword ? t.hidePassword : t.showPassword}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Auth error */}
      {authError && (
        <div className="flex flex-col gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
          {wrongPortal && (
            <button
              type="button"
              onClick={() => {
                setRole(wrongPortal)
                setWrongPortal(null)
                setAuthError(null)
              }}
              className="ml-6 text-xs font-medium text-[#0891B2] hover:underline text-left"
            >
              {t.loginSwitchToTab.replace(
                "{role}",
                wrongPortal === "professional"
                  ? t.roleProfessional
                  : t.rolePatient
              )}
            </button>
          )}
        </div>
      )}
    </>
  )
}
