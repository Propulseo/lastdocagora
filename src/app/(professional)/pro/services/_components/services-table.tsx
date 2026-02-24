"use client";

import { useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, PackageOpen, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { EditServiceDialog } from "./edit-service-dialog";
import { DeleteServiceDialog } from "./delete-service-dialog";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";

export interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  consultation_type: string;
  is_active: boolean;
}

interface ServicesTableProps {
  services: ServiceRow[];
}

export function ServicesTable({ services }: ServicesTableProps) {
  const { t } = useProfessionalI18n();
  const sv = t.services;

  const [editService, setEditService] = useState<ServiceRow | null>(null);
  const [deleteService, setDeleteService] = useState<ServiceRow | null>(null);

  const consultationTypeLabel: Record<string, string> = {
    "in-person": sv.consultationType["in-person"],
    in_person: sv.consultationType["in-person"],
    presencial: sv.consultationType["in-person"],
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="size-5" />
            {sv.serviceList}
          </CardTitle>
          <CardDescription>
            {services.length}{" "}
            {services.length !== 1
              ? sv.servicesFoundPlural
              : sv.servicesFoundSingular}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <EmptyState
              icon={PackageOpen}
              title={sv.noServices}
              description={sv.noServicesDescription}
            />
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{sv.name}</TableHead>
                    <TableHead className="hidden md:table-cell">
                      {sv.descriptionField}
                    </TableHead>
                    <TableHead>{sv.duration}</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      {sv.type}
                    </TableHead>
                    <TableHead>{sv.status}</TableHead>
                    <TableHead className="w-10">
                      <span className="sr-only">{sv.actions}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">
                        {service.name}
                      </TableCell>
                      <TableCell className="hidden max-w-[250px] truncate text-muted-foreground md:table-cell">
                        {service.description ?? "-"}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {service.duration_minutes} {t.common.min}
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
                          {service.is_active ? sv.active : sv.inactive}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">{sv.actions}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setEditService(service)}
                            >
                              <Pencil className="mr-2 size-4" />
                              {sv.editService}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteService(service)}
                            >
                              <Trash2 className="mr-2 size-4" />
                              {sv.deleteService}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editService && (
        <EditServiceDialog
          open={!!editService}
          onOpenChange={(open) => !open && setEditService(null)}
          service={editService}
        />
      )}

      {deleteService && (
        <DeleteServiceDialog
          open={!!deleteService}
          onOpenChange={(open) => !open && setDeleteService(null)}
          serviceId={deleteService.id}
          serviceName={deleteService.name}
        />
      )}
    </>
  );
}
