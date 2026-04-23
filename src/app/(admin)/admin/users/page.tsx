import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/shared/pagination";
import { UsersFilters } from "./_components/users-filters";
import { UsersTable } from "./_components/users-table";
import { UsersHeader } from "./_components/users-header";

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{
    role?: string;
    status?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params.page ?? "1"));
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Main filtered query
  let query = supabase
    .from("users")
    .select("id, first_name, last_name, email, role, status, created_at, avatar_url, phone, language", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.role && params.role !== "all") {
    query = query.eq("role", params.role);
  }
  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.search) {
    query = query.or(
      `first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,email.ilike.%${params.search}%`
    );
  }

  // Fetch data + breakdown counts in parallel
  const [
    { data: users, count },
    { count: patientCount },
    { count: proCount },
    { count: adminCount },
    { count: activeCount },
    { count: suspendedCount },
  ] = await Promise.all([
    query,
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "patient"),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "professional"),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin"),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("status", "suspended"),
  ]);

  const totalUsers = (patientCount ?? 0) + (proCount ?? 0) + (adminCount ?? 0);

  // For each user, fetch role-specific data
  const enrichedUsers = await Promise.all(
    (users ?? []).map(async (u) => {
      const row: Record<string, unknown> = { ...u };
      if (u.role === "professional") {
        const { data: pro } = await supabase
          .from("professionals")
          .select("specialty, registration_number, consultation_fee, bio, languages_spoken, address, city, postal_code")
          .eq("user_id", u.id)
          .maybeSingle();
        if (pro) Object.assign(row, pro);
      }
      if (u.role === "patient") {
        const { data: pat } = await supabase
          .from("patients")
          .select("insurance_provider, address, city")
          .eq("user_id", u.id)
          .maybeSingle();
        if (pat) Object.assign(row, pat);
      }
      return row;
    })
  );

  return (
    <div className="space-y-5">
      <UsersHeader
        total={totalUsers}
        patients={patientCount ?? 0}
        professionals={proCount ?? 0}
        admins={adminCount ?? 0}
        active={activeCount ?? 0}
        suspended={suspendedCount ?? 0}
      />

      <UsersFilters totalCount={count ?? 0} />
      <UsersTable data={enrichedUsers as never[]} currentUserId={user?.id} />
      <Pagination total={count ?? 0} pageSize={PAGE_SIZE} />
    </div>
  );
}
