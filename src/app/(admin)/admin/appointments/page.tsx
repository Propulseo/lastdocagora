import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/shared/pagination";
import { AppointmentsFilters } from "./_components/appointments-filters";
import { AppointmentsTable } from "./_components/appointments-table";
import { AdminPageHeader } from "../../_components/admin-page-header";

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{
    status?: string;
    from?: string;
    to?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function AppointmentsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params.page ?? "1"));
  const rangeFrom = (currentPage - 1) * PAGE_SIZE;
  const rangeTo = rangeFrom + PAGE_SIZE - 1;

  // Swap dates if from > to
  let dateFrom = params.from;
  let dateTo = params.to;
  if (dateFrom && dateTo && dateFrom > dateTo) {
    [dateFrom, dateTo] = [dateTo, dateFrom];
  }

  const supabase = await createClient();

  // RGPD Art. 9 — Données de santé :
  // L'admin plateforme n'a pas accès aux données médicales des patients.
  // Affichage uniquement d'identifiants anonymisés.
  let query = supabase
    .from("appointments")
    .select(
      `id, patient_id, appointment_date, appointment_time, status, duration_minutes,
       professionals!appointments_professional_id_fkey(
         users!professionals_user_id_fkey(first_name, last_name, avatar_url)
       )`,
      { count: "exact" }
    )
    .order("appointment_date", { ascending: false })
    .range(rangeFrom, rangeTo);

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (dateFrom) {
    query = query.gte("appointment_date", dateFrom);
  }
  if (dateTo) {
    query = query.lte("appointment_date", dateTo);
  }

  const { data: appointments, count } = await query;

  const mapped = (appointments ?? []).map((apt) => {
    const proData = apt.professionals as unknown as {
      users: { first_name: string; last_name: string; avatar_url: string | null } | null;
    } | null;
    const proUser = proData?.users ?? null;

    // RGPD: anonymize patient — show only last 5 chars of ID
    const patientId = (apt as Record<string, unknown>).patient_id as string | null;
    const anonymizedPatient = patientId
      ? `Patient #${patientId.slice(-5)}`
      : "";

    return {
      id: apt.id,
      patient_name: anonymizedPatient,
      patient_avatar_url: null,
      professional_name: proUser
        ? `${proUser.first_name} ${proUser.last_name}`
        : "—",
      professional_avatar_url: proUser?.avatar_url ?? null,
      date: apt.appointment_date,
      time: apt.appointment_time.slice(0, 5),
      status: apt.status,
      duration_minutes: (apt as Record<string, unknown>).duration_minutes as number | null,
    };
  });

  const statusCounts = {
    total: mapped.length,
    confirmed: mapped.filter((r) => r.status === "confirmed").length,
    cancelled: mapped.filter((r) => r.status === "cancelled").length,
    pending: mapped.filter(
      (r) => r.status === "pending" || r.status === "scheduled"
    ).length,
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader section="appointments" />

      <AppointmentsFilters totalCount={count ?? 0} />
      <AppointmentsTable data={mapped} statusCounts={statusCounts} />
      <Pagination total={count ?? 0} pageSize={PAGE_SIZE} />
    </div>
  );
}
