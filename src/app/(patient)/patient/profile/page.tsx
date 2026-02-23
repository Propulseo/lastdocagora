import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  User,
  Mail,
  Phone,
  CalendarDays,
  MapPin,
  Droplets,
  AlertTriangle,
  Contact,
} from "lucide-react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { PageHeader } from "@/components/shared/page-header"
import { EditProfileForm } from "./_components/edit-profile-form"

const genderLabels: Record<string, string> = {
  male: "Masculino",
  female: "Feminino",
  other: "Outro",
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const [{ data: profile }, { data: patient }] = await Promise.all([
    supabase
      .from("users")
      .select("first_name, last_name, email, phone, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("patients")
      .select(
        `first_name, last_name, email, phone, date_of_birth, address, city,
         postal_code, blood_type, allergies, gender, avatar_url,
         emergency_contact_name, emergency_contact_phone,
         emergency_contact_relationship, medical_notes`
      )
      .eq("user_id", user.id)
      .single(),
  ])

  const firstName = patient?.first_name ?? profile?.first_name ?? ""
  const lastName = patient?.last_name ?? profile?.last_name ?? ""
  const initials =
    `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "P"

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meu Perfil"
        description="As suas informações pessoais e médicas."
        action={<EditProfileForm patient={patient} userId={user.id} />}
      />

      {/* Profile Header */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <Avatar size="lg">
            {(patient?.avatar_url ?? profile?.avatar_url) && (
              <AvatarImage
                src={patient?.avatar_url ?? profile?.avatar_url ?? ""}
                alt={`${firstName} ${lastName}`}
              />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">
              {firstName} {lastName}
            </h2>
            <p className="text-sm text-muted-foreground">
              {patient?.email ?? profile?.email ?? user.email}
            </p>
            {patient?.gender && (
              <Badge variant="secondary" className="mt-1">
                {genderLabels[patient.gender] ?? patient.gender}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5 text-primary" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={<Mail className="size-4" />}
              label="Email"
              value={patient?.email ?? profile?.email ?? "-"}
            />
            <InfoRow
              icon={<Phone className="size-4" />}
              label="Telefone"
              value={patient?.phone ?? profile?.phone ?? "-"}
            />
            <InfoRow
              icon={<CalendarDays className="size-4" />}
              label="Data de Nascimento"
              value={formatDate(patient?.date_of_birth)}
            />
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              Morada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={<MapPin className="size-4" />}
              label="Endereço"
              value={patient?.address ?? "-"}
            />
            <InfoRow
              icon={<MapPin className="size-4" />}
              label="Cidade"
              value={patient?.city ?? "-"}
            />
            <InfoRow
              icon={<MapPin className="size-4" />}
              label="Código Postal"
              value={patient?.postal_code ?? "-"}
            />
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="size-5 text-primary" />
              Informações Médicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={<Droplets className="size-4" />}
              label="Tipo de Sangue"
              value={patient?.blood_type ?? "-"}
            />
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="size-4" />
                <span>Alergias</span>
              </div>
              <div className="ml-6 mt-1">
                {patient?.allergies && patient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {patient.allergies.map((allergy, i) => (
                      <Badge key={i} variant="outline">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm">Nenhuma alergia registada</span>
                )}
              </div>
            </div>
            {patient?.medical_notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notas Médicas</p>
                <p className="mt-1 text-sm">{patient.medical_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Contact className="size-5 text-primary" />
              Contacto de Emergência
            </CardTitle>
            <CardDescription>
              Pessoa a contactar em caso de emergência
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={<User className="size-4" />}
              label="Nome"
              value={patient?.emergency_contact_name ?? "-"}
            />
            <InfoRow
              icon={<Phone className="size-4" />}
              label="Telefone"
              value={patient?.emergency_contact_phone ?? "-"}
            />
            <InfoRow
              icon={<Contact className="size-4" />}
              label="Relação"
              value={patient?.emergency_contact_relationship ?? "-"}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

function formatDate(date: string | null | undefined): string {
  if (!date) return "-"
  try { return format(new Date(date), "d 'de' MMMM 'de' yyyy", { locale: pt }) }
  catch { return date }
}
