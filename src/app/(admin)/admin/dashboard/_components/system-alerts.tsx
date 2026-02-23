import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ShieldCheck, HeadphonesIcon } from "lucide-react";

export async function SystemAlerts() {
  const supabase = await createClient();

  const { count: pendingVerifications } = await supabase
    .from("professionals")
    .select("id", { count: "exact", head: true })
    .eq("verification_status", "pending");

  const { count: openTickets } = await supabase
    .from("support_tickets")
    .select("id", { count: "exact", head: true })
    .in("status", ["open", "in_progress"]);

  const alerts = [
    {
      show: (pendingVerifications ?? 0) > 0,
      icon: ShieldCheck,
      text: `${pendingVerifications} profissiona${pendingVerifications === 1 ? "l" : "is"} aguardam verificacao`,
      href: "/admin/professionals?status=pending",
    },
    {
      show: (openTickets ?? 0) > 0,
      icon: HeadphonesIcon,
      text: `${openTickets} ticket${openTickets === 1 ? "" : "s"} de suporte aberto${openTickets === 1 ? "" : "s"}`,
      href: "/admin/support",
    },
  ].filter((a) => a.show);

  if (alerts.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertCircle className="text-admin-warning size-4" />
          Alertas do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((alert) => (
          <Link
            key={alert.href}
            href={alert.href}
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
          >
            <alert.icon className="size-4 shrink-0" />
            {alert.text}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
