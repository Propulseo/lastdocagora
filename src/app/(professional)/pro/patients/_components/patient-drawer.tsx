"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import {
  getPatientDetailEnhanced,
  type PatientDetailEnhanced,
} from "@/app/(professional)/_actions/patients";
import { PatientDrawerInfo } from "./patient-drawer-info";
import { PatientDrawerAppointments } from "./patient-drawer-appointments";

interface PatientDrawerProps {
  patientId: string | null;
  patientName: string;
  onClose: () => void;
}

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
  const statusBadgeLabels = (t.patients.statusBadge ?? {}) as Record<string, string>;

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
              <PatientDrawerInfo
                data={data}
                patientName={patientName}
                dt={dt}
                dateLocale={dateLocale}
                insuranceLabels={insuranceLabels}
                statusBadgeLabels={statusBadgeLabels}
              />

              <PatientDrawerAppointments
                data={data}
                dt={dt}
                dateLocale={dateLocale}
                savingLabel={t.common.saving}
                expandedAptId={expandedAptId}
                setExpandedAptId={setExpandedAptId}
                editingNotes={editingNotes}
                setEditingNotes={setEditingNotes}
                savingNotes={savingNotes}
                setSavingNotes={setSavingNotes}
                setData={setData}
              />
            </div>
          </ScrollArea>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
