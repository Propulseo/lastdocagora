import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { ProfessionalsFilters } from "./_components/professionals-filters";
import { ProfessionalsTable } from "./_components/professionals-table";

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{
    status?: string;
    specialty?: string;
    city?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function ProfessionalsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params.page ?? "1"));
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("professionals")
    .select(
      "id, specialty, city, rating, total_reviews, verification_status, user_id, users!professionals_user_id_fkey(first_name, last_name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.status && params.status !== "all") {
    query = query.eq("verification_status", params.status);
  }
  if (params.specialty && params.specialty !== "all") {
    query = query.eq("specialty", params.specialty);
  }
  if (params.city && params.city !== "all") {
    query = query.eq("city", params.city);
  }
  if (params.search) {
    query = query.or(
      `users.first_name.ilike.%${params.search}%,users.last_name.ilike.%${params.search}%`
    );
  }

  const { data: professionals, count } = await query;

  // Get distinct specialties and cities for filter options
  const [{ data: specialtyRows }, { data: cityRows }] = await Promise.all([
    supabase.from("professionals").select("specialty").order("specialty"),
    supabase
      .from("professionals")
      .select("city")
      .not("city", "is", null)
      .order("city"),
  ]);

  const specialties = [
    ...new Set((specialtyRows ?? []).map((r) => r.specialty)),
  ];
  const cities = [
    ...new Set(
      (cityRows ?? []).map((r) => r.city).filter(Boolean) as string[]
    ),
  ];

  const mapped = (professionals ?? []).map((pro) => {
    const user = pro.users as unknown as {
      first_name: string;
      last_name: string;
    } | null;
    return {
      id: pro.id,
      name: user ? `${user.first_name} ${user.last_name}` : "—",
      specialty: pro.specialty,
      city: pro.city,
      rating: pro.rating,
      total_reviews: pro.total_reviews,
      verification_status: pro.verification_status ?? "pending",
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profissionais"
        description="Gerir profissionais e verificacoes"
      />

      <ProfessionalsFilters specialties={specialties} cities={cities} />
      <ProfessionalsTable data={mapped} />
      <Pagination total={count ?? 0} pageSize={PAGE_SIZE} />
    </div>
  );
}
