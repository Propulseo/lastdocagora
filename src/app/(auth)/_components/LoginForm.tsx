"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { z } from "zod/v4"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { usePatientTranslations } from "@/locales/locale-context"
import { Button } from "@/components/ui/button"
import { RoleToggle } from "./RoleToggle"
import { GoogleSsoButton } from "./GoogleSsoButton"
import { LoginFormFields } from "./LoginFormFields"

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

        if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
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
        <LoginFormFields
          register={register}
          errors={errors}
          loading={loading}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          authError={authError}
          setAuthError={setAuthError}
          wrongPortal={wrongPortal}
          setWrongPortal={setWrongPortal}
          setRole={setRole}
          t={{
            email: t.auth.email,
            emailPlaceholder: t.auth.emailPlaceholder,
            password: t.auth.password,
            passwordPlaceholder: t.auth.passwordPlaceholder,
            forgotPassword: t.auth.forgotPassword,
            showPassword: t.auth.showPassword,
            hidePassword: t.auth.hidePassword,
            loginSwitchToTab: t.auth.loginSwitchToTab,
            rolePatient: t.auth.rolePatient,
            roleProfessional: t.auth.roleProfessional,
          }}
        />

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
