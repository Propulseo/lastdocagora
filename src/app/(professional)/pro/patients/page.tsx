import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Search, UserX } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

interface PatientRow {
  patient_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  last_appointment: string | null;
  total_appointments: number;
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) redirect("/login");

  const { data: appointments } = await supabase
    .from("appointments")
    .select(
      "patient_id, appointment_date, patients(first_name, last_name, email, phone)"
    )
    .eq("professional_id", professional.id)
    .order("appointment_date", { ascending: false });

  const patientMap = new Map<string, PatientRow>();
  for (const apt of appointments ?? []) {
    const patient = apt.patients as {
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      phone: string | null;
    } | null;
    const existing = patientMap.get(apt.patient_id);
    if (existing) {
      existing.total_appointments += 1;
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

  let patients = Array.from(patientMap.values());

  const query = params.q?.toLowerCase().trim();
  if (query) {
    patients = patients.filter((p) => {
      const fullName =
        `${p.first_name ?? ""} ${p.last_name ?? ""}`.toLowerCase();
      return fullName.includes(query);
    });
  }

  patients.sort((a, b) => {
    if (!a.last_appointment) return 1;
    if (!b.last_appointment) return -1;
    return b.last_appointment.localeCompare(a.last_appointment);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pacientes"
        description="Gestao dos seus pacientes"
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5" />
                Lista de Pacientes
              </CardTitle>
              <CardDescription>
                {patients.length} paciente
                {patients.length !== 1 ? "s" : ""} encontrado
                {patients.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form>
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                placeholder="Pesquisar por nome..."
                defaultValue={params.q ?? ""}
                className="pl-9"
              />
            </div>
          </form>

          {patients.length === 0 ? (
            <EmptyState
              icon={UserX}
              title={query ? "Nenhum resultado" : "Sem pacientes"}
              description={
                query
                  ? "Nenhum paciente encontrado com este nome."
                  : "Ainda nao tem pacientes registados."
              }
            />
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Email
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Telefone
                    </TableHead>
                    <TableHead>Ultima Consulta</TableHead>
                    <TableHead className="text-right">Consultas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((p) => {
                    const initials =
                      (p.first_name?.[0] ?? "") + (p.last_name?.[0] ?? "");
                    return (
                      <TableRow key={p.patient_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                              <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                                {initials || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {p.first_name} {p.last_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {p.email ?? "-"}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {p.phone ?? "-"}
                        </TableCell>
                        <TableCell>
                          {p.last_appointment
                            ? new Date(
                                p.last_appointment
                              ).toLocaleDateString("pt-PT")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {p.total_appointments}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
