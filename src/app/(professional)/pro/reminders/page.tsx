import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getProfessionalId } from "@/lib/auth";
import { ProPageHeader } from "../../_components/pro-page-header";
import { RemindersClient } from "./_components/RemindersClient";
import type {
  RemindersKpiData,
  RemindersChartsData,
  NotificationTrendPoint,
  ChannelSlice,
  StatusSlice,
} from "./_types/reminders";

// Channel labels for charts
const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

export default async function RemindersPage() {
  const [user, professionalId] = await Promise.all([
    getCurrentUser(),
    getProfessionalId(),
  ]);

  const supabase = await createClient();

  // Compute current month boundaries (UTC)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  // Last 30 days for charts
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  const chartFrom = thirtyDaysAgo.toISOString().split("T")[0];
  const chartTo = now.toISOString().split("T")[0];

  // Fetch all data in parallel
  const [
    { data: rules },
    { data: ownTemplates },
    { data: globalTemplates },
    { data: notifications },
    { data: proSettings },
    sentResult,
    deliveredResult,
    totalStatusResult,
    { data: chartNotifications },
  ] = await Promise.all([
    // Reminder rules with template join
    supabase
      .from("reminder_rules")
      .select("*, message_templates(name, content, channel)")
      .eq("professional_id", professionalId)
      .order("created_at", { ascending: false }),

    // Own templates (any locale)
    supabase
      .from("message_templates")
      .select("*")
      .eq("professional_id", professionalId)
      .order("created_at", { ascending: false }),

    // Global templates (prefer user's locale, fallback to all)
    supabase
      .from("message_templates")
      .select("*")
      .eq("is_global", true)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),

    // Notification history (last 100)
    supabase
      .from("appointment_notifications")
      .select("*, appointments(appointment_date, patients(first_name, last_name))")
      .eq("professional_id", professionalId)
      .order("created_at", { ascending: false })
      .limit(100),

    // Professional settings
    supabase
      .from("professional_settings")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle(),

    // KPI: sent this month (status in sent/delivered)
    supabase
      .from("appointment_notifications")
      .select("*", { count: "exact", head: true })
      .eq("professional_id", professionalId)
      .in("status", ["sent", "delivered"])
      .gte("sent_at", monthStart)
      .lte("sent_at", monthEnd),

    // KPI: delivered this month
    supabase
      .from("appointment_notifications")
      .select("*", { count: "exact", head: true })
      .eq("professional_id", professionalId)
      .eq("status", "delivered")
      .gte("sent_at", monthStart)
      .lte("sent_at", monthEnd),

    // KPI: total with terminal status this month (for deliverability denominator)
    supabase
      .from("appointment_notifications")
      .select("*", { count: "exact", head: true })
      .eq("professional_id", professionalId)
      .in("status", ["sent", "delivered", "failed", "bounced"])
      .gte("sent_at", monthStart)
      .lte("sent_at", monthEnd),

    // Chart data: all notifications in last 30 days
    supabase
      .from("appointment_notifications")
      .select("created_at, status, channel")
      .eq("professional_id", professionalId)
      .gte("created_at", chartFrom + "T00:00:00")
      .lte("created_at", chartTo + "T23:59:59"),
  ]);

  // Merge: own first, then globals
  const templates = [...(ownTemplates ?? []), ...(globalTemplates ?? [])];

  // --- Build chart data ---
  const chartRows = chartNotifications ?? [];

  // Trends: daily sent/delivered/failed
  const trendMap = new Map<string, { sent: number; delivered: number; failed: number }>();
  const current = new Date(chartFrom + "T00:00:00");
  const end = new Date(chartTo + "T00:00:00");
  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    trendMap.set(dateStr, { sent: 0, delivered: 0, failed: 0 });
    current.setDate(current.getDate() + 1);
  }

  for (const n of chartRows) {
    const date = n.created_at.split("T")[0];
    const entry = trendMap.get(date);
    if (!entry) continue;
    if (n.status === "sent" || n.status === "delivered") entry.sent++;
    if (n.status === "delivered") entry.delivered++;
    if (n.status === "failed" || n.status === "bounced") entry.failed++;
  }

  const trends: NotificationTrendPoint[] = Array.from(trendMap.entries()).map(
    ([date, data]) => ({ date, ...data }),
  );

  // Channel breakdown
  const channelMap = new Map<string, number>();
  for (const n of chartRows) {
    channelMap.set(n.channel, (channelMap.get(n.channel) ?? 0) + 1);
  }
  const channelBreakdown: ChannelSlice[] = Array.from(channelMap.entries())
    .map(([channel, count]) => ({
      channel,
      label: CHANNEL_LABELS[channel] ?? channel,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Status breakdown
  const statusMap = new Map<string, number>();
  for (const n of chartRows) {
    statusMap.set(n.status, (statusMap.get(n.status) ?? 0) + 1);
  }
  const STATUS_LABELS: Record<string, string> = {
    pending: "Pending",
    sent: "Sent",
    delivered: "Delivered",
    failed: "Failed",
    bounced: "Bounced",
  };
  const statusBreakdown: StatusSlice[] = Array.from(statusMap.entries())
    .map(([status, count]) => ({
      status,
      label: STATUS_LABELS[status] ?? status,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const chartsData: RemindersChartsData = {
    trends,
    channelBreakdown,
    statusBreakdown,
  };

  // --- Build enhanced KPI data ---
  const rulesList = rules ?? [];
  const activeRulesCount = rulesList.filter((r) => r.is_enabled).length;
  const ownTpls = ownTemplates ?? [];
  const activeTemplatesCount = ownTpls.filter((t) => t.is_active).length;

  const kpiData: RemindersKpiData = {
    sentThisMonth: sentResult.count ?? 0,
    deliveredCount: deliveredResult.count ?? 0,
    totalWithStatus: totalStatusResult.count ?? 0,
    activeRulesCount,
    totalRulesCount: rulesList.length,
    activeTemplatesCount,
    ownTemplatesCount: ownTpls.length,
    noShowReduction: null, // Will be calculated when enough data
  };

  return (
    <div className="space-y-6">
      <ProPageHeader section="reminders" />

      <RemindersClient
        professionalId={professionalId}
        professionalUserId={user!.id}
        initialRules={rulesList}
        initialTemplates={templates}
        initialNotifications={notifications ?? []}
        initialSettings={proSettings ?? null}
        kpiData={kpiData}
        chartsData={chartsData}
      />
    </div>
  );
}
