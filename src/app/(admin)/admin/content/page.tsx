import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { ContentTabs } from "./_components/content-tabs";

export default async function ContentPage() {
  const supabase = await createClient();

  const [{ data: pages }, { data: faqs }] = await Promise.all([
    supabase
      .from("content_pages")
      .select("id, slug, title_pt, is_published, updated_at")
      .order("slug"),
    supabase
      .from("faqs")
      .select("id, question_pt, category, display_order, is_published")
      .order("display_order", { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conteudo"
        description="Gerir paginas e perguntas frequentes"
      />
      <ContentTabs pages={pages ?? []} faqs={faqs ?? []} />
    </div>
  );
}
