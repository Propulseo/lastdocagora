"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useLandingTranslations } from "@/locales/landing-locale-context"
import { getSpecialtyOptions } from "@/locales/patient/specialties"
import { cn } from "@/lib/utils"

const CITIES = [
  "Lisboa",
  "Porto",
  "Coimbra",
  "Braga",
  "Faro",
  "Aveiro",
  "Funchal",
  "Setubal",
  "Viseu",
  "Leiria",
  "Evora",
  "Guimaraes",
]

export function HeroSearchBar() {
  const router = useRouter()
  const { t, locale } = useLandingTranslations()

  const [specialty, setSpecialty] = useState("")
  const [specialtyLabel, setSpecialtyLabel] = useState("")
  const [city, setCity] = useState("")
  const [cityLabel, setCityLabel] = useState("")
  const [specialtyOpen, setSpecialtyOpen] = useState(false)
  const [cityOpen, setCityOpen] = useState(false)

  const [pillToday, setPillToday] = useState(false)
  const [pillDirect, setPillDirect] = useState(false)
  const [pillTeleconsult, setPillTeleconsult] = useState(false)

  const specialtyOptions = useMemo(() => getSpecialtyOptions(locale), [locale])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (specialty) params.set("specialty", specialty)
    if (city) params.set("city", city)
    router.push(`/patient/search?${params.toString()}`)
  }

  return (
    <div className="w-full">
      {/* Search bar */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-2 shadow-lg dark:bg-zinc-900 sm:flex-row sm:items-center">
        {/* Specialty input */}
        <Popover open={specialtyOpen} onOpenChange={setSpecialtyOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-12 flex-1 items-center gap-2 rounded-xl border px-4 text-left text-sm text-zinc-500 transition-colors hover:border-[#0891B2]/40 focus:outline-none focus:ring-2 focus:ring-[#0891B2]/20 dark:border-zinc-700 sm:basis-[60%]"
            >
              <Search className="size-4 shrink-0 text-zinc-400" />
              <span className={cn(specialtyLabel ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-400")}>
                {specialtyLabel || t.hero.searchSpecialtyPlaceholder}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
            <Command>
              <CommandInput placeholder={t.hero.searchSpecialtyPlaceholder} />
              <CommandList>
                <CommandEmpty>-</CommandEmpty>
                <CommandGroup>
                  {specialtyOptions.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      value={opt.label}
                      onSelect={() => {
                        setSpecialty(opt.value)
                        setSpecialtyLabel(opt.label)
                        setSpecialtyOpen(false)
                      }}
                    >
                      {opt.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* City input */}
        <Popover open={cityOpen} onOpenChange={setCityOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-12 items-center gap-2 rounded-xl border px-4 text-left text-sm transition-colors hover:border-[#0891B2]/40 focus:outline-none focus:ring-2 focus:ring-[#0891B2]/20 dark:border-zinc-700 sm:basis-[25%]"
            >
              <span className={cn(cityLabel ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-400")}>
                {cityLabel || t.hero.searchCityPlaceholder}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandInput placeholder={t.hero.searchCityPlaceholder} />
              <CommandList>
                <CommandEmpty>-</CommandEmpty>
                <CommandGroup>
                  {CITIES.map((c) => (
                    <CommandItem
                      key={c}
                      value={c}
                      onSelect={() => {
                        setCity(c)
                        setCityLabel(c)
                        setCityOpen(false)
                      }}
                    >
                      {c}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Search button */}
        <Button
          onClick={handleSearch}
          className="h-12 rounded-xl bg-[#0891B2] px-8 text-white hover:bg-[#0891B2]/90 sm:basis-auto"
        >
          <Search className="mr-2 size-4" />
          {t.hero.searchButton}
        </Button>
      </div>

      {/* Filter pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPillToday(!pillToday)}
          className={cn(
            "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
            pillToday
              ? "border-[#0891B2] bg-[#0891B2]/10 text-[#0891B2]"
              : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
          )}
        >
          {t.hero.pillToday}
        </button>
        <button
          type="button"
          onClick={() => setPillDirect(!pillDirect)}
          className={cn(
            "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
            pillDirect
              ? "border-[#0891B2] bg-[#0891B2]/10 text-[#0891B2]"
              : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
          )}
        >
          {t.hero.pillDirectPayment}
        </button>
        <button
          type="button"
          onClick={() => setPillTeleconsult(!pillTeleconsult)}
          className={cn(
            "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
            pillTeleconsult
              ? "border-[#0891B2] bg-[#0891B2]/10 text-[#0891B2]"
              : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
          )}
        >
          {t.hero.pillTeleconsultation}
        </button>
      </div>
    </div>
  )
}
