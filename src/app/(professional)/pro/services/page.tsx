import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { getProfessionalI18n } from "@/lib/i18n/pro/server";
import { ServicesTable, type ServiceRow } from "./_components/services-table";
import { CreateServiceDialog } from "./_components/create-service-dialog";

export default async function ServicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) redirect("/login");

  const { t } = await getProfessionalI18n();

  const { data: services } = await supabase
    .from("services")
    .select("id, name, description, duration_minutes, consultation_type, is_active")
    .eq("professional_id", professional.id)
    .order("name", { ascending: true });

  const allServices: ServiceRow[] = (services ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    duration_minutes: s.duration_minutes,
    consultation_type: s.consultation_type,
    is_active: s.is_active,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.services.title}
        description={t.services.description}
        action={<CreateServiceDialog />}
      />
      <ServicesTable services={allServices} />
    </div>
  );
}
