"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CalendarDays,
  Mail,
  Globe,
  ShieldCheck,
  ClipboardList,
  Loader2,
  CalendarPlus,
  Pencil,
  Clock,
  DollarSign,
  CheckCircle,
  Target,
  ChevronDown,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { saveAppointmentNotes } from "@/app/(professional)/_actions/attendance";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import {
  getPatientDetailEnhanced,
  type PatientDetailEnhanced,
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

const ATTENDANCE_COLORS: Record<string, string> = {
  present: "text-emerald-600 bg-emerald-50",
  late: "text-amber-600 bg-amber-50",
  absent: "text-red-600 bg-red-50",
};

export function PatientDrawer({
  patientId,
  patientName,
  onClose,
}: PatientDrawerProps) {
  const { t } = useProfessionalI18n();
  const isMobile = useIsMobile();
  const dt = t.patients.drawer;
  const dateLocale = t.common.dateLocale as "pt-PT" | "fr-FR" | "en-GB";

  const [data, setData] = useState<PatientDetailEnhanced | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedAptId, setExpandedAptId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (!patientId) {
      setData(null);
      return;
    }
    setLoading(true);
    getPatientDetailEnhanced(patientId).then((result) => {
      if (result.success) setData(result.data);
      setLoading(false);
    });
  }, [patientId]);

  const insuranceLabels = t.patients.insuranceLabels as Record<string, string>;
  const statusLabels = dt.status as Record<string, string>;
  const attendanceLabels = (dt.attendance ?? {}) as Record<string, string>;
  const statusBadgeLabels = (t.patients.statusBadge ?? {}) as Record<string, string>;

  const initials = data
    ? `${data.first_name?.[0] ?? ""}${data.last_name?.[0] ?? ""}`.toUpperCase() ||
      "?"
    : patientName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase() || "?";

  const age = data?.date_of_birth ? computeAge(data.date_of_birth) : null;

  // Determine patient status
  const getStatus = (): "active" | "inactive" | "new" => {
    if (!data) return "active";
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
  };

  const statusBadgeVariant: Record<
    string,
    "default" | "secondary" | "outline"
  > = {
    active: "default",
    inactive: "secondary",
    new: "outline",
  };

  const patientStatus = getStatus();

  return (
    <Sheet open={!!patientId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "h-[90vh] w-full rounded-t-2xl p-0"
            : "w-full sm:max-w-2xl p-0"
        }
      >
        <SheetHeader className="px-6 pt-6">
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
          <ScrollArea className="h-[calc(100vh-5rem)]">
            <div className="space-y-6 px-6 pb-6 pt-4">
              {/* Header with status badge */}
              <div className="flex items-center gap-4">
                <Avatar className="size-14">
                  {data.avatar_url && (
                    <AvatarImage
                      src={data.avatar_url}
                      alt={`${data.first_name} ${data.last_name}`}
                    />
                  )}
                  <AvatarFallback className="text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold truncate">
                      {data.first_name} {data.last_name}
                    </h3>
                    <Badge
                      variant={statusBadgeVariant[patientStatus]}
                      className="text-xs shrink-0"
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

              {/* Info rows */}
              <div className="space-y-4">
                {data.date_of_birth && (
                  <InfoRow
                    icon={<CalendarDays className="size-4" />}
                    label={dt.birthDate}
                    value={
                      new Date(data.date_of_birth).toLocaleDateString(
                        dateLocale,
                      ) +
                      (age !== null
                        ? ` (${(dt.age as string).replace("{age}", String(age))})`
                        : "")
                    }
                  />
                )}

                {data.languages_spoken &&
                  data.languages_spoken.length > 0 && (
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
                            <Badge
                              key={code}
                              variant="secondary"
                              className="text-xs"
                            >
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
                      ? (insuranceLabels[data.insurance_provider] ??
                          data.insurance_provider)
                      : "-"
                  }
                />
              </div>

              <Separator />

              {/* Mini KPI cards (2x2) */}
              <div className="grid grid-cols-2 gap-3">
                <MiniKpi
                  icon={<CheckCircle className="size-4 text-emerald-500" />}
                  label={dt.completedConsultations}
                  value={String(data.completedCount)}
                />
                <MiniKpi
                  icon={<Target className="size-4 text-blue-500" />}
                  label={dt.attendanceRate}
                  value={
                    data.attendanceTotal > 0
                      ? `${data.attendanceRate}%`
                      : "-"
                  }
                />
                <MiniKpi
                  icon={<DollarSign className="size-4 text-amber-500" />}
                  label={dt.totalSpent}
                  value={
                    data.totalSpent > 0
                      ? `${data.totalSpent.toFixed(0)}€`
                      : "-"
                  }
                />
                <MiniKpi
                  icon={<Clock className="size-4 text-purple-500" />}
                  label={dt.avgSpent}
                  value={
                    data.avgSpent > 0
                      ? `${data.avgSpent.toFixed(0)}€`
                      : "-"
                  }
                />
              </div>

              <Separator />

              {/* Upcoming appointments */}
              {data.upcomingAppointments.length > 0 && (
                <>
                  <div className="space-y-3">
                    <h4 className="flex items-center gap-2 text-sm font-medium">
                      <CalendarPlus className="size-4 text-muted-foreground" />
                      {dt.upcomingAppointments}
                    </h4>
                    <div className="space-y-2">
                      {data.upcomingAppointments.map((apt, i) => (
                        <div
                          key={i}
                          className="flex items-start justify-between rounded-lg border border-blue-200 bg-blue-50/50 p-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {new Date(apt.date).toLocaleDateString(
                                dateLocale,
                              )}{" "}
                              <span className="font-normal text-muted-foreground">
                                {apt.time.slice(0, 5)}
                              </span>
                            </p>
                            {apt.serviceName && (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {apt.serviceName}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant={
                              STATUS_VARIANT[apt.status] ?? "outline"
                            }
                            className="ml-2 shrink-0 text-xs"
                          >
                            {statusLabels[apt.status] ?? apt.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Full appointment timeline */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-sm font-medium">
                  <ClipboardList className="size-4 text-muted-foreground" />
                  {dt.allAppointments}
                </h4>
                {data.allAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {dt.noAppointments}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {data.allAppointments.map((apt) => {
                      const isExpanded = expandedAptId === apt.id;
                      return (
                        <div key={apt.id} className="rounded-lg border overflow-hidden">
                          <button
                            type="button"
                            className="flex w-full items-start justify-between p-3 text-left hover:bg-accent/50 transition-colors"
                            onClick={() => {
                              if (isExpanded) {
                                setExpandedAptId(null);
                              } else {
                                setExpandedAptId(apt.id);
                                setEditingNotes(apt.notes ?? "");
                              }
                            }}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">
                                  {new Date(apt.date).toLocaleDateString(dateLocale)}{" "}
                                  <span className="font-normal text-muted-foreground">
                                    {apt.time.slice(0, 5)}
                                  </span>
                                </p>
                                {apt.attendanceStatus && (
                                  <span
                                    className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${ATTENDANCE_COLORS[apt.attendanceStatus] ?? ""}`}
                                  >
                                    {attendanceLabels[apt.attendanceStatus] ?? apt.attendanceStatus}
                                  </span>
                                )}
                              </div>
                              {apt.serviceName && (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {apt.serviceName}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-2 shrink-0">
                              <Badge variant={STATUS_VARIANT[apt.status] ?? "outline"} className="text-xs">
                                {statusLabels[apt.status] ?? apt.status}
                              </Badge>
                              <ChevronDown className={`size-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="border-t px-3 pb-3 pt-2 space-y-2">
                              <Textarea
                                value={editingNotes}
                                onChange={(e) => setEditingNotes(e.target.value)}
                                placeholder={(dt as Record<string, unknown>).notesPlaceholder as string}
                                rows={3}
                                className="text-sm"
                              />
                              <Button
                                size="sm"
                                disabled={savingNotes}
                                onClick={async () => {
                                  setSavingNotes(true);
                                  const result = await saveAppointmentNotes(apt.id, editingNotes);
                                  setSavingNotes(false);
                                  if (result.success) {
                                    toast.success((dt as Record<string, unknown>).notesSaved as string);
                                    // Optimistic update
                                    setData((prev) => {
                                      if (!prev) return prev;
                                      return {
                                        ...prev,
                                        allAppointments: prev.allAppointments.map((a) =>
                                          a.id === apt.id ? { ...a, notes: editingNotes.trim() || null } : a
                                        ),
                                      };
                                    });
                                  } else {
                                    toast.error((dt as Record<string, unknown>).notesError as string);
                                  }
                                }}
                              >
                                {savingNotes ? t.common.saving : (dt as Record<string, unknown>).saveNotes as string}
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <Separator />

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href="/pro/agenda">
                    <CalendarPlus className="mr-2 size-4" />
                    {dt.newAppointment}
                  </Link>
                </Button>
              </div>
            </div>
          </ScrollArea>
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

function MiniKpi({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-xs text-muted-foreground truncate">{label}</p>
      </div>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
