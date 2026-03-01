import { createClient } from "@/lib/supabase/server";
import { getProfessionalId } from "@/lib/auth";
import { PatientsTable, type PatientRow } from "./_components/patients-table";
import { ProPageHeader } from "../../_components/pro-page-header";
import { CreatePatientDialog } from "./_components/create-patient-dialog";

export default async function PatientsPage() {
  const professionalId = await getProfessionalId();

  const supabase = await createClient();

  // Fetch both sources in parallel
  const [{ data: ownedPatients }, { data: appointments }] = await Promise.all([
    supabase
      .from("patients")
      .select("id, first_name, last_name, email, phone")
      .eq("created_by_professional_id", professionalId),
    supabase
      .from("appointments")
      .select(
        "patient_id, appointment_date, patients(first_name, last_name, email, phone)"
      )
      .eq("professional_id", professionalId)
      .order("appointment_date", { ascending: false }),
  ]);

  // Merge both sources into a map
  const patientMap = new Map<string, PatientRow>();

  // Add owned patients first
  for (const p of ownedPatients ?? []) {
    patientMap.set(p.id, {
      patient_id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      email: p.email,
      phone: p.phone,
      last_appointment: null,
      total_appointments: 0,
    });
  }

  // Merge appointment data
  for (const apt of appointments ?? []) {
    if (!apt.patient_id) continue;
    const patient = apt.patients as {
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      phone: string | null;
    } | null;
    const existing = patientMap.get(apt.patient_id);
    if (existing) {
      existing.total_appointments += 1;
      if (
        !existing.last_appointment ||
        apt.appointment_date > existing.last_appointment
      ) {
        existing.last_appointment = apt.appointment_date;
      }
    } else {
      patientMap.set(apt.patient_id, {
        patient_id: apt.patient_id,
        first_name: patient?.first_name ?? null,
        last_name: patient?.last_name ?? null,
        email: patient?.email ?? null,
        phone: patient?.phone ?? null,
        last_appointment: apt.appointment_date,
        total_appointments: 1,
      });
    }
  }

  const patients = Array.from(patientMap.values()).sort((a, b) => {
    if (!a.last_appointment) return 1;
    if (!b.last_appointment) return -1;
    return b.last_appointment.localeCompare(a.last_appointment);
  });

  return (
    <div className="space-y-6">
      <ProPageHeader section="patients" action={<CreatePatientDialog />} />
      <PatientsTable patients={patients} />
    </div>
  );
}
