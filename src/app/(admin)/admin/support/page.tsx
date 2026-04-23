import { createClient } from "@/lib/supabase/server";
import { SupportClient } from "./_components/SupportClient";

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    type?: string;
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
  if (params.type && params.type !== "all") {
    if (params.type === "general") {
      query = query.or("ticket_type.is.null,ticket_type.neq.profile_change_request");
    } else {
      query = query.eq("ticket_type", params.type);
    }
  }
  if (params.search) {
    query = query.ilike("subject", `%${params.search}%`);
  }

  // Fetch data + status counts in parallel
  const [
    { data: tickets, count },
    { count: openCount },
    { count: inProgressCount },
    { count: awaitingCount },
    { count: resolvedCount },
    { count: closedCount },
  ] = await Promise.all([
    query,
    supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "open"),
    supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "in_progress"),
    supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "awaiting_confirmation"),
    supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "resolved"),
    supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("status", "closed"),
  ]);

  const totalTickets =
    (openCount ?? 0) +
    (inProgressCount ?? 0) +
    (awaitingCount ?? 0) +
    (resolvedCount ?? 0) +
    (closedCount ?? 0);

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
      totalTickets={totalTickets}
      openCount={openCount ?? 0}
      inProgressCount={inProgressCount ?? 0}
      awaitingCount={awaitingCount ?? 0}
      resolvedCount={resolvedCount ?? 0}
      closedCount={closedCount ?? 0}
    />
  );
}
