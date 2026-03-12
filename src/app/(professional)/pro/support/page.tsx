import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SupportClient } from "./_components/SupportClient";

export default async function ProSupportPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "professional") redirect("/login");

  const supabase = await createClient();

  const [
    { data: tickets },
    { data: ticketsWithMessages },
    { count: totalCount },
    { count: openCount },
    { count: resolvedCount },
  ] = await Promise.all([
    supabase
      .from("support_tickets")
      .select(
        "id, subject, description, status, priority, created_at, updated_at"
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("support_tickets")
      .select("id, ticket_messages(sender_id, created_at)")
      .eq("user_id", user.id)
      .order("created_at", {
        referencedTable: "ticket_messages",
        ascending: false,
      })
      .limit(1, { referencedTable: "ticket_messages" }),
    supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["open", "in_progress"]),
    supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "resolved"),
  ]);

  const unreadTicketIds = new Set<string>();
  if (ticketsWithMessages) {
    for (const t of ticketsWithMessages) {
      const msgs = t.ticket_messages as {
        sender_id: string | null;
        created_at: string;
      }[];
      if (msgs?.length > 0 && msgs[0].sender_id !== user.id) {
        unreadTicketIds.add(t.id);
      }
    }
  }

  const sorted = [...(tickets ?? [])].sort((a, b) => {
    const aUnread = unreadTicketIds.has(a.id) ? 1 : 0;
    const bUnread = unreadTicketIds.has(b.id) ? 1 : 0;
    if (aUnread !== bUnread) return bUnread - aUnread;
    return (
      new Date(b.updated_at ?? b.created_at ?? 0).getTime() -
      new Date(a.updated_at ?? a.created_at ?? 0).getTime()
    );
  });

  return (
    <SupportClient
      tickets={sorted}
      unreadIds={Array.from(unreadTicketIds)}
      userId={user.id}
      kpi={{
        total: totalCount ?? 0,
        open: openCount ?? 0,
        resolved: resolvedCount ?? 0,
      }}
    />
  );
}
