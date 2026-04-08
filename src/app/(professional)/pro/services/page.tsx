import { createClient } from "@/lib/supabase/server";
import { getProfessionalId } from "@/lib/auth";
import { ServicesClient } from "./_components/ServicesClient";
import {
  buildServiceRows,
  buildServicesKpi,
  buildRevenuePerService,
  buildAppointmentVolume,
  applyServiceFilters,
  getUniqueConsultationTypes,
} from "./_lib/aggregation";
import type { ServicesDashboardData, RawServiceAppointment } from "./_lib/types";

interface SearchParams {
  search?: string;
  status?: string;
  sort?: string;
  page?: string;
}

const PAGE_SIZE = 20;

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const professionalId = await getProfessionalId();
  const supabase = await createClient();

  // Parallel queries: services + appointments for enrichment
  const [{ data: services }, { data: appointments }] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, name_pt, name_fr, name_en, description, description_pt, description_fr, description_en, duration_minutes, consultation_type, is_active, price")
      .eq("professional_id", professionalId)
      .order("name", { ascending: true }),
    supabase
      .from("appointments")
      .select("id, service_id, status, price")
      .eq("professional_id", professionalId),
  ]);

  // Build enriched service rows
  const allRows = buildServiceRows(
    services ?? [],
    (appointments ?? []) as RawServiceAppointment[],
  );

  // Aggregation
  const kpi = buildServicesKpi(allRows);
  const revenuePerService = buildRevenuePerService(allRows);
  const appointmentVolume = buildAppointmentVolume(allRows);
  // Apply filters
  const filtered = applyServiceFilters(allRows, {
    search: params.search,
    status: params.status,
    sort: params.sort,
  });

  // Paginate
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const dashboardData: ServicesDashboardData = {
    kpi,
    revenuePerService,
    appointmentVolume,
    services: paginated,
    totalFiltered: filtered.length,
    filterOptions: {
      consultationTypes: getUniqueConsultationTypes(allRows),
    },
  };

  return <ServicesClient data={dashboardData} />;
}
