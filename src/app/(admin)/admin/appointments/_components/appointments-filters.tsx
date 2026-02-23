"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/shared/search-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AppointmentsFilters() {
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

  function setQuickPeriod(period: "today" | "week" | "month") {
    const params = new URLSearchParams(searchParams.toString());
    const today = new Date();
    const from = new Date(today);

    params.set("from", today.toISOString().slice(0, 10));

    if (period === "today") {
      params.set("to", today.toISOString().slice(0, 10));
    } else if (period === "week") {
      const end = new Date(today);
      end.setDate(end.getDate() + 6);
      params.set("to", end.toISOString().slice(0, 10));
    } else {
      from.setDate(1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      params.set("from", from.toISOString().slice(0, 10));
      params.set("to", end.toISOString().slice(0, 10));
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="rounded-lg bg-muted/20 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Pesquisar paciente ou profissional..." />
        <Select
          defaultValue={searchParams.get("status") ?? "all"}
          onValueChange={(value) => updateParam("status", value)}
        >
          <SelectTrigger className="w-[160px]" aria-label="Filtrar por estado">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estados</SelectItem>
            <SelectItem value="scheduled">Agendada</SelectItem>
            <SelectItem value="confirmed">Confirmada</SelectItem>
            <SelectItem value="completed">Concluida</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
            <SelectItem value="no_show">Falta</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          defaultValue={searchParams.get("from") ?? ""}
          onChange={(e) => updateParam("from", e.target.value)}
          className="w-[160px]"
          aria-label="Data inicial"
        />
        <Input
          type="date"
          defaultValue={searchParams.get("to") ?? ""}
          onChange={(e) => updateParam("to", e.target.value)}
          className="w-[160px]"
          aria-label="Data final"
        />
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickPeriod("today")}
          >
            Hoje
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickPeriod("week")}
          >
            Esta Semana
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQuickPeriod("month")}
          >
            Este Mes
          </Button>
        </div>
      </div>
    </div>
  );
}
