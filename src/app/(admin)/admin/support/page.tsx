import { createClient } from "@/lib/supabase/server";
import { SupportClient } from "./_components/SupportClient";

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function SupportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params.page ?? "1"));
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  let query = supabase
    .from("support_tickets")
    .select(
      "id, subject, status, priority, updated_at, created_at, user_id, users!support_tickets_user_id_fkey(first_name, last_name, email, avatar_url)",
      { count: "exact" }
    )
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.priority && params.priority !== "all") {
    query = query.eq("priority", params.priority);
  }
  if (params.search) {
    query = query.ilike("subject", `%${params.search}%`);
  }

  const { data: tickets, count } = await query;

  const mapped = (tickets ?? []).map((t) => {
    const user = t.users as unknown as {
      first_name: string;
      last_name: string;
      email: string;
      avatar_url: string | null;
    } | null;
    return {
      id: t.id,
      subject: t.subject,
      status: t.status,
      priority: t.priority,
      updated_at: t.updated_at,
      created_at: t.created_at,
      user_email: user?.email ?? "\u2014",
      user_name: user ? `${user.first_name} ${user.last_name}` : "\u2014",
      user_avatar_url: user?.avatar_url ?? null,
    };
  });

  return (
    <SupportClient
      tickets={mapped}
      count={count ?? 0}
      pageSize={PAGE_SIZE}
    />
  );
}
