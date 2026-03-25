import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { SearchContent } from "./_components/SearchContent"

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; specialty?: string; city?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const supabase = await createClient()

  const params = await searchParams
  const query = params.q ?? ""
  const specialtyFilter = params.specialty ?? ""
  const cityFilter = params.city ?? ""

  let profQuery = supabase
    .from("professionals")
    .select(
      `id, specialty, subspecialties, city, neighborhood, address, postal_code,
       cabinet_name, consultation_fee, languages_spoken, insurances_accepted,
       third_party_payment, years_experience, practice_type, rating, total_reviews,
       bio, accessibility_options, latitude, longitude,
       users!professionals_user_id_fkey ( first_name, last_name, avatar_url )`
    )
    .order("rating", { ascending: false, nullsFirst: false })
    .limit(20)

  if (specialtyFilter) profQuery = profQuery.ilike("specialty", `%${specialtyFilter}%`)
  if (cityFilter) profQuery = profQuery.ilike("city", `%${cityFilter}%`)

  const { data: professionals } = await profQuery

  let filteredProfessionals = professionals ?? []
  if (query) {
    const lowerQuery = query.toLowerCase()
    filteredProfessionals = filteredProfessionals.filter((prof) => {
      const u = prof.users as { first_name?: string; last_name?: string } | null
      const fullName = `${u?.first_name ?? ""} ${u?.last_name ?? ""}`.toLowerCase()
      return fullName.includes(lowerQuery) || (prof.specialty ?? "").toLowerCase().includes(lowerQuery)
    })
  }

  const profWithSlots = await Promise.all(
    filteredProfessionals.map(async (prof) => {
      const { data: nextSlot } = await supabase.rpc("get_next_available_slot", {
        p_professional_id: prof.id,
      })
      return {
        id: prof.id,
        specialty: prof.specialty as string | null,
        subspecialties: prof.subspecialties as string[] | null,
        city: prof.city as string | null,
        neighborhood: prof.neighborhood as string | null,
        address: prof.address as string | null,
        postal_code: prof.postal_code as string | null,
        cabinet_name: prof.cabinet_name as string | null,
        consultation_fee: prof.consultation_fee as number | null,
        languages_spoken: prof.languages_spoken as string[] | null,
        insurances_accepted: prof.insurances_accepted as string[] | null,
        third_party_payment: prof.third_party_payment as boolean | null,
        years_experience: prof.years_experience as number | null,
        practice_type: prof.practice_type as string | null,
        rating: prof.rating as number | null,
        total_reviews: prof.total_reviews as number | null,
        bio: prof.bio as string | null,
        accessibility_options: prof.accessibility_options as Record<string, unknown> | null,
        latitude: prof.latitude as number | null,
        longitude: prof.longitude as number | null,
        nextSlot: nextSlot as string | null,
        users: prof.users as { first_name: string | null; last_name: string | null; avatar_url?: string | null } | null,
      }
    })
  )

  return (
    <SearchContent
      professionals={profWithSlots}
      query={query}
      specialtyFilter={specialtyFilter}
      cityFilter={cityFilter}
    />
  )
}
