"use client"

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePatientTranslations } from "@/locales/locale-context"
import { LanguageSwitcher } from "@/components/shared/language-switcher"
import { AuthLeftPanel } from "../_components/AuthLeftPanel"
import { LoginForm } from "../_components/LoginForm"
import { RegisterForm } from "../_components/RegisterForm"

type AuthMode = "login" | "register"

function getInitialMode(): AuthMode {
  if (typeof window !== "undefined" && window.location.hash === "#register") {
    return "register"
  }
  return "login"
}

function AuthPageInner() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect")
  const roleParam = searchParams.get("role")
  const { locale } = usePatientTranslations()

  const [mode, setMode] = useState<AuthMode>(getInitialMode)
  const [isAnimating, setIsAnimating] = useState(false)
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
  }, [])

  const switchTo = useCallback(
    (newMode: AuthMode) => {
      if (isAnimating || mode === newMode) return
      setIsAnimating(true)
      setMode(newMode)
      window.history.replaceState(
        null,
        "",
        newMode === "register" ? "/login#register" : "/login"
      )
      setTimeout(() => setIsAnimating(false), 600)
    },
    [isAnimating, mode]
  )

  // Force register mode when hash=#register (covers client-side navigation)
  useEffect(() => {
    function handleHash() {
      if (window.location.hash === "#register") {
        switchTo("register")
      }
    }
    handleHash()
    window.addEventListener("hashchange", handleHash)
    return () => window.removeEventListener("hashchange", handleHash)
  }, [switchTo])

  // Focus first input after animation
  useEffect(() => {
    if (mounted.current && !isAnimating) {
      const timer = setTimeout(() => {
        document
          .querySelector<HTMLInputElement>(
            mode === "login" ? "#login-email" : "#register-firstname"
          )
          ?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [mode, isAnimating])

  const isLogin = mode === "login"

  return (
    <div className="min-h-screen">
      {/* ─── Mobile: simple horizontal slide ─── */}
      <div className="md:hidden flex flex-col min-h-screen bg-background">
        <div className="flex items-center justify-between p-6 pb-0">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft className="size-4 text-muted-foreground" />
            <Image src="/logo.png" alt="DocAgora" width={480} height={320} className="h-16 w-auto" />
          </Link>
          <LanguageSwitcher locale={locale} />
        </div>

        <div className="flex-1 overflow-hidden">
          <div
            className="flex w-[200%] h-full transition-transform duration-[320ms]"
            style={{
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              transform: isLogin ? "translateX(0%)" : "translateX(-50%)",
            }}
          >
            <div className="w-1/2 flex items-center justify-center p-6">
              <div className="w-full max-w-[400px]">
                <LoginForm
                  onSwitchToRegister={() => switchTo("register")}
                  redirectTo={redirectTo}
                />
              </div>
            </div>
            <div className="w-1/2 flex items-start justify-center overflow-y-auto p-6">
              <div className="w-full max-w-[400px] py-8">
                <RegisterForm
                  onSwitchToLogin={() => switchTo("login")}
                  redirectTo={redirectTo}
                  initialRole={roleParam === "professional" ? "professional" : undefined}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Desktop: branding panel slides between sides ─── */}
      <div className="hidden md:flex relative h-screen overflow-hidden">
        {/* Back to landing */}
        <Button variant="ghost" size="icon" className="absolute top-6 left-6 z-20 size-9 rounded-full bg-background/80 shadow-sm backdrop-blur-sm" asChild>
          <Link href="/">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Accueil</span>
          </Link>
        </Button>

        {/* Forms layer — both always rendered side by side */}
        <div className="flex w-full h-full">
          {/* Login form — left half */}
          <div
            className="w-1/2 h-full flex items-center justify-center p-10 lg:p-14 bg-background transition-all duration-[400ms]"
            style={{
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              opacity: isLogin ? 1 : 0,
              transform: isLogin ? "translateX(0)" : "translateX(-30px)",
              transitionDelay: isLogin ? "150ms" : "0ms",
              pointerEvents: isLogin ? "auto" : "none",
            }}
          >
            <div className="w-full max-w-[400px]">
              <LoginForm
                onSwitchToRegister={() => switchTo("register")}
                redirectTo={redirectTo}
              />
            </div>
          </div>

          {/* Register form — right half */}
          <div
            className="w-1/2 h-full overflow-y-auto flex items-start justify-center p-10 lg:p-14 bg-background transition-all duration-[400ms]"
            style={{
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              opacity: isLogin ? 0 : 1,
              transform: isLogin ? "translateX(30px)" : "translateX(0)",
              transitionDelay: isLogin ? "0ms" : "150ms",
              pointerEvents: isLogin ? "none" : "auto",
            }}
          >
            <div className="w-full max-w-[400px] py-8">
              <RegisterForm
                onSwitchToLogin={() => switchTo("login")}
                redirectTo={redirectTo}
                initialRole={roleParam === "professional" ? "professional" : undefined}
              />
            </div>
          </div>
        </div>

        {/* Branding overlay — slides from right (login) to left (register) */}
        <div
          className="absolute top-0 w-1/2 h-full z-10 transition-transform duration-[500ms]"
          style={{
            transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
            transform: isLogin ? "translateX(100%)" : "translateX(0%)",
          }}
        >
          <AuthLeftPanel locale={locale} />
        </div>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageInner />
    </Suspense>
  )
}
