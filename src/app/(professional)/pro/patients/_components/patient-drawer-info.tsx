import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CalendarDays,
  Mail,
  Globe,
  ShieldCheck,
  CheckCircle,
  Target,
  DollarSign,
  Clock,
} from "lucide-react";
import type { PatientDetailEnhanced } from "@/app/(professional)/_actions/patients";
import { RADIUS } from "@/lib/design-tokens";
import { InfoRow, MiniKpi, computeAge } from "./patient-drawer-helpers";

interface DrawerTranslations {
  birthDate: string;
  age: string;
  languages: string;
  insurance: string;
  completedConsultations: string;
  attendanceRate: string;
  totalSpent: string;
  avgSpent: string;
  patientSince: string;
}

interface PatientDrawerInfoProps {
  data: PatientDetailEnhanced;
  patientName: string;
  dt: DrawerTranslations;
  dateLocale: "pt-PT" | "fr-FR" | "en-GB";
  insuranceLabels: Record<string, string>;
  statusBadgeLabels: Record<string, string>;
}

function getPatientStatus(data: PatientDetailEnhanced): "active" | "inactive" | "new" {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  if (
    data.firstConsultation &&
    data.firstConsultation >= thirtyDaysAgo.toISOString().split("T")[0]
  ) {
    return "new";
  }
  if (
    data.lastConsultation &&
    data.lastConsultation >= ninetyDaysAgo.toISOString().split("T")[0]
  ) {
    return "active";
  }
  return "inactive";
}

const statusBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  inactive: "secondary",
  new: "outline",
};

export function PatientDrawerInfo({
  data,
  patientName,
  dt,
  dateLocale,
  insuranceLabels,
  statusBadgeLabels,
}: PatientDrawerInfoProps) {
  const initials = data
    ? `${data.first_name?.[0] ?? ""}${data.last_name?.[0] ?? ""}`.toUpperCase() || "?"
    : patientName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase() || "?";

  const age = data.date_of_birth ? computeAge(data.date_of_birth) : null;
  const patientStatus = getPatientStatus(data);

  return (
    <>
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
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold truncate">
              {data.first_name} {data.last_name}
            </h3>
            <Badge
              variant={statusBadgeVariant[patientStatus]}
              className={`text-xs shrink-0 ${RADIUS.badge}`}
            >
              {statusBadgeLabels[patientStatus] ?? patientStatus}
            </Badge>
          </div>
          {data.email && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="size-3.5" />
              {data.email}
            </p>
          )}
          {data.created_at && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {dt.patientSince}{" "}
              {new Date(data.created_at).toLocaleDateString(dateLocale)}
            </p>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        {data.date_of_birth && (
          <InfoRow
            icon={<CalendarDays className="size-4" />}
            label={dt.birthDate}
            value={
              new Date(data.date_of_birth).toLocaleDateString(dateLocale) +
              (age !== null
                ? ` (${(dt.age as string).replace("{age}", String(age))})`
                : "")
            }
          />
        )}

        {data.languages_spoken && data.languages_spoken.length > 0 && (
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-muted-foreground">
              <Globe className="size-4" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{dt.languages}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {data.languages_spoken.map((code) => (
                  <Badge key={code} variant="secondary" className={`text-xs ${RADIUS.badge}`}>
                    {code}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        <InfoRow
          icon={<ShieldCheck className="size-4" />}
          label={dt.insurance}
          value={
            data.insurance_provider
              ? (insuranceLabels[data.insurance_provider] ?? data.insurance_provider)
              : "-"
          }
        />
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3">
        <MiniKpi
          icon={<CheckCircle className="size-4 text-emerald-500" />}
          label={dt.completedConsultations}
          value={String(data.completedCount)}
        />
        <MiniKpi
          icon={<Target className="size-4 text-blue-500" />}
          label={dt.attendanceRate}
          value={data.attendanceTotal > 0 ? `${data.attendanceRate}%` : "-"}
        />
        <MiniKpi
          icon={<DollarSign className="size-4 text-amber-500" />}
          label={dt.totalSpent}
          value={data.totalSpent > 0 ? `${data.totalSpent.toFixed(0)}\u20ac` : "-"}
        />
        <MiniKpi
          icon={<Clock className="size-4 text-purple-500" />}
          label={dt.avgSpent}
          value={data.avgSpent > 0 ? `${data.avgSpent.toFixed(0)}\u20ac` : "-"}
        />
      </div>
    </>
  );
}
