"use client";

import { useState, Suspense } from "react";
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
import { Pagination } from "@/components/shared/pagination";
import { cn } from "@/lib/utils";
import { SHADOW, RADIUS } from "@/lib/design-tokens";
import { EditServiceDialog } from "./edit-service-dialog";
import { DeleteServiceDialog } from "./delete-service-dialog";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { getServiceName, getServiceDescription } from "@/lib/get-service-name";
import type { ServiceDashboardRow } from "../_lib/types";

// Re-export the old type for backwards compat with create/edit dialogs
export type ServiceRow = ServiceDashboardRow;

interface ServicesTableProps {
  services: ServiceDashboardRow[];
  totalFiltered: number;
}

export function ServicesTable({ services, totalFiltered }: ServicesTableProps) {
  const { t, locale } = useProfessionalI18n();
  const sv = t.services;

  const [editService, setEditService] = useState<ServiceDashboardRow | null>(null);
  const [deleteService, setDeleteService] = useState<ServiceDashboardRow | null>(null);

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
            {totalFiltered}{" "}
            {totalFiltered !== 1
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
            <>
              <div className={cn("bg-card overflow-hidden", RADIUS.card, SHADOW.card)}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{sv.name}</TableHead>
                      <TableHead className="hidden md:table-cell">
                        {sv.descriptionField}
                      </TableHead>
                      <TableHead>{sv.duration}</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        {sv.price}
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        {(sv as unknown as Record<string, string>).appointmentsCol ?? "Consultas"}
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        {(sv as unknown as Record<string, string>).revenueCol ?? "Receitas"}
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
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
                      <TableRow key={service.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">
                          {getServiceName(service, locale)}
                        </TableCell>
                        <TableCell className="hidden max-w-[250px] truncate text-muted-foreground md:table-cell">
                          {getServiceDescription(service, locale) || "-"}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {service.duration_minutes} {t.common.min}
                        </TableCell>
                        <TableCell className="hidden tabular-nums sm:table-cell">
                          {service.price > 0
                            ? `${service.price} \u20ac`
                            : sv.priceOnRequest}
                        </TableCell>
                        <TableCell className="hidden tabular-nums lg:table-cell">
                          {service.total_appointments}
                        </TableCell>
                        <TableCell className="hidden tabular-nums lg:table-cell">
                          {service.total_revenue > 0
                            ? `${service.total_revenue} \u20ac`
                            : "\u2014"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className={RADIUS.badge}>
                            {consultationTypeLabel[service.consultation_type] ??
                              service.consultation_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={service.is_active ? "default" : "secondary"}
                            className={RADIUS.badge}
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
                            <DropdownMenuContent align="end" className={RADIUS.element}>
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

              {totalFiltered > 20 && (
                <div className="mt-4">
                  <Suspense>
                    <Pagination total={totalFiltered} pageSize={20} />
                  </Suspense>
                </div>
              )}
            </>
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
