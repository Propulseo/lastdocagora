import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { csvResponse } from "@/lib/export-csv";

function getDateRange(
  range: string,
  year?: number,
): { from: string; to: string } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const selectedYear = year ?? currentYear;
  const isCurrentYear = selectedYear === currentYear;

  const toDate = isCurrentYear ? now : new Date(selectedYear, 11, 31);
  const to = toDate.toISOString().split("T")[0];

  const yearStart = new Date(selectedYear, 0, 1);
  let from: Date;
  switch (range) {
    case "90d": {
      from = new Date(toDate);
      from.setDate(from.getDate() - 89);
      break;
    }
    case "1y": {
      from = new Date(selectedYear, 0, 1);
      break;
    }
    case "7d": {
      from = new Date(toDate);
      from.setDate(from.getDate() - 6);
      break;
    }
    default: {
      from = new Date(toDate);
      from.setDate(from.getDate() - 29);
      break;
    }
  }

  if (from < yearStart) from = yearStart;

  return { from: from.toISOString().split("T")[0], to };
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

  const range = request.nextUrl.searchParams.get("range") || "30d";
  const serviceFilter = request.nextUrl.searchParams.get("service") || "";
  const channelFilter = request.nextUrl.searchParams.get("channel") || "";
  const yearParam = request.nextUrl.searchParams.get("year");
  const year = yearParam ? parseInt(yearParam, 10) : undefined;
  const { from, to } = getDateRange(range, year);

  let query = supabase
    .from("appointments")
    .select(
      `
      appointment_date,
      appointment_time,
      status,
      price,
      created_via,
      duration_minutes,
      services(name),
      appointment_attendance(status, late_minutes)
    `,
    )
    .eq("professional_id", professional.id)
    .gte("appointment_date", from)
    .lte("appointment_date", to)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });

  if (serviceFilter) query = query.eq("service_id", serviceFilter);
  if (channelFilter) query = query.eq("created_via", channelFilter);

  const { data: appointments } = await query;
  const rawRows = appointments ?? [];

  const headers = [
    "Data",
    "Hora",
    "Estado",
    "Preço (€)",
    "Serviço",
    "Duração (min)",
    "Origem",
    "Presença",
    "Atraso (min)",
  ];

  const rows = rawRows.map((r) => {
    const serviceName =
      r.services && !Array.isArray(r.services) ? r.services.name : "";
    const att =
      r.appointment_attendance &&
      Array.isArray(r.appointment_attendance) &&
      r.appointment_attendance.length > 0
        ? r.appointment_attendance[0]
        : null;

    const channelLabel =
      r.created_via === "walk_in"
        ? "Walk-in"
        : r.created_via === "manual"
          ? "Manual"
          : "Online";

    const attendanceLabel =
      att?.status === "present"
        ? "Presente"
        : att?.status === "absent"
          ? "Ausente"
          : att?.status === "late"
            ? "Atrasado"
            : att?.status === "waiting"
              ? "Em espera"
              : "";

    return [
      r.appointment_date,
      r.appointment_time,
      r.status,
      String(r.price ?? 0),
      serviceName,
      String(r.duration_minutes),
      channelLabel,
      attendanceLabel,
      att?.late_minutes != null ? String(att.late_minutes) : "",
    ];
  });

  return csvResponse(headers, rows, `docagora-estatisticas-${range}`);
}
