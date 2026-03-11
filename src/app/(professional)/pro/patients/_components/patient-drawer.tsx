"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  Mail,
  Globe,
  ShieldCheck,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import {
  getPatientDetail,
  type PatientDetail,
} from "@/app/(professional)/_actions/patients";

interface PatientDrawerProps {
  patientId: string | null;
  patientName: string;
  onClose: () => void;
}

function computeAge(dob: string): number | null {
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  confirmed: "default",
  pending: "secondary",
  completed: "outline",
  cancelled: "destructive",
  "no-show": "destructive",
};

export function PatientDrawer({
  patientId,
  patientName,
  onClose,
}: PatientDrawerProps) {
  const { t } = useProfessionalI18n();
  const dt = t.patients.drawer;
  const dateLocale = t.common.dateLocale as "pt-PT" | "fr-FR";

  const [data, setData] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!patientId) {
      setData(null);
      return;
    }
    setLoading(true);
    getPatientDetail(patientId).then((result) => {
      if (result.success) setData(result.data);
      setLoading(false);
    });
  }, [patientId]);

  const insuranceLabels = t.patients.insuranceLabels as Record<string, string>;
  const statusLabels = dt.status as Record<string, string>;

  const initials = data
    ? `${data.first_name?.[0] ?? ""}${data.last_name?.[0] ?? ""}`.toUpperCase() ||
      "?"
    : patientName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase() || "?";

  const age =
    data?.date_of_birth ? computeAge(data.date_of_birth) : null;

  return (
    <Sheet open={!!patientId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{dt.title}</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              {dt.loading}
            </span>
          </div>
        ) : data ? (
          <div className="space-y-6 pt-4">
            {/* Header */}
            <div className="flex items-center gap-4">
              <Avatar className="size-14">
                {data.avatar_url && (
                  <AvatarImage
                    src={data.avatar_url}
                    alt={`${data.first_name} ${data.last_name}`}
                  />
                )}
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">
                  {data.first_name} {data.last_name}
                </h3>
                {data.email && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="size-3.5" />
                    {data.email}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Info rows */}
            <div className="space-y-4">
              {/* Date of birth + age */}
              {data.date_of_birth && (
                <InfoRow
                  icon={<CalendarDays className="size-4" />}
                  label={dt.birthDate}
                  value={
                    new Date(data.date_of_birth).toLocaleDateString(
                      dateLocale,
                    ) + (age !== null ? ` (${dt.age.replace("{age}", String(age))})` : "")
                  }
                />
              )}

              {/* Languages */}
              {data.languages_spoken && data.languages_spoken.length > 0 && (
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-muted-foreground">
                    <Globe className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {dt.languages}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {data.languages_spoken.map((code) => (
                        <Badge key={code} variant="secondary" className="text-xs">
                          {code}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Insurance */}
              <InfoRow
                icon={<ShieldCheck className="size-4" />}
                label={dt.insurance}
                value={
                  data.insurance_provider
                    ? (insuranceLabels[data.insurance_provider] ??
                        data.insurance_provider)
                    : "-"
                }
              />
            </div>

            <Separator />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label={dt.completedConsultations}
                value={String(data.completedCount)}
              />
              <StatCard
                label={dt.firstConsultation}
                value={
                  data.firstConsultation
                    ? new Date(data.firstConsultation).toLocaleDateString(
                        dateLocale,
                      )
                    : "-"
                }
              />
              <StatCard
                label={dt.lastConsultation}
                value={
                  data.lastConsultation
                    ? new Date(data.lastConsultation).toLocaleDateString(
                        dateLocale,
                      )
                    : "-"
                }
              />
            </div>

            <Separator />

            {/* Recent appointments */}
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-medium">
                <ClipboardList className="size-4 text-muted-foreground" />
                {dt.recentAppointments}
              </h4>
              {data.recentAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {dt.noAppointments}
                </p>
              ) : (
                <div className="space-y-2">
                  {data.recentAppointments.map((apt, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between rounded-lg border p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {new Date(apt.date).toLocaleDateString(dateLocale)}{" "}
                          <span className="font-normal text-muted-foreground">
                            {apt.time.slice(0, 5)}
                          </span>
                        </p>
                        {apt.serviceName && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {apt.serviceName}
                          </p>
                        )}
                        {apt.notes && (
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                            {apt.notes}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={STATUS_VARIANT[apt.status] ?? "outline"}
                        className="ml-2 shrink-0 text-xs"
                      >
                        {statusLabels[apt.status] ?? apt.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
