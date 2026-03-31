"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  User,
  Stethoscope,
  Briefcase,
  Calendar,
  MapPin,
  Upload,
  CheckCircle,
  Info,
  Pencil,
} from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { translateSpecialty } from "@/locales/patient/specialties";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { StepHandle } from "./Step1Profile";

interface Step6Props {
  userId: string;
  stepData: {
    step1?: {
      first_name: string;
      last_name: string;
      bio: string;
      registration_number: string;
      languages_spoken: string;
    };
    step2?: {
      specialty: string;
      subspecialties: string;
      years_experience?: number;
      practice_type: string;
    };
    step3?: { services: { name: string; duration_minutes: number; price: number }[] };
    step4?: { slots: { day_of_week: number; start_time: string; end_time: string }[] };
    step5?: { cabinet_name: string; address: string; city: string; postal_code: string };
  };
  userProfile: {
    first_name: string | null;
    last_name: string | null;
  };
  professional: {
    specialty: string | null;
    registration_number: string | null;
    cabinet_name: string | null;
    address: string | null;
    city: string | null;
  };
  existingServicesCount: number;
  existingSlotsCount: number;
  onNavigateToStep: (step: number) => void;
  onSubmit: () => void;
}

const ACCEPTED_DOC_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];
const MAX_DOC_SIZE = 5 * 1024 * 1024; // 5MB

export const Step6Verification = forwardRef<StepHandle, Step6Props>(
  function Step6Verification(
    {
      userId,
      stepData,
      userProfile,
      professional,
      existingServicesCount,
      existingSlotsCount,
      onNavigateToStep,
      onSubmit,
    },
    ref,
  ) {
    const { t, locale } = useProfessionalI18n();
    const ob = t.onboarding;

    const [licenseUploaded, setLicenseUploaded] = useState(false);
    const [diplomaUploaded, setDiplomaUploaded] = useState(false);
    const [uploading, setUploading] = useState(false);
    const licenseRef = useRef<HTMLInputElement>(null);
    const diplomaRef = useRef<HTMLInputElement>(null);

    const supabase = createClient();

    async function uploadDoc(
      file: File,
      docType: "license" | "diploma",
    ) {
      if (!ACCEPTED_DOC_TYPES.includes(file.type)) {
        toast.error(ob.errors.invalidFormat);
        return;
      }
      if (file.size > MAX_DOC_SIZE) {
        toast.error(ob.errors.fileTooLarge);
        return;
      }

      setUploading(true);
      try {
        const ext = file.name.split(".").pop() ?? "pdf";
        const path = `${userId}/${docType}.${ext}`;

        const { error } = await supabase.storage
          .from("professional-docs")
          .upload(path, file, { upsert: true, contentType: file.type });

        if (error) throw error;

        if (docType === "license") setLicenseUploaded(true);
        else setDiplomaUploaded(true);
      } catch {
        toast.error(ob.errors.uploadError);
      } finally {
        setUploading(false);
      }
    }

    useImperativeHandle(ref, () => ({
      submit() {
        onSubmit();
        return true;
      },
    }));

    // Resolve display values from stepData or initial props
    const name =
      stepData.step1
        ? `${stepData.step1.first_name} ${stepData.step1.last_name}`
        : `${userProfile.first_name ?? ""} ${userProfile.last_name ?? ""}`.trim();

    const specialty = stepData.step2?.specialty ?? professional.specialty;
    const regNumber =
      stepData.step1?.registration_number ?? professional.registration_number;

    const newServicesCount = stepData.step3?.services?.length ?? 0;
    const totalServices = existingServicesCount + newServicesCount;

    const newSlotsCount = stepData.step4?.slots?.length ?? 0;
    const totalSlots = existingSlotsCount + newSlotsCount;

    const addr = stepData.step5
      ? [stepData.step5.address, stepData.step5.city].filter(Boolean).join(", ")
      : [professional.address, professional.city].filter(Boolean).join(", ");

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">{ob.step6.title}</h2>
          <p className="text-sm text-muted-foreground">{ob.step6.subtitle}</p>
        </div>

        {/* Summary cards */}
        <div className="space-y-3">
          <SummaryCard
            icon={User}
            title={ob.step6.summary.profile}
            value={name || ob.step6.notDefined}
            sub={regNumber ?? undefined}
            onEdit={() => onNavigateToStep(1)}
            editLabel={ob.step6.summary.edit}
          />
          <SummaryCard
            icon={Stethoscope}
            title={ob.step6.summary.specialty}
            value={translateSpecialty(specialty, locale) ?? ob.step6.notDefined}
            onEdit={() => onNavigateToStep(2)}
            editLabel={ob.step6.summary.edit}
          />
          <SummaryCard
            icon={Briefcase}
            title={ob.step6.summary.services}
            value={ob.step6.servicesCount.replace("{count}", String(totalServices))}
            onEdit={() => onNavigateToStep(3)}
            editLabel={ob.step6.summary.edit}
          />
          <SummaryCard
            icon={Calendar}
            title={ob.step6.summary.availability}
            value={ob.step6.slotsCount.replace("{count}", String(totalSlots))}
            onEdit={() => onNavigateToStep(4)}
            editLabel={ob.step6.summary.edit}
          />
          <SummaryCard
            icon={MapPin}
            title={ob.step6.summary.address}
            value={addr || ob.step6.notDefined}
            onEdit={() => onNavigateToStep(5)}
            editLabel={ob.step6.summary.edit}
          />
        </div>

        {/* Document upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ob.step6.documents}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{ob.step6.license}</p>
                <p className="text-xs text-muted-foreground">{ob.step6.uploadHint}</p>
              </div>
              {licenseUploaded ? (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="size-4" />
                  {ob.step6.uploaded}
                </span>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => licenseRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="size-3.5" />
                    {ob.step6.upload}
                  </Button>
                  <input
                    ref={licenseRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadDoc(file, "license");
                      e.target.value = "";
                    }}
                  />
                </>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{ob.step6.diploma}</p>
                <p className="text-xs text-muted-foreground">{ob.step6.uploadHint}</p>
              </div>
              {diplomaUploaded ? (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle className="size-4" />
                  {ob.step6.uploaded}
                </span>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => diplomaRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="size-3.5" />
                    {ob.step6.upload}
                  </Button>
                  <input
                    ref={diplomaRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadDoc(file, "diploma");
                      e.target.value = "";
                    }}
                  />
                </>
              )}
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950">
              <Info className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {ob.step6.verificationNote}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  },
);

// ---------------------------------------------------------------------------
// Summary card sub-component
// ---------------------------------------------------------------------------

function SummaryCard({
  icon: Icon,
  title,
  value,
  sub,
  onEdit,
  editLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  sub?: string;
  onEdit: () => void;
  editLabel: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-muted p-2">
            <Icon className="size-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-sm font-medium">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={onEdit}
        >
          <Pencil className="size-3" />
          {editLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
