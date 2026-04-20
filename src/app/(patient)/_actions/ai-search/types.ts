import type { ProfessionalResult } from "@/app/(patient)/patient/search/_components/professional-card"
import type { Json } from "@/lib/supabase/types"

export type DetectedLang = "FR" | "EN" | "PT"

export type AISearchSuccess =
  | {
      type: "clarification"
      message: string
      suggested_options?: string[]
      lang: DetectedLang
    }
  | {
      type: "search"
      message: string
      professionals: ProfessionalResult[]
      lang: DetectedLang
      debug?: string
      requested_date?: string
      fallback_level?: 1 | 2 | 3 | 4
    }

export type AISearchResponse =
  | { success: true; data: AISearchSuccess }
  | { success: false; error: string }

export interface ProfessionalRow {
  id: string
  specialty: string
  subspecialties: string[] | null
  city: string | null
  neighborhood: string | null
  address: string | null
  postal_code: string | null
  cabinet_name: string | null
  consultation_fee: number | null
  languages_spoken: string[] | null
  insurances_accepted: string[] | null
  third_party_payment: boolean | null
  years_experience: number | null
  practice_type: string | null
  rating: number | null
  total_reviews: number | null
  bio: string | null
  bio_pt: string | null
  bio_fr: string | null
  bio_en: string | null
  accessibility_options: Json | null
  latitude: number | null
  longitude: number | null
  users: { first_name: string | null; last_name: string | null; avatar_url?: string | null } | null
}
