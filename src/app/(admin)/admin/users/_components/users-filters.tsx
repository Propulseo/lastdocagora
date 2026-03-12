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

interface UsersFiltersProps {
  totalCount: number;
}

export function UsersFilters({ totalCount }: UsersFiltersProps) {
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
    <div className="flex items-center gap-3 h-12">
      <SearchInput
        placeholder={t.users.searchPlaceholder}
        className="relative w-[240px]"
      />
      <Select
        defaultValue={searchParams.get("role") ?? "all"}
        onValueChange={(value) => updateParam("role", value)}
      >
        <SelectTrigger className="w-[160px]" aria-label={t.users.roleFilter}>
          <SelectValue placeholder={t.users.roleFilter} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.users.allRoles}</SelectItem>
          <SelectItem value="patient">{t.statuses.role.patient}</SelectItem>
          <SelectItem value="professional">
            {t.statuses.role.professional}
          </SelectItem>
          <SelectItem value="admin">{t.statuses.role.admin}</SelectItem>
        </SelectContent>
      </Select>
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
          <SelectItem value="active">
            {t.statuses.userStatus.active}
          </SelectItem>
          <SelectItem value="inactive">
            {t.statuses.userStatus.inactive}
          </SelectItem>
          <SelectItem value="suspended">
            {t.statuses.userStatus.suspended}
          </SelectItem>
        </SelectContent>
      </Select>
      <span className="ml-auto text-[13px] text-muted-foreground">
        {t.users.totalCount.replace("{count}", String(totalCount))}
      </span>
    </div>
  );
}
