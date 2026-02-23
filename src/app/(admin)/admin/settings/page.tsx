import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SettingsForm } from "./_components/settings-form";

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
      <PageHeader
        title="Configuracoes"
        description="Definicoes do sistema da plataforma"
      />

      {items.length > 0 ? (
        <SettingsForm groups={groups} />
      ) : (
        <EmptyState
          title="Nenhuma configuracao encontrada"
          description="Nao existem configuracoes na base de dados."
        />
      )}
    </div>
  );
}
