"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/shared/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

export function SupportFilters() {
  const { t } = useAdminI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="rounded-lg bg-muted/20 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder={t.support.searchPlaceholder} />
        <Select
          defaultValue={searchParams.get("status") ?? "all"}
          onValueChange={(value) => updateParam("status", value)}
        >
          <SelectTrigger
            className="w-[160px]"
            aria-label={t.common.filterByStatus}
          >
            <SelectValue placeholder={t.common.status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.common.allStatuses}</SelectItem>
            <SelectItem value="open">{t.statuses.ticket.open}</SelectItem>
            <SelectItem value="in_progress">
              {t.statuses.ticket.in_progress}
            </SelectItem>
            <SelectItem value="resolved">
              {t.statuses.ticket.resolved}
            </SelectItem>
            <SelectItem value="closed">{t.statuses.ticket.closed}</SelectItem>
          </SelectContent>
        </Select>
        <Select
          defaultValue={searchParams.get("priority") ?? "all"}
          onValueChange={(value) => updateParam("priority", value)}
        >
          <SelectTrigger
            className="w-[160px]"
            aria-label={t.support.priorityFilter}
          >
            <SelectValue placeholder={t.support.priorityFilter} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.support.allPriorities}</SelectItem>
            <SelectItem value="low">{t.statuses.priority.low}</SelectItem>
            <SelectItem value="medium">
              {t.statuses.priority.medium}
            </SelectItem>
            <SelectItem value="high">{t.statuses.priority.high}</SelectItem>
            <SelectItem value="urgent">
              {t.statuses.priority.urgent}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
