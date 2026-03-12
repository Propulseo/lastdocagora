import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  buildPatientMap,
  mapToPatientRows,
  applyFilters,
} from "../_lib/aggregation";
import type { RawAppointmentRow, RawPatientRow } from "../_lib/types";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

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

  // Fetch data
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
    "Name",
    "Email",
    "Phone",
    "Insurance",
    "Status",
    "Last Appointment",
    "Total Appointments",
    "Attendance Rate",
  ];

  const csvLines = [headers.join(",")];

  for (const p of filtered) {
    csvLines.push(
      [
        escapeCsv(`${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()),
        escapeCsv(p.email ?? ""),
        escapeCsv(p.phone ?? ""),
        escapeCsv(p.insurance_provider ?? "none"),
        escapeCsv(p.status),
        escapeCsv(p.last_appointment ?? ""),
        String(p.total_appointments),
        p.attendance_rate !== null ? `${p.attendance_rate}%` : "",
      ].join(","),
    );
  }

  const csv = csvLines.join("\n");
  const today = new Date().toISOString().split("T")[0];
  const filename = `docagora-patients-${today}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
