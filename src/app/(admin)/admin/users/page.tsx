import { createClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/shared/pagination";
import { UsersFilters } from "./_components/users-filters";
import { UsersTable } from "./_components/users-table";
import { AdminPageHeader } from "../../_components/admin-page-header";

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

  let query = supabase
    .from("users")
    .select("id, first_name, last_name, email, role, status, created_at, avatar_url", {
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

  const { data: users, count } = await query;

  return (
    <div className="space-y-6">
      <AdminPageHeader section="users" />

      <UsersFilters totalCount={count ?? 0} />
      <UsersTable data={(users ?? []) as never[]} currentUserId={user?.id} />
      <Pagination total={count ?? 0} pageSize={PAGE_SIZE} />
    </div>
  );
}
