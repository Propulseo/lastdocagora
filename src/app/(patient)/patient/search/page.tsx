import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { MapPin, Star, Clock, Search as SearchIcon } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import {
  getProfessionalName, getProfessionalInitials,
} from "@/app/(patient)/_components/professional-name"

function formatSlotDate(slot: string): string {
  try {
    const date = new Date(slot)
    return date.toLocaleDateString("pt-PT", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    })
  } catch {
    return slot
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; specialty?: string; city?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const params = await searchParams
  const query = params.q ?? ""
  const specialtyFilter = params.specialty ?? ""
  const cityFilter = params.city ?? ""

  let profQuery = supabase
    .from("professionals")
    .select(
      `id, specialty, city, rating, total_reviews, consultation_fee, bio,
       users!professionals_user_id_fkey ( first_name, last_name, avatar_url )`
    )
    .eq("verification_status", "verified")
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
      return { ...prof, nextSlot: nextSlot as string | null }
    })
  )

  const { data: specialties } = await supabase
    .from("professionals")
    .select("specialty")
    .eq("verification_status", "verified")

  const uniqueSpecialties = [...new Set((specialties ?? []).map((s) => s.specialty))].sort()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pesquisar Profissionais"
        description="Encontre o profissional de saúde ideal para si."
      />

      {/* Search Filters */}
      <Card>
        <CardContent className="pt-6">
          <form className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" placeholder="Nome ou especialidade..." defaultValue={query} className="rounded-xl pl-9" />
            </div>
            <div className="w-full md:w-48">
              <Select name="specialty" defaultValue={specialtyFilter || undefined}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue placeholder="Especialidade" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueSpecialties.map((s) => (
                    <SelectItem key={s} value={s ?? ""}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Input name="city" placeholder="Cidade" defaultValue={cityFilter} className="rounded-xl" />
            </div>
            <Button type="submit" className="rounded-xl">
              <SearchIcon className="size-4" />
              Pesquisar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <p className="mb-4 text-sm text-muted-foreground">
          {profWithSlots.length} profissional(is) encontrado(s)
        </p>

        {profWithSlots.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {profWithSlots.map((prof) => {
              const profData = prof as {
                specialty?: string | null
                users?: { first_name?: string | null; last_name?: string | null } | null
              }
              return (
                <Card key={prof.id} className="flex flex-col transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-1 flex-col gap-4 pt-6">
                    <div className="flex items-start gap-3">
                      <Avatar size="lg">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getProfessionalInitials(profData)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{getProfessionalName(profData)}</p>
                        <Badge variant="secondary" className="mt-1">{prof.specialty}</Badge>
                      </div>
                      {prof.rating != null && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="size-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{prof.rating.toFixed(1)}</span>
                          {prof.total_reviews != null && (
                            <span className="text-muted-foreground">({prof.total_reviews})</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      {prof.city && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="size-4 shrink-0" />
                          <span>{prof.city}</span>
                        </div>
                      )}
                      {prof.nextSlot && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Clock className="size-4 shrink-0" />
                          <span>Próximo horário: {formatSlotDate(prof.nextSlot)}</span>
                        </div>
                      )}
                      {prof.consultation_fee != null && (
                        <p className="text-sm font-medium">
                          A partir de {prof.consultation_fee.toFixed(2)} EUR
                        </p>
                      )}
                      {prof.bio && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">{prof.bio}</p>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link href={`/patient/search/${prof.id}`}>Ver perfil</Link>
                      </Button>
                      <Button size="sm" className="flex-1" asChild>
                        <Link href={`/patient/search/${prof.id}#booking`}>Reservar</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={SearchIcon}
            title="Nenhum profissional encontrado"
            description="Tente alterar os filtros de pesquisa para encontrar profissionais de saúde."
            action={
              <Button asChild>
                <Link href="/patient/search">Limpar filtros</Link>
              </Button>
            }
          />
        )}
      </div>
    </div>
  )
}
