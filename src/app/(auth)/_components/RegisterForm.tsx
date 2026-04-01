"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Loader2, Mail, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { usePatientTranslations } from "@/locales/locale-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RoleToggle } from "./RoleToggle"
import { GoogleSsoButton } from "./GoogleSsoButton"
import { RegisterPasswordSection } from "./RegisterPasswordSection"
import { RegisterRgpdSection } from "./RegisterRgpdSection"
import { RegisterProFields } from "./RegisterProFields"
import { registerSchema, type RegisterValues } from "./register-schema"

interface RegisterFormProps {
  onSwitchToLogin: () => void
  redirectTo: string | null
  initialRole?: "professional"
}

export function RegisterForm({ onSwitchToLogin, redirectTo, initialRole }: RegisterFormProps) {
  const router = useRouter()
  const { t } = usePatientTranslations()

  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<"patient" | "professional">(initialRole ?? "patient")
  const [shaking, setShaking] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      specialty: undefined,
      orderNumber: "",
      terms: undefined as unknown as true,
      privacy: undefined as unknown as true,
      healthData: undefined as unknown as true,
      marketing: false,
    },
  })

  const passwordValue = watch("password") ?? ""

  async function onSubmit(data: RegisterValues) {
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            role,
          },
        },
      })

      if (error) {
        toast.error(error.message)
        setShaking(true)
        setTimeout(() => setShaking(false), 500)
        setLoading(false)
        return
      }

      if (redirectTo && redirectTo.startsWith("/")) {
        router.push(redirectTo)
      } else if (role === "professional") {
        router.push("/pro/onboarding")
      } else {
        router.push("/patient/dashboard")
      }
      router.refresh()
    } catch {
      toast.error(t.auth.errorConnection)
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      setLoading(false)
    }
  }

  function handleGoogleSSO() {
    const supabase = createClient()
    const redirectUrl = `${window.location.origin}/api/auth/callback`
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl },
    })
  }

  const inputClasses =
    "h-11 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 focus:border-[#0891B2] focus:ring-[#0891B2]/20 text-sm transition-colors"

  return (
    <div className={shaking ? "auth-shake" : ""}>
      {/* Heading */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          {t.auth.registerTitle}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t.auth.registerSubtitle}{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium text-[#0891B2] hover:underline"
          >
            {t.auth.registerLogin}
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
        {/* First + Last name */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground tracking-wide">
              {t.auth.firstName}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="register-firstname"
                autoComplete="given-name"
                disabled={loading}
                className={cn(inputClasses, "pl-10", errors.firstName && "border-red-400")}
                {...register("firstName")}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground tracking-wide">
              {t.auth.lastName}
            </label>
            <Input
              autoComplete="family-name"
              disabled={loading}
              className={cn(inputClasses, errors.lastName && "border-red-400")}
              {...register("lastName")}
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground tracking-wide">
            {t.auth.email}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder={t.auth.emailPlaceholder}
              autoComplete="email"
              disabled={loading}
              className={cn(inputClasses, "pl-10", errors.email && "border-red-400")}
              {...register("email")}
            />
          </div>
        </div>

        <RegisterPasswordSection
          register={register}
          errors={errors}
          passwordValue={passwordValue}
          loading={loading}
          inputClasses={inputClasses}
        />

        {role === "professional" && (
          <RegisterProFields
            register={register}
            setValue={setValue}
            loading={loading}
            inputClasses={inputClasses}
          />
        )}

        <RegisterRgpdSection setValue={setValue} errors={errors} />

        {/* Submit */}
        <div className="pt-1">
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-[#0891B2] hover:bg-[#0780A0] text-white font-medium shadow-sm transition-colors"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t.auth.registerButton}
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
      </form>
    </div>
  )
}
