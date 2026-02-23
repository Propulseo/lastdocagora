"use client";

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
import { X } from "lucide-react";

interface ProfessionalsFiltersProps {
  specialties: string[];
  cities: string[];
}

export function ProfessionalsFilters({
  specialties,
  cities,
}: ProfessionalsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hasFilters =
    searchParams.has("status") ||
    searchParams.has("specialty") ||
    searchParams.has("city") ||
    searchParams.has("search");

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

  function clearFilters() {
    router.push(pathname);
  }

  return (
    <div className="rounded-lg bg-muted/20 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Pesquisar por nome..." />
        <Select
          defaultValue={searchParams.get("status") ?? "all"}
          onValueChange={(value) => updateParam("status", value)}
        >
          <SelectTrigger className="w-[160px]" aria-label="Filtrar por estado">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estados</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="verified">Verificado</SelectItem>
            <SelectItem value="rejected">Rejeitado</SelectItem>
          </SelectContent>
        </Select>
        <Select
          defaultValue={searchParams.get("specialty") ?? "all"}
          onValueChange={(value) => updateParam("specialty", value)}
        >
          <SelectTrigger className="w-[180px]" aria-label="Filtrar por especialidade">
            <SelectValue placeholder="Especialidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as especialidades</SelectItem>
            {specialties.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          defaultValue={searchParams.get("city") ?? "all"}
          onValueChange={(value) => updateParam("city", value)}
        >
          <SelectTrigger className="w-[160px]" aria-label="Filtrar por cidade">
            <SelectValue placeholder="Cidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as cidades</SelectItem>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="size-4" />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
