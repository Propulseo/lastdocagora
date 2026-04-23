import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/shared/pagination";
import { ProfessionalsFilters } from "./_components/professionals-filters";
import { ProfessionalsTable } from "./_components/professionals-table";
import { ProfessionalsHeader } from "./_components/professionals-header";

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
      "id, specialty, city, rating, total_reviews, verification_status, user_id, registration_number, consultation_fee, bio, languages_spoken, address, postal_code, users!professionals_user_id_fkey(first_name, last_name, avatar_url)",
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

  // Fetch data + breakdown counts + filter options in parallel
  const [
    { data: professionals, count },
    { count: verifiedCount },
    { count: pendingCount },
    { count: rejectedCount },
    { data: specialtyRows },
    { data: cityRows },
  ] = await Promise.all([
    query,
    supabase
      .from("professionals")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "verified"),
    supabase
      .from("professionals")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "pending"),
    supabase
      .from("professionals")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "rejected"),
    supabase.from("professionals").select("specialty").order("specialty"),
    supabase
      .from("professionals")
      .select("city")
      .not("city", "is", null)
      .order("city"),
  ]);

  const totalPros = (verifiedCount ?? 0) + (pendingCount ?? 0) + (rejectedCount ?? 0);

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
      avatar_url: string | null;
    } | null;
    return {
      id: pro.id,
      user_id: pro.user_id,
      name: user ? `${user.first_name} ${user.last_name}` : "—",
      avatar_url: user?.avatar_url ?? null,
      specialty: pro.specialty,
      city: pro.city,
      rating: pro.rating,
      total_reviews: pro.total_reviews,
      verification_status: pro.verification_status ?? "pending",
      registration_number: (pro as Record<string, unknown>).registration_number as string | null,
      consultation_fee: (pro as Record<string, unknown>).consultation_fee as number | null,
      bio: (pro as Record<string, unknown>).bio as string | null,
      languages_spoken: (pro as Record<string, unknown>).languages_spoken as string[] | null,
      address: (pro as Record<string, unknown>).address as string | null,
      postal_code: (pro as Record<string, unknown>).postal_code as string | null,
    };
  });

  return (
    <div className="space-y-5">
      <ProfessionalsHeader
        total={totalPros}
        verified={verifiedCount ?? 0}
        pending={pendingCount ?? 0}
        rejected={rejectedCount ?? 0}
        specialtyCount={specialties.length}
        cityCount={cities.length}
      />

      <ProfessionalsFilters specialties={specialties} cities={cities} totalCount={count ?? 0} />
      <ProfessionalsTable data={mapped} />
      <Pagination total={count ?? 0} pageSize={PAGE_SIZE} />
    </div>
  );
}
