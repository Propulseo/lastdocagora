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
import { Badge } from "@/components/ui/badge";
import { Briefcase, PackageOpen } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

const consultationTypeLabel: Record<string, string> = {
  presencial: "Presencial",
  teleconsulta: "Teleconsulta",
  domicilio: "Domicilio",
  in_person: "Presencial",
  "in-person": "Presencial",
  video: "Teleconsulta",
  online: "Teleconsulta",
  home_visit: "Domicilio",
  both: "Presencial e Online",
};

export default async function ServicesPage() {
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

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("professional_id", professional.id)
    .order("name", { ascending: true });

  const allServices = services ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Servicos"
        description="Servicos que oferece aos pacientes"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="size-5" />
            Servicos Oferecidos
          </CardTitle>
          <CardDescription>
            {allServices.length} servico
            {allServices.length !== 1 ? "s" : ""} registado
            {allServices.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allServices.length === 0 ? (
            <EmptyState
              icon={PackageOpen}
              title="Sem servicos"
              description="Adicione os seus servicos para que os pacientes possam agendar."
            />
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Descricao
                    </TableHead>
                    <TableHead>Duracao</TableHead>
                    <TableHead>Preco</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Tipo
                    </TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">
                        {service.name}
                      </TableCell>
                      <TableCell className="hidden max-w-[250px] truncate text-muted-foreground md:table-cell">
                        {service.description ?? "-"}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {service.duration_minutes} min
                      </TableCell>
                      <TableCell className="tabular-nums font-medium">
                        {service.price.toFixed(2)} &euro;
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">
                          {consultationTypeLabel[service.consultation_type] ??
                            service.consultation_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={service.is_active ? "default" : "secondary"}
                        >
                          {service.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
