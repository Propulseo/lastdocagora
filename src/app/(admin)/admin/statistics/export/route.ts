import { NextRequest, NextResponse } from "next/server";
import { fetchStatisticsData, type PeriodRange, PERIOD_OPTIONS } from "../_lib/queries";
import { escapeCell } from "@/lib/export-csv";

const SEP = ";";
const BOM = "\uFEFF";

function line(cells: string[]): string {
  return cells.map(escapeCell).join(SEP);
}

type ExportLang = "pt" | "fr" | "en";

function isExportLang(value: string): value is ExportLang {
  return value === "pt" || value === "fr" || value === "en";
}

const ADMIN_LABELS: Record<ExportLang, {
  indicator: string;
  value: string;
  totalUsers: string;
  totalPatients: string;
  newPatients: string;
  totalProfessionals: string;
  verifiedPros: string;
  pendingPros: string;
  totalAppointments: string;
  periodAppointments: string;
  activityRate: string;
  completionRate: string;
  attendanceRate: string;
  cancellationRate: string;
  noShowRate: string;
  growthSection: string;
  date: string;
  patients: string;
  professionals: string;
  activitySection: string;
  confirmed: string;
  cancelled: string;
  noShow: string;
  specialtiesSection: string;
  specialty: string;
  count: string;
  topProsSection: string;
  name: string;
  city: string;
  appointments: string;
  rating: string;
}> = {
  pt: {
    indicator: "Indicador",
    value: "Valor",
    totalUsers: "Total utilizadores",
    totalPatients: "Total pacientes",
    newPatients: "Novos pacientes (período)",
    totalProfessionals: "Total profissionais",
    verifiedPros: "Profissionais verificados",
    pendingPros: "Profissionais pendentes",
    totalAppointments: "Total consultas",
    periodAppointments: "Consultas (período)",
    activityRate: "Taxa de atividade",
    completionRate: "Taxa de conclusão",
    attendanceRate: "Taxa de presença",
    cancellationRate: "Taxa de cancelamento",
    noShowRate: "Taxa de no-show",
    growthSection: "--- Crescimento ---",
    date: "Data",
    patients: "Pacientes",
    professionals: "Profissionais",
    activitySection: "--- Atividade ---",
    confirmed: "Confirmadas",
    cancelled: "Canceladas",
    noShow: "No-show",
    specialtiesSection: "--- Especialidades ---",
    specialty: "Especialidade",
    count: "Quantidade",
    topProsSection: "--- Top Profissionais ---",
    name: "Nome",
    city: "Cidade",
    appointments: "Consultas",
    rating: "Avaliação",
  },
  fr: {
    indicator: "Indicateur",
    value: "Valeur",
    totalUsers: "Total utilisateurs",
    totalPatients: "Total patients",
    newPatients: "Nouveaux patients (période)",
    totalProfessionals: "Total professionnels",
    verifiedPros: "Professionnels vérifiés",
    pendingPros: "Professionnels en attente",
    totalAppointments: "Total consultations",
    periodAppointments: "Consultations (période)",
    activityRate: "Taux d'activité",
    completionRate: "Taux de complétion",
    attendanceRate: "Taux de présence",
    cancellationRate: "Taux d'annulation",
    noShowRate: "Taux de no-show",
    growthSection: "--- Croissance ---",
    date: "Date",
    patients: "Patients",
    professionals: "Professionnels",
    activitySection: "--- Activité ---",
    confirmed: "Confirmées",
    cancelled: "Annulées",
    noShow: "No-show",
    specialtiesSection: "--- Spécialités ---",
    specialty: "Spécialité",
    count: "Quantité",
    topProsSection: "--- Top Professionnels ---",
    name: "Nom",
    city: "Ville",
    appointments: "Consultations",
    rating: "Note",
  },
  en: {
    indicator: "Indicator",
    value: "Value",
    totalUsers: "Total users",
    totalPatients: "Total patients",
    newPatients: "New patients (period)",
    totalProfessionals: "Total professionals",
    verifiedPros: "Verified professionals",
    pendingPros: "Pending professionals",
    totalAppointments: "Total appointments",
    periodAppointments: "Appointments (period)",
    activityRate: "Activity rate",
    completionRate: "Completion rate",
    attendanceRate: "Attendance rate",
    cancellationRate: "Cancellation rate",
    noShowRate: "No-show rate",
    growthSection: "--- Growth ---",
    date: "Date",
    patients: "Patients",
    professionals: "Professionals",
    activitySection: "--- Activity ---",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    noShow: "No-show",
    specialtiesSection: "--- Specialties ---",
    specialty: "Specialty",
    count: "Count",
    topProsSection: "--- Top Professionals ---",
    name: "Name",
    city: "City",
    appointments: "Appointments",
    rating: "Rating",
  },
};

export async function GET(request: NextRequest) {
  const range = request.nextUrl.searchParams.get("range") as PeriodRange;
  if (!PERIOD_OPTIONS.includes(range)) {
    return NextResponse.json({ error: "Invalid range" }, { status: 400 });
  }

  const langParam = request.nextUrl.searchParams.get("lang") || "pt";
  const lang: ExportLang = isExportLang(langParam) ? langParam : "pt";
  const l = ADMIN_LABELS[lang];

  const data = await fetchStatisticsData(range);

  const lines: string[] = [
    // KPIs
    line([l.indicator, l.value]),
    line([l.totalUsers, String(data.kpis.totalUsers)]),
    line([l.totalPatients, String(data.kpis.totalPatients)]),
    line([l.newPatients, String(data.kpis.newPatients)]),
    line([l.totalProfessionals, String(data.kpis.totalProfessionals)]),
    line([l.verifiedPros, String(data.kpis.verifiedPros)]),
    line([l.pendingPros, String(data.kpis.pendingPros)]),
    line([l.totalAppointments, String(data.kpis.totalAppointments)]),
    line([l.periodAppointments, String(data.kpis.periodAppointments)]),
    line([l.activityRate, `${data.kpis.activityRate}%`]),
    line([l.completionRate, `${data.kpis.completionRate}%`]),
    line([l.attendanceRate, `${data.rates.attendance}%`]),
    line([l.cancellationRate, `${data.rates.cancellation}%`]),
    line([l.noShowRate, `${data.rates.noShow}%`]),
    "",
    // Growth
    line([l.growthSection]),
    line([l.date, l.patients, l.professionals]),
    ...data.growth.map((g) =>
      line([g.date, String(g.patients), String(g.professionals)]),
    ),
    "",
    // Activity
    line([l.activitySection]),
    line([l.date, l.confirmed, l.cancelled, l.noShow]),
    ...data.activity.map((a) =>
      line([a.date, String(a.confirmed), String(a.cancelled), String(a.noShow)]),
    ),
    "",
    // Top specialties
    line([l.specialtiesSection]),
    line([l.specialty, l.count]),
    ...data.topSpecialties.map((s) => line([s.specialty, String(s.count)])),
    "",
    // Top professionals
    line([l.topProsSection]),
    line([l.name, l.specialty, l.city, l.appointments, l.rating]),
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
