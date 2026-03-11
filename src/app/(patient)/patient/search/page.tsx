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
      `id, specialty, city, rating, total_reviews, bio,
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
        city: prof.city as string | null,
        rating: prof.rating as number | null,
        total_reviews: prof.total_reviews as number | null,
        bio: prof.bio as string | null,
        nextSlot: nextSlot as string | null,
        users: prof.users as { first_name: string | null; last_name: string | null; avatar_url?: string | null } | null,
      }
    })
  )

  const { data: specialties } = await supabase
    .from("professionals")
    .select("specialty")

  const uniqueSpecialties = [...new Set((specialties ?? []).map((s) => s.specialty))].sort()

  return (
    <SearchContent
      professionals={profWithSlots}
      specialties={uniqueSpecialties}
      query={query}
      specialtyFilter={specialtyFilter}
      cityFilter={cityFilter}
    />
  )
}
