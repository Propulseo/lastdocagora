import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  UserCircle,
  MapPin,
  Globe,
  Stethoscope,
  DollarSign,
  Star,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: userProfile }, { data: professional }] = await Promise.all([
    supabase
      .from("users")
      .select("first_name, last_name, email, phone, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("professionals")
      .select("*")
      .eq("user_id", user.id)
      .single(),
  ]);

  if (!professional || !userProfile) redirect("/login");

  const initials =
    (userProfile.first_name?.[0] ?? "") + (userProfile.last_name?.[0] ?? "");

  const fields = [
    {
      section: "Informacoes Pessoais",
      icon: UserCircle,
      items: [
        {
          label: "Nome",
          value: `${userProfile.first_name} ${userProfile.last_name}`,
        },
        { label: "Email", value: userProfile.email },
        { label: "Telefone", value: userProfile.phone ?? "Nao definido" },
      ],
    },
    {
      section: "Informacoes Profissionais",
      icon: Stethoscope,
      items: [
        { label: "Especialidade", value: professional.specialty },
        {
          label: "Numero de Registo",
          value: professional.registration_number,
        },
        {
          label: "Tipo de Pratica",
          value: professional.practice_type ?? "Nao definido",
        },
        {
          label: "Nome do Consultorio",
          value: professional.cabinet_name ?? "Nao definido",
        },
        {
          label: "Anos de Experiencia",
          value: professional.years_experience?.toString() ?? "Nao definido",
        },
        {
          label: "Subespecialidades",
          value: professional.subspecialties?.join(", ") ?? "Nenhuma",
        },
      ],
    },
    {
      section: "Localizacao",
      icon: MapPin,
      items: [
        {
          label: "Morada",
          value: professional.address ?? "Nao definida",
        },
        { label: "Cidade", value: professional.city ?? "Nao definida" },
        {
          label: "Codigo Postal",
          value: professional.postal_code ?? "Nao definido",
        },
      ],
    },
    {
      section: "Tarifas",
      icon: DollarSign,
      items: [
        {
          label: "Valor da Consulta",
          value: professional.consultation_fee
            ? `${professional.consultation_fee.toFixed(2)} \u20ac`
            : "Nao definido",
        },
        {
          label: "Pagamento Terceiros",
          value: professional.third_party_payment ? "Sim" : "Nao",
        },
        {
          label: "Seguros Aceites",
          value: professional.insurances_accepted?.join(", ") ?? "Nenhum",
        },
      ],
    },
    {
      section: "Idiomas",
      icon: Globe,
      items: [
        {
          label: "Idiomas Falados",
          value: professional.languages_spoken?.join(", ") ?? "Nao definido",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with avatar */}
      <div className="flex items-center gap-5">
        <Avatar className="size-16">
          <AvatarImage
            src={userProfile.avatar_url ?? undefined}
            alt={userProfile.first_name}
          />
          <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
            {initials || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {userProfile.first_name} {userProfile.last_name}
            </h1>
            <StatusBadge type="verification" value={professional.verification_status ?? "pending"} />
          </div>
          <p className="text-sm text-muted-foreground">
            {professional.specialty}
            {professional.cabinet_name && ` \u2014 ${professional.cabinet_name}`}
          </p>
        </div>
      </div>

      {/* Rating + Bio */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-xl bg-amber-50 p-2.5">
              <Star className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {professional.rating?.toFixed(1) ?? "-"}
              </p>
              <p className="text-xs text-muted-foreground">
                {professional.total_reviews ?? 0} avaliacao
                {(professional.total_reviews ?? 0) !== 1 ? "oes" : ""}
              </p>
            </div>
          </CardContent>
        </Card>

        {professional.bio && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {professional.bio}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Profile sections */}
      {fields.map((section) => (
        <Card key={section.section}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <section.icon className="size-4 text-muted-foreground" />
              {section.section}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {section.items.map((item, idx) => (
                <div key={item.label}>
                  {idx > 0 && <Separator className="mb-3" />}
                  <div className="flex justify-between gap-4">
                    <span className="shrink-0 text-sm text-muted-foreground">
                      {item.label}
                    </span>
                    <span className="text-right text-sm font-medium">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
