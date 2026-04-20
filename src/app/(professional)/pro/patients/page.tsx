import { createClient } from "@/lib/supabase/server";
import { getProfessionalId } from "@/lib/auth";
import { getProfessionalI18n } from "@/lib/i18n/pro/server";
import { PatientsClient } from "./_components/PatientsClient";
import {
  buildPatientMap,
  mapToPatientRows,
  buildPatientsKpi,
  buildAcquisitionTrends,
  buildInsuranceBreakdown,
  buildFrequencyDistribution,
  applyFilters,
  getUniqueInsuranceProviders,
} from "./_lib/aggregation";
import type { PatientsDashboardData, RawAppointmentRow, RawPatientRow } from "./_lib/types";

interface SearchParams {
  search?: string;
  status?: string;
  insurance?: string;
  sort?: string;
  page?: string;
}

const PAGE_SIZE = 20;

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const professionalId = await getProfessionalId();
  const supabase = await createClient();
  const { t } = await getProfessionalI18n();
  const insuranceLabels = t.patients.insuranceLabels as Record<string, string>;

  // Parallel queries
  const [{ data: ownedPatients }, { data: appointments }, { data: hiddenRows }] = await Promise.all([
    supabase
      .from("patients")
      .select(
        "id, first_name, last_name, email, phone, insurance_provider, date_of_birth, created_at, absence_count",
      )
      .eq("created_by_professional_id", professionalId),
    supabase
      .from("appointments")
      .select(
        `id, patient_id, appointment_date, status, price, service_id, created_via,
         patients(first_name, last_name, email, phone, insurance_provider, date_of_birth, created_at),
         services(name),
         appointment_attendance(status, late_minutes)`,
      )
      .eq("professional_id", professionalId)
      .order("appointment_date", { ascending: false }),
    (supabase.rpc as unknown as (fn: string, params: Record<string, string>) => Promise<{ data: unknown }>)("get_hidden_patient_ids", { p_professional_id: professionalId }),
  ]);

  // Build set of hidden patient IDs
  const hiddenIds = new Set(((hiddenRows ?? []) as { patient_id: string }[]).map((r) => r.patient_id));
  const now = new Date();

  // Build patient map
  const patientMap = buildPatientMap(
    (ownedPatients ?? []) as RawPatientRow[],
    (appointments ?? []) as unknown as RawAppointmentRow[],
  );

  // Backfill patient details from appointment joins for patients not in owned list
  for (const apt of (appointments ?? []) as unknown as (RawAppointmentRow & {
    patients?: { first_name: string | null; last_name: string | null; email: string | null; phone: string | null; insurance_provider: string | null; date_of_birth: string | null; created_at: string | null } | null;
  })[]) {
    if (!apt.patient_id || !apt.patients) continue;
    const entry = patientMap.get(apt.patient_id);
    if (entry && !entry.first_name) {
      entry.first_name = apt.patients.first_name;
      entry.last_name = apt.patients.last_name;
      entry.email = apt.patients.email;
      entry.phone = apt.patients.phone;
      entry.insurance_provider = apt.patients.insurance_provider;
      entry.date_of_birth = apt.patients.date_of_birth;
      entry.created_at = apt.patients.created_at;
    }
  }

  // Remove hidden patients from the map
  for (const id of hiddenIds) {
    patientMap.delete(id);
  }

  // Aggregation
  const kpi = buildPatientsKpi(patientMap, now);
  const acquisitionTrends = buildAcquisitionTrends(patientMap);
  const insuranceBreakdown = buildInsuranceBreakdown(patientMap, insuranceLabels);
  const frequencyDistribution = buildFrequencyDistribution(patientMap);

  // All patients as rows (pre-filter)
  const allPatients = mapToPatientRows(patientMap, now);
  const totalUnfiltered = allPatients.length;

  // Apply filters
  const filtered = applyFilters(allPatients, {
    search: params.search,
    status: params.status,
    insurance: params.insurance,
    sort: params.sort,
  });

  // Paginate
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const dashboardData: PatientsDashboardData = {
    kpi,
    acquisitionTrends,
    insuranceBreakdown,
    frequencyDistribution,
    patients: paginated,
    totalUnfiltered: filtered.length,
    filterOptions: {
      insuranceProviders: getUniqueInsuranceProviders(patientMap),
    },
  };

  return <PatientsClient data={dashboardData} />;
}
