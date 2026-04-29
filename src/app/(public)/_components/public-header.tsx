"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { LanguageSwitcher } from "@/components/shared/language-switcher"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { useLandingTranslations } from "@/locales/landing-locale-context"
import { cn } from "@/lib/utils"

export function PublicHeader() {
  const { t, locale } = useLandingTranslations()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-50 h-16 border-b border-zinc-200 bg-white transition-shadow duration-200 dark:border-zinc-800 dark:bg-zinc-950",
        scrolled && "shadow-sm"
      )}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="DocAgora" width={480} height={320} className="h-20 w-auto" priority />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher locale={locale} />
          <ThemeToggle size="sm" lightLabel={t.header.lightMode} darkLabel={t.header.darkMode} />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">{t.header.login}</Link>
          </Button>
          <Button
            size="sm"
            className="bg-[#0891B2] text-white hover:bg-[#0891B2]/90"
            asChild
          >
            <Link href="/login?role=professional#register">
              {t.header.proCta} &rarr;
            </Link>
          </Button>
        </div>

        {/* Mobile nav */}
        <div className="flex items-center gap-2 md:hidden">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">{t.header.login}</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-9">
                <Menu className="size-5" />
                <span className="sr-only">{t.header.menuOpen}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col gap-6 pt-8">
                <Link href="/">
                  <Image src="/logo.png" alt="DocAgora" width={480} height={320} className="h-16 w-auto" />
                </Link>

                <nav className="flex flex-col gap-4">
                  <SheetClose asChild>
                    <Link
                      href="/login"
                      className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                    >
                      {t.header.login}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/login#register"
                      className="text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                    >
                      {t.header.register}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/login?role=professional#register"
                      className="text-sm font-medium text-[#0891B2] hover:text-[#0891B2]/80"
                    >
                      {t.header.proCta} &rarr;
                    </Link>
                  </SheetClose>
                </nav>

                <div className="flex items-center justify-between border-t pt-4">
                  <span className="text-sm text-muted-foreground">{t.header.theme}</span>
                  <ThemeToggle size="sm" lightLabel={t.header.lightMode} darkLabel={t.header.darkMode} />
                </div>

                <div className="pt-4">
                  <LanguageSwitcher locale={locale} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
