import { NextRequest, NextResponse } from "next/server";
import { fetchStatisticsData, type PeriodRange, PERIOD_OPTIONS } from "../_lib/queries";
import { escapeCell } from "@/lib/export-csv";

const SEP = ";";
const BOM = "\uFEFF";

function line(cells: string[]): string {
  return cells.map(escapeCell).join(SEP);
}

export async function GET(request: NextRequest) {
  const range = request.nextUrl.searchParams.get("range") as PeriodRange;
  if (!PERIOD_OPTIONS.includes(range)) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  const data = await fetchStatisticsData(range);

  const lines: string[] = [
    // KPIs
    line(["Indicador", "Valor"]),
    line(["Total utilizadores", String(data.kpis.totalUsers)]),
    line(["Total pacientes", String(data.kpis.totalPatients)]),
    line(["Novos pacientes (período)", String(data.kpis.newPatients)]),
    line(["Total profissionais", String(data.kpis.totalProfessionals)]),
    line(["Profissionais verificados", String(data.kpis.verifiedPros)]),
    line(["Profissionais pendentes", String(data.kpis.pendingPros)]),
    line(["Total consultas", String(data.kpis.totalAppointments)]),
    line(["Consultas (período)", String(data.kpis.periodAppointments)]),
    line(["Taxa de atividade", `${data.kpis.activityRate}%`]),
    line(["Taxa de conclusão", `${data.kpis.completionRate}%`]),
    line(["Taxa de presença", `${data.rates.attendance}%`]),
    line(["Taxa de cancelamento", `${data.rates.cancellation}%`]),
    line(["Taxa de no-show", `${data.rates.noShow}%`]),
    "",
    // Growth
    line(["--- Crescimento ---"]),
    line(["Data", "Pacientes", "Profissionais"]),
    ...data.growth.map((g) =>
      line([g.date, String(g.patients), String(g.professionals)]),
    ),
    "",
    // Activity
    line(["--- Atividade ---"]),
    line(["Data", "Confirmadas", "Canceladas", "No-show"]),
    ...data.activity.map((a) =>
      line([a.date, String(a.confirmed), String(a.cancelled), String(a.noShow)]),
    ),
    "",
    // Top specialties
    line(["--- Especialidades ---"]),
    line(["Especialidade", "Quantidade"]),
    ...data.topSpecialties.map((s) => line([s.specialty, String(s.count)])),
    "",
    // Top professionals
    line(["--- Top Profissionais ---"]),
    line(["Nome", "Especialidade", "Cidade", "Consultas", "Avaliação"]),
    ...data.topProfessionals.map((p) =>
      line([
        p.name,
        p.specialty,
        p.city,
        String(p.appointmentCount),
        p.rating.toFixed(1),
      ]),
    ),
  ];

  const csv = BOM + lines.join("\r\n");
  const today = new Date().toISOString().split("T")[0];

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="docagora-estatisticas-admin-${range}_${today}.csv"`,
    },
  });
}
