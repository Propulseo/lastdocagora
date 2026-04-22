"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  total: number;
  pageSize: number;
}

export function Pagination({ total, pageSize }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page") ?? "1");
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, total);

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  if (total <= pageSize) return null;

  return (
    <div className="flex items-center justify-between gap-4 pt-2">
      <p className="text-muted-foreground text-sm tabular-nums">
        {from}–{to} / {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          asChild={currentPage > 1}
          aria-label="Pagina anterior"
        >
          {currentPage > 1 ? (
            <Link href={buildHref(currentPage - 1)}>
              <ChevronLeft className="size-4" />
              Anterior
            </Link>
          ) : (
            <span>
              <ChevronLeft className="size-4" />
              Anterior
            </span>
          )}
        </Button>
        <span className="text-sm font-medium tabular-nums text-muted-foreground">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          asChild={currentPage < totalPages}
          aria-label="Proxima pagina"
        >
          {currentPage < totalPages ? (
            <Link href={buildHref(currentPage + 1)}>
              Seguinte
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span>
              Seguinte
              <ChevronRight className="size-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
