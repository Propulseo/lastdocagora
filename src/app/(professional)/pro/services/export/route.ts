import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildServiceRows, applyServiceFilters } from "../_lib/aggregation";
import type { RawServiceAppointment } from "../_lib/types";
import { csvResponse } from "@/lib/export-csv";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const sort = searchParams.get("sort") || "name";

  const [{ data: services }, { data: appointments }] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, description, duration_minutes, consultation_type, is_active, price")
      .eq("professional_id", professional.id)
      .order("name", { ascending: true }),
    supabase
      .from("appointments")
      .select("id, service_id, status, price")
      .eq("professional_id", professional.id),
  ]);

  const allRows = buildServiceRows(
    services ?? [],
    (appointments ?? []) as RawServiceAppointment[],
  );
  const filtered = applyServiceFilters(allRows, { search, status, sort });

  const headers = [
    "Nome",
    "Descrição",
    "Duração (min)",
    "Preço (€)",
    "Estado",
    "Tipo consulta",
    "Total consultas",
    "Receita total (€)",
  ];

  const rows = filtered.map((s) => [
    s.name,
    s.description ?? "",
    String(s.duration_minutes),
    String(s.price),
    s.is_active ? "Ativo" : "Inativo",
    s.consultation_type,
    String(s.total_appointments),
    String(s.total_revenue),
  ]);

  return csvResponse(headers, rows, "docagora-servicos");
}
