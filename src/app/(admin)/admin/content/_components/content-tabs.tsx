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
  const [isPending, startTransition] = useTransition();

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      const result = await toggleContentPublished(type, id, checked);
      if (result.success) {
        toast.success(checked ? "Publicado" : "Despublicado");
      } else {
        toast.error(result.error ?? "Erro ao atualizar");
      }
    });
  }

  return (
    <Switch
      defaultChecked={published}
      onCheckedChange={handleToggle}
      disabled={isPending}
      aria-label={published ? "Despublicar" : "Publicar"}
    />
  );
}

export function ContentTabs({ pages, faqs }: ContentTabsProps) {
  const publishedPages = pages.filter((p) => p.is_published).length;
  const publishedFaqs = faqs.filter((f) => f.is_published).length;

  return (
    <Tabs defaultValue="pages">
      <TabsList>
        <TabsTrigger value="pages">
          Paginas
          <Badge variant="secondary" className="ml-2">
            {publishedPages}/{pages.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="faqs">
          FAQs
          <Badge variant="secondary" className="ml-2">
            {publishedFaqs}/{faqs.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pages" className="mt-4">
        {pages.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Slug</TableHead>
                  <TableHead scope="col">Titulo (PT)</TableHead>
                  <TableHead scope="col">Publicada</TableHead>
                  <TableHead scope="col">Atualizada em</TableHead>
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
                        ? new Date(page.updated_at).toLocaleDateString("pt-PT")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="Nenhuma pagina encontrada"
            description="Nao existem paginas de conteudo na base de dados."
          />
        )}
      </TabsContent>

      <TabsContent value="faqs" className="mt-4">
        {faqs.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Pergunta (PT)</TableHead>
                  <TableHead scope="col">Categoria</TableHead>
                  <TableHead scope="col">Ordem</TableHead>
                  <TableHead scope="col">Publicada</TableHead>
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
        ) : (
          <EmptyState
            title="Nenhuma FAQ encontrada"
            description="Nao existem FAQs na base de dados."
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
