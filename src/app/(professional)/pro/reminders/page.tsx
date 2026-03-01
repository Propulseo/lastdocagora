import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getProfessionalId } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n/server";
import { ProPageHeader } from "../../_components/pro-page-header";
import { RemindersClient } from "./_components/RemindersClient";

export default async function RemindersPage() {
  const [user, professionalId] = await Promise.all([
    getCurrentUser(),
    getProfessionalId(),
  ]);

  const supabase = await createClient();

  // Resolve locale for DB query (global templates are locale-filtered)
  const locale = await getServerLocale();

  // Compute current month boundaries (UTC)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

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

    // Global templates (filtered by user's locale)
    supabase
      .from("message_templates")
      .select("*")
      .eq("is_global", true)
      .eq("locale", locale)
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
  ]);

  // Merge: own first, then globals
  const templates = [...(ownTemplates ?? []), ...(globalTemplates ?? [])];

  return (
    <div className="space-y-6">
      <ProPageHeader section="reminders" />

      <RemindersClient
        professionalId={professionalId}
        professionalUserId={user!.id}
        initialRules={rules ?? []}
        initialTemplates={templates ?? []}
        initialNotifications={notifications ?? []}
        initialSettings={proSettings ?? null}
        kpiData={{
          sentThisMonth: sentResult.count ?? 0,
          deliveredCount: deliveredResult.count ?? 0,
          totalWithStatus: totalStatusResult.count ?? 0,
        }}
      />
    </div>
  );
}
