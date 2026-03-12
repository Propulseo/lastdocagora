import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  const rows = appointments ?? [];

  const headers = [
    "Date",
    "Time",
    "Status",
    "Price",
    "Service",
    "Duration (min)",
    "Created Via",
    "Attendance",
    "Late (min)",
  ];

  const csvLines = [headers.join(",")];

  for (const r of rows) {
    const serviceName =
      r.services && !Array.isArray(r.services) ? r.services.name : "-";
    const att =
      r.appointment_attendance &&
      Array.isArray(r.appointment_attendance) &&
      r.appointment_attendance.length > 0
        ? r.appointment_attendance[0]
        : null;

    csvLines.push(
      [
        escapeCsv(r.appointment_date),
        escapeCsv(r.appointment_time),
        escapeCsv(r.status),
        String(r.price ?? 0),
        escapeCsv(serviceName),
        String(r.duration_minutes),
        escapeCsv(r.created_via ?? "-"),
        escapeCsv(att?.status ?? "-"),
        String(att?.late_minutes ?? ""),
      ].join(","),
    );
  }

  const csv = csvLines.join("\n");
  const today = new Date().toISOString().split("T")[0];
  const filename = `docagora-stats-${range}-${today}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
