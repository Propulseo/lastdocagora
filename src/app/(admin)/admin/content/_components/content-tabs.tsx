"use client";

import { useTransition } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/shared/empty-state";
import { toggleContentPublished } from "@/app/(admin)/_actions/admin-actions";
import { toast } from "sonner";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface ContentPage {
  id: string;
  slug: string;
  title_pt: string;
  is_published: boolean | null;
  updated_at: string | null;
}

interface Faq {
  id: string;
  question_pt: string;
  category: string | null;
  display_order: number | null;
  is_published: boolean | null;
}

interface ContentTabsProps {
  pages: ContentPage[];
  faqs: Faq[];
}

function PublishSwitch({
  type,
  id,
  published,
}: {
  type: "page" | "faq";
  id: string;
  published: boolean;
}) {
  const { t } = useAdminI18n();
  const [isPending, startTransition] = useTransition();

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      const result = await toggleContentPublished(type, id, checked);
      if (result.success) {
        toast.success(checked ? t.content.published : t.content.unpublished);
      } else {
        toast.error(result.error ?? t.common.errorUpdating);
      }
    });
  }

  return (
    <Switch
      defaultChecked={published}
      onCheckedChange={handleToggle}
      disabled={isPending}
      aria-label={published ? t.content.unpublishLabel : t.content.publishLabel}
    />
  );
}

export function ContentTabs({ pages, faqs }: ContentTabsProps) {
  const { t } = useAdminI18n();
  const dateLocale = t.common.dateLocale as "pt-PT" | "fr-FR";
  const publishedPages = pages.filter((p) => p.is_published).length;
  const publishedFaqs = faqs.filter((f) => f.is_published).length;

  return (
    <Tabs defaultValue="pages">
      <TabsList className="overflow-x-auto">
        <TabsTrigger value="pages" className="min-h-[44px] sm:min-h-0">
          {t.content.tabPages}
          <Badge variant="secondary" className="ml-2">
            {publishedPages}/{pages.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="faqs" className="min-h-[44px] sm:min-h-0">
          {t.content.tabFaqs}
          <Badge variant="secondary" className="ml-2">
            {publishedFaqs}/{faqs.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pages" className="mt-4">
        {pages.length > 0 ? (
          <>
            {/* Mobile card list */}
            <div className="space-y-2 sm:hidden">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="flex h-14 items-center gap-3 rounded-lg border px-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {page.title_pt}
                    </p>
                  </div>
                  <PublishSwitch
                    type="page"
                    id={page.id}
                    published={!!page.is_published}
                  />
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">{t.content.pagesSlug}</TableHead>
                    <TableHead scope="col">{t.content.pagesTitlePt}</TableHead>
                    <TableHead scope="col">
                      {t.content.pagesPublished}
                    </TableHead>
                    <TableHead scope="col">
                      {t.content.pagesUpdatedAt}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell className="font-mono text-sm">
                        {page.slug}
                      </TableCell>
                      <TableCell className="font-medium">
                        {page.title_pt}
                      </TableCell>
                      <TableCell>
                        <PublishSwitch
                          type="page"
                          id={page.id}
                          published={!!page.is_published}
                        />
                      </TableCell>
                      <TableCell>
                        {page.updated_at
                          ? new Date(page.updated_at).toLocaleDateString(
                              dateLocale
                            )
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <EmptyState
            title={t.content.pagesEmptyTitle}
            description={t.content.pagesEmptyDescription}
          />
        )}
      </TabsContent>

      <TabsContent value="faqs" className="mt-4">
        {faqs.length > 0 ? (
          <>
            {/* Mobile card list */}
            <div className="space-y-2 sm:hidden">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="flex items-center gap-3 rounded-lg border px-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium line-clamp-2">
                      {faq.question_pt}
                    </p>
                    {faq.category && (
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        {faq.category}
                      </Badge>
                    )}
                  </div>
                  <PublishSwitch
                    type="faq"
                    id={faq.id}
                    published={!!faq.is_published}
                  />
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">
                      {t.content.faqsQuestionPt}
                    </TableHead>
                    <TableHead scope="col">{t.content.faqsCategory}</TableHead>
                    <TableHead scope="col">{t.content.faqsOrder}</TableHead>
                    <TableHead scope="col">
                      {t.content.faqsPublished}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faqs.map((faq) => (
                    <TableRow key={faq.id}>
                      <TableCell className="max-w-md truncate font-medium">
                        {faq.question_pt}
                      </TableCell>
                      <TableCell>
                        {faq.category ? (
                          <Badge variant="outline">{faq.category}</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{faq.display_order ?? "—"}</TableCell>
                      <TableCell>
                        <PublishSwitch
                          type="faq"
                          id={faq.id}
                          published={!!faq.is_published}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <EmptyState
            title={t.content.faqsEmptyTitle}
            description={t.content.faqsEmptyDescription}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
