import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Stethoscope, FileText, Star } from "lucide-react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { EmptyState } from "@/components/shared/empty-state"
import {
  getProfessionalName,
  getProfessionalInitials,
} from "@/app/(patient)/_components/professional-name"
import { CancelDialog } from "./_components/cancel-dialog"
import Link from "next/link"

type Appointment = {
  id: string; appointment_date: string; appointment_time: string
  status: string; consultation_type: string; duration_minutes: number | null
  price: number | null; notes: string | null; cancellation_reason: string | null
  professionals: { specialty: string | null; users: { first_name: string | null; last_name: string | null } | null } | null
  services: { name: string | null } | null
}

const selectFields = `id, appointment_date, appointment_time, status, consultation_type, duration_minutes, notes, price, cancellation_reason, professionals!appointments_professional_id_fkey ( specialty, users!professionals_user_id_fkey ( first_name, last_name ) ), services ( name )`

export default async function AppointmentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const today = new Date().toISOString().split("T")[0]

  const [upcomingRes, pastRes, cancelledRes] = await Promise.all([
    supabase
      .from("appointments")
      .select(selectFields)
      .eq("patient_user_id", user.id)
      .gte("appointment_date", today)
      .in("status", ["confirmed", "pending"])
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true }),
    supabase
      .from("appointments")
      .select(selectFields)
      .eq("patient_user_id", user.id)
      .in("status", ["completed", "no_show"])
      .order("appointment_date", { ascending: false })
      .limit(20),
    supabase
      .from("appointments")
      .select(selectFields)
      .eq("patient_user_id", user.id)
      .eq("status", "cancelled")
      .order("cancelled_at", { ascending: false, nullsFirst: false })
      .limit(20),
  ])

  const upcoming = (upcomingRes.data ?? []) as Appointment[]
  const past = (pastRes.data ?? []) as Appointment[]
  const cancelled = (cancelledRes.data ?? []) as Appointment[]

  // Fetch existing ratings for past appointments
  const pastIds = past.map((a) => a.id)
  const { data: ratings } = pastIds.length
    ? await supabase
        .from("appointment_ratings")
        .select("appointment_id")
        .in("appointment_id", pastIds)
    : { data: [] }

  const ratedIds = new Set((ratings ?? []).map((r) => r.appointment_id))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minhas Consultas"
        description="Gerir as suas consultas médicas."
      />

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">
            Próximas ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Passadas ({past.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Canceladas ({cancelled.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {upcoming.length > 0 ? (
            <div className="space-y-4">
              {upcoming.map((appt) => (
                <AppointmentCard key={appt.id} appointment={appt} type="upcoming" />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="Sem consultas agendadas"
              description="Não tem consultas médicas próximas."
              action={
                <Button asChild>
                  <Link href="/patient/search">Agendar Consulta</Link>
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {past.length > 0 ? (
            <div className="space-y-4">
              {past.map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appointment={appt}
                  type="past"
                  hasRating={ratedIds.has(appt.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="Sem consultas passadas"
              description="Ainda não tem consultas concluídas."
            />
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-4">
          {cancelled.length > 0 ? (
            <div className="space-y-4">
              {cancelled.map((appt) => (
                <AppointmentCard key={appt.id} appointment={appt} type="cancelled" />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="Nenhuma consulta cancelada"
              description="Não tem consultas canceladas."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AppointmentCard({
  appointment: appt,
  type,
  hasRating,
}: {
  appointment: Appointment
  type: "upcoming" | "past" | "cancelled"
  hasRating?: boolean
}) {
  const profName = getProfessionalName(appt.professionals)
  const profInitials = getProfessionalInitials(appt.professionals)

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          <Avatar size="lg" className="hidden sm:flex">
            <AvatarFallback>{profInitials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium">{profName}</h3>
              <StatusBadge type="appointment" value={appt.status} />
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="size-4" />
                {format(new Date(appt.appointment_date), "d 'de' MMMM 'de' yyyy", {
                  locale: pt,
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" />
                {appt.appointment_time?.slice(0, 5)}
                {appt.duration_minutes && ` (${appt.duration_minutes} min)`}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {appt.professionals?.specialty && (
                <span className="flex items-center gap-1.5">
                  <Stethoscope className="size-4" />
                  {appt.professionals.specialty}
                </span>
              )}
              {appt.services?.name && (
                <span className="flex items-center gap-1.5">
                  <FileText className="size-4" />
                  {appt.services.name}
                </span>
              )}
            </div>
            {appt.cancellation_reason && (
              <p className="text-sm text-destructive">
                Motivo: {appt.cancellation_reason}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {appt.price != null && (
            <p className="text-lg font-semibold">{appt.price.toFixed(2)} EUR</p>
          )}
          {type === "upcoming" && (
            <CancelDialog appointmentId={appt.id} professionalName={profName} />
          )}
          {type === "past" && appt.status === "completed" && !hasRating && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/patient/appointments/${appt.id}/rate`}>
                <Star className="size-4" />
                Avaliar
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
