"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Search as SearchIcon, Loader2 } from "lucide-react"
import { getSpecialtyOptions } from "@/locales/patient/specialties"

type InsuranceProviderOption = { id: string; name: string; slug: string }

interface SearchFiltersProps {
  searchQuery: string
  onSearchQueryChange: (value: string) => void
  searchSpecialty: string
  onSearchSpecialtyChange: (value: string) => void
  searchCity: string
  onSearchCityChange: (value: string) => void
  searchInsurance: string
  onSearchInsuranceChange: (value: string) => void
  insuranceProviders?: InsuranceProviderOption[]
  isPending: boolean
  onSearch: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  locale: string
  t: Record<string, string>
}

export function SearchFilters({
  searchQuery,
  onSearchQueryChange,
  searchSpecialty,
  onSearchSpecialtyChange,
  searchCity,
  onSearchCityChange,
  searchInsurance,
  onSearchInsuranceChange,
  insuranceProviders,
  isPending,
  onSearch,
  onKeyDown,
  locale,
  t,
}: SearchFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t.namePlaceholder}
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyDown={onKeyDown}
              className="rounded-xl pl-9"
            />
          </div>
          <div className="w-full md:w-48">
            <Select value={searchSpecialty} onValueChange={onSearchSpecialtyChange}>
              <SelectTrigger className="w-full rounded-xl">
                <SelectValue placeholder={t.specialtyPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.specialtyAll}</SelectItem>
                {getSpecialtyOptions(locale).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48">
            <Input
              placeholder={t.cityPlaceholder}
              value={searchCity}
              onChange={(e) => onSearchCityChange(e.target.value)}
              onKeyDown={onKeyDown}
              className="rounded-xl"
            />
          </div>
          {insuranceProviders && insuranceProviders.length > 0 && (
            <div className="w-full md:w-48">
              <Select value={searchInsurance} onValueChange={onSearchInsuranceChange}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue placeholder={t.insuranceFilter} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.insuranceAll}</SelectItem>
                  {insuranceProviders.map((ins) => (
                    <SelectItem key={ins.slug} value={ins.slug}>{ins.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            className="min-h-[48px] gap-2 rounded-xl lg:min-h-0"
            onClick={onSearch}
            disabled={isPending}
          >
            {isPending
              ? <Loader2 className="size-4 animate-spin" />
              : <SearchIcon className="size-4" />
            }
            {t.searchButton}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
