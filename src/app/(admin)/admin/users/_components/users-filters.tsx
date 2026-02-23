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

export function UsersFilters() {
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
    <div className="flex flex-wrap items-center gap-3">
      <SearchInput placeholder="Pesquisar por nome ou email..." />
      <Select
        defaultValue={searchParams.get("role") ?? "all"}
        onValueChange={(value) => updateParam("role", value)}
      >
        <SelectTrigger className="w-[160px]" aria-label="Filtrar por funcao">
          <SelectValue placeholder="Funcao" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as funcoes</SelectItem>
          <SelectItem value="patient">Paciente</SelectItem>
          <SelectItem value="professional">Profissional</SelectItem>
          <SelectItem value="admin">Administrador</SelectItem>
        </SelectContent>
      </Select>
      <Select
        defaultValue={searchParams.get("status") ?? "all"}
        onValueChange={(value) => updateParam("status", value)}
      >
        <SelectTrigger className="w-[160px]" aria-label="Filtrar por estado">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os estados</SelectItem>
          <SelectItem value="active">Ativo</SelectItem>
          <SelectItem value="inactive">Inativo</SelectItem>
          <SelectItem value="suspended">Suspenso</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
