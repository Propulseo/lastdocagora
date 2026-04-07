import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildPatientMap,
  mapToPatientRows,
  applyFilters,
} from "../_lib/aggregation";
import type { RawAppointmentRow, RawPatientRow } from "../_lib/types";
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
  const insurance = searchParams.get("insurance") || "";
  const sort = searchParams.get("sort") || "last";

  const [{ data: ownedPatients }, { data: appointments }] = await Promise.all([
    supabase
      .from("patients")
      .select(
        "id, first_name, last_name, email, phone, insurance_provider, date_of_birth, created_at",
      )
      .eq("created_by_professional_id", professional.id),
    supabase
      .from("appointments")
      .select(
        `id, patient_id, appointment_date, status, price, service_id, created_via,
         services(name),
         appointment_attendance(status, late_minutes)`,
      )
      .eq("professional_id", professional.id)
      .order("appointment_date", { ascending: false }),
  ]);

  const now = new Date();
  const patientMap = buildPatientMap(
    (ownedPatients ?? []) as RawPatientRow[],
    (appointments ?? []) as unknown as RawAppointmentRow[],
  );
  const allPatients = mapToPatientRows(patientMap, now);
  const filtered = applyFilters(allPatients, { search, status, insurance, sort });

  const headers = [
    "Nome",
    "Email",
    "Telefone",
    "Seguro",
    "Estado",
    "Última consulta",
    "Total consultas",
    "Taxa presença (%)",
  ];

  const rows = filtered.map((p) => [
    `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
    p.email ?? "",
    p.phone ?? "",
    p.insurance_provider ?? "",
    p.status,
    p.last_appointment ?? "",
    String(p.total_appointments),
    p.attendance_rate !== null ? `${p.attendance_rate}%` : "",
  ]);

  return csvResponse(headers, rows, "docagora-pacientes");
}
