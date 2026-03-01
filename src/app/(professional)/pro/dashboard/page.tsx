import { createClient } from "@/lib/supabase/server";
import { getProfessionalId } from "@/lib/auth";
import { DashboardClient } from "./_components/DashboardClient";

export default async function DashboardPage() {
  const professionalId = await getProfessionalId();

  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const [
    { data: todayAppointments },
    { count: totalPatients },
    { count: pendingCount },
    { data: rateData },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, appointment_date, appointment_time, duration_minutes, status, consultation_type, notes, patients(first_name, last_name), services(name)"
      )
      .eq("professional_id", professionalId)
      .eq("appointment_date", today)
      .order("appointment_time", { ascending: true }),
    supabase
      .from("appointments")
      .select("patient_id", { count: "exact", head: true })
      .eq("professional_id", professionalId),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", professionalId)
      .eq("status", "pending"),
    supabase.rpc("calculate_attendance_rate", { prof_id: professionalId }),
  ]);

  const attendanceRate = rateData !== null ? Number(rateData) : 0;
  const appointments = (todayAppointments ?? []) as Array<{
    id: string;
    appointment_date: string | null;
    appointment_time: string | null;
    duration_minutes: number | null;
    status: string | null;
    consultation_type: string | null;
    notes: string | null;
    patients: { first_name: string | null; last_name: string | null } | null;
    services: { name: string } | null;
  }>;

  return (
    <DashboardClient
      todayAppointments={appointments}
      totalPatients={totalPatients ?? 0}
      pendingCount={pendingCount ?? 0}
      attendanceRate={attendanceRate}
    />
  );
}
