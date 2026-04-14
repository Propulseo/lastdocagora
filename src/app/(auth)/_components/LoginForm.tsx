"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { z } from "zod/v4"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Loader2, Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { usePatientTranslations } from "@/locales/locale-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RoleToggle } from "./RoleToggle"
import { GoogleSsoButton } from "./GoogleSsoButton"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

type LoginValues = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSwitchToRegister: () => void
  redirectTo: string | null
}

export function LoginForm({ onSwitchToRegister, redirectTo }: LoginFormProps) {
  const router = useRouter()
  const { t } = usePatientTranslations()

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<"patient" | "professional">("patient")
  const [shaking, setShaking] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [wrongPortal, setWrongPortal] = useState<"patient" | "professional" | null>(null)
  const searchParams = useSearchParams()

  // Handle OAuth callback errors (wrong portal via Google SSO)
  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam === "wrong_portal_pro") {
      setAuthError(t.auth.loginErrorWrongPortalPro)
      setWrongPortal("professional")
    } else if (errorParam === "wrong_portal_patient") {
      setAuthError(t.auth.loginErrorWrongPortalPatient)
      setWrongPortal("patient")
    }
  }, [searchParams, t.auth.loginErrorWrongPortalPro, t.auth.loginErrorWrongPortalPatient])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  function getErrorMessage(msg: string): string {
    if (msg.includes("Invalid login credentials")) return t.auth.loginErrorInvalid
    if (msg.includes("Email not confirmed")) return t.auth.loginErrorNotConfirmed
    if (msg.includes("Too many requests")) return t.auth.loginErrorTooMany
    return msg
  }

  async function onSubmit(data: LoginValues) {
    setAuthError(null)
    setWrongPortal(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        const msg = getErrorMessage(error.message)
        setAuthError(msg)
        toast.error(msg)
        setShaking(true)
        setTimeout(() => setShaking(false), 500)
        setLoading(false)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single()

        const userRole = userData?.role

        // Check role matches selected portal (admins bypass)
        if (userRole !== "admin") {
          if (userRole === "professional" && role === "patient") {
            await supabase.auth.signOut()
            setAuthError(t.auth.loginErrorWrongPortalPro)
            setWrongPortal("professional")
            setLoading(false)
            return
          }
          if (userRole === "patient" && role === "professional") {
            await supabase.auth.signOut()
            setAuthError(t.auth.loginErrorWrongPortalPatient)
            setWrongPortal("patient")
            setLoading(false)
            return
          }
        }

        if (redirectTo && redirectTo.startsWith("/")) {
          router.push(redirectTo)
        } else {
          if (userRole === "admin") router.push("/admin/dashboard")
          else if (userRole === "professional") router.push("/pro/dashboard")
          else router.push("/patient/dashboard")
        }
      }

      router.refresh()
    } catch {
      setAuthError(t.auth.errorConnection)
      toast.error(t.auth.errorConnection)
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      setLoading(false)
    }
  }

  function handleGoogleSSO() {
    // Store selected portal role for the OAuth callback to verify
    document.cookie = `auth_portal_role=${role}; path=/; max-age=600; SameSite=Lax`
    const supabase = createClient()
    supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/api/auth/callback` } })
  }

  const inputClasses = "h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus:border-[#0891B2] focus:ring-[#0891B2]/20 text-sm transition-colors"

  return (
    <div className={shaking ? "auth-shake" : ""}>
      {/* Heading */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t.auth.loginTitle}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t.auth.loginSubtitle}{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-medium text-[#0891B2] hover:underline"
          >
            {t.auth.loginCreateAccount}
          </button>
        </p>
      </div>

      {/* Role toggle */}
      <RoleToggle
        value={role}
        onChange={setRole}
        patientLabel={t.auth.rolePatient}
        professionalLabel={t.auth.roleProfessional}
      />

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="login-email"
            className="text-xs font-medium text-muted-foreground tracking-wide"
          >
            {t.auth.email}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="login-email"
              type="email"
              placeholder={t.auth.emailPlaceholder}
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
              {t.auth.password}
            </label>
            <button
              type="button"
              tabIndex={-1}
              className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors"
            >
              {t.auth.forgotPassword}
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder={t.auth.passwordPlaceholder}
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
              aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
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
                {t.auth.loginSwitchToTab.replace(
                  "{role}",
                  wrongPortal === "professional"
                    ? t.auth.roleProfessional
                    : t.auth.rolePatient
                )}
              </button>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="pt-1">
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-[#0891B2] hover:bg-[#0780A0] text-white font-medium shadow-sm transition-colors"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.auth.loginButton}
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-xs text-muted-foreground/50 uppercase tracking-wider">
            {t.auth.orContinueWith}
          </span>
          <div className="h-px flex-1 bg-border/60" />
        </div>

        <GoogleSsoButton
          onClick={handleGoogleSSO}
          disabled={loading}
          label={t.auth.google}
        />

        {/* RGPD note */}
        <p className="text-[11px] text-center text-muted-foreground/50">
          {t.auth.rgpdNote}{" "}
          <Link href="/terms" className="underline hover:text-foreground/70">
            {t.auth.termsLink}
          </Link>{" "}
          &{" "}
          <Link href="/privacy" className="underline hover:text-foreground/70">
            {t.auth.privacyLink}
          </Link>
        </p>
      </form>
    </div>
  )
}
