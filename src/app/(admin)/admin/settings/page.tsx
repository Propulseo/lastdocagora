import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "../../_components/admin-page-header";
import { SettingsContent } from "./_components/settings-content";

interface Setting {
  id: string;
  setting_key: string;
  setting_value: unknown;
  description: string | null;
  updated_at: string | null;
}

export default async function SettingsPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from("system_settings")
    .select("id, setting_key, setting_value, description, updated_at")
    .order("setting_key");

  const items = (settings ?? []) as Setting[];

  // Group settings by key prefix
  const groups: Record<string, Setting[]> = {};
  for (const setting of items) {
    const prefix = setting.setting_key.split("_")[0] ?? "other";
    if (!groups[prefix]) groups[prefix] = [];
    groups[prefix].push(setting);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader section="settings" />
      <SettingsContent groups={groups} isEmpty={items.length === 0} />
    </div>
  );
}
