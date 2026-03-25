"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface UsersFiltersProps {
  totalCount: number;
}

export function UsersFilters({ totalCount }: UsersFiltersProps) {
  const { t } = useAdminI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);

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

  const roleSelect = (
    <Select
      defaultValue={searchParams.get("role") ?? "all"}
      onValueChange={(value) => updateParam("role", value)}
    >
      <SelectTrigger className="w-full sm:w-[160px]" aria-label={t.users.roleFilter}>
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
  );

  const statusSelect = (
    <Select
      defaultValue={searchParams.get("status") ?? "all"}
      onValueChange={(value) => updateParam("status", value)}
    >
      <SelectTrigger
        className="w-full sm:w-[160px]"
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
  );

  return (
    <>
      {/* Desktop filters */}
      <div className="hidden sm:flex items-center gap-3 h-12">
        <SearchInput
          placeholder={t.users.searchPlaceholder}
          className="relative w-[240px]"
        />
        {roleSelect}
        {statusSelect}
        <span className="ml-auto text-[13px] text-muted-foreground">
          {t.users.totalCount.replace("{count}", String(totalCount))}
        </span>
      </div>

      {/* Mobile filters */}
      <div className="sm:hidden space-y-3">
        <div className="flex items-center gap-2">
          <SearchInput
            placeholder={t.users.searchPlaceholder}
            className="relative flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] shrink-0"
            onClick={() => setFilterOpen(true)}
          >
            <SlidersHorizontal className="size-4 mr-1.5" />
            {t.mobile.filterButton}
          </Button>
        </div>
        <span className="block text-[13px] text-muted-foreground">
          {t.users.totalCount.replace("{count}", String(totalCount))}
        </span>
      </div>

      {/* Mobile filter sheet */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="pb-8">
          <SheetHeader>
            <SheetTitle>{t.mobile.filterButton}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            {roleSelect}
            {statusSelect}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
