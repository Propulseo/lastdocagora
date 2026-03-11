import { createClient } from "@/lib/supabase/server";
import { getProfessionalId } from "@/lib/auth";
import { ServicesTable, type ServiceRow } from "./_components/services-table";
import { ProPageHeader } from "../../_components/pro-page-header";
import { CreateServiceDialog } from "./_components/create-service-dialog";

export default async function ServicesPage() {
  const professionalId = await getProfessionalId();

  const supabase = await createClient();

  const { data: services } = await supabase
    .from("services")
    .select("id, name, description, duration_minutes, consultation_type, is_active, price")
    .eq("professional_id", professionalId)
    .order("name", { ascending: true });

  const allServices: ServiceRow[] = (services ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    duration_minutes: s.duration_minutes,
    consultation_type: s.consultation_type,
    is_active: s.is_active ?? true,
    price: s.price,
  }));

  return (
    <div className="space-y-6">
      <ProPageHeader section="services" action={<CreateServiceDialog />} />
      <ServicesTable services={allServices} />
    </div>
  );
}
