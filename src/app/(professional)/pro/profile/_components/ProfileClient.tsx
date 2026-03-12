"use client";

import { useRef, useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  UserCircle,
  MapPin,
  Globe,
  Stethoscope,
  Star,
  MessageSquare,
  Pencil,
  Loader2,
  X,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { format } from "date-fns";
import { pt } from "date-fns/locale/pt";
import { fr } from "date-fns/locale/fr";
import { enGB } from "date-fns/locale/en-GB";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { translateSpecialty } from "@/locales/patient/specialties";
import { useAvatarUpload } from "../_hooks/useAvatarUpload";
import { updateProfile } from "@/app/(professional)/_actions/profile";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  language: string | null;
}

interface Professional {
  id: string;
  specialty: string | null;
  registration_number: string | null;
  practice_type: string | null;
  cabinet_name: string | null;
  years_experience: number | null;
  subspecialties: string[] | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  languages_spoken: string[] | null;
  bio: string | null;
  rating: number | null;
  total_reviews: number | null;
  verification_status: string | null;
}

interface Rating {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  appointment_date: string;
  service_name: string | null;
  patient_first_name: string | null;
  patient_last_name: string | null;
}

interface ProfileClientProps {
  userId: string;
  userProfile: UserProfile;
  professional: Professional;
  recentRatings: Rating[];
}

// ---------------------------------------------------------------------------
// Section key type
// ---------------------------------------------------------------------------

type SectionKey = "personal" | "professional" | "location" | "languages";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfileClient({
  userId,
  userProfile,
  professional,
  recentRatings,
}: ProfileClientProps) {
  const { t, locale } = useProfessionalI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { uploading, upload, remove } = useAvatarUpload({
    userId,
    t: {
      uploadSuccess: t.profile.uploadSuccess,
      uploadError: t.profile.uploadError,
      fileTooLarge: t.profile.fileTooLarge,
      invalidFormat: t.profile.invalidFormat,
      deleteSuccess: t.profile.deleteSuccess,
    },
  });

  const dateLocale = locale === "fr" ? fr : locale === "en" ? enGB : pt;

  const initials =
    (userProfile.first_name?.[0] ?? "") + (userProfile.last_name?.[0] ?? "");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  }

  // ---- Editing state per section ----
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form values stored as flat record so we can reuse one pattern
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  function startEditing(section: SectionKey) {
    const values: Record<string, string> = {};
    if (section === "personal") {
      values.first_name = userProfile.first_name ?? "";
      values.last_name = userProfile.last_name ?? "";
      values.phone = userProfile.phone ?? "";
    } else if (section === "professional") {
      values.specialty = professional.specialty ?? "";
      values.registration_number = professional.registration_number ?? "";
      values.practice_type = professional.practice_type ?? "";
      values.cabinet_name = professional.cabinet_name ?? "";
      values.years_experience = professional.years_experience?.toString() ?? "";
      values.subspecialties = professional.subspecialties?.join(", ") ?? "";
      values.bio = professional.bio ?? "";
    } else if (section === "location") {
      values.address = professional.address ?? "";
      values.city = professional.city ?? "";
      values.postal_code = professional.postal_code ?? "";
    } else if (section === "languages") {
      values.languages_spoken = professional.languages_spoken?.join(", ") ?? "";
    }
    setFormValues(values);
    setEditingSection(section);
  }

  function cancelEditing() {
    setEditingSection(null);
    setFormValues({});
  }

  function updateField(key: string, value: string) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!editingSection) return;

    let input: Parameters<typeof updateProfile>[0];

    if (editingSection === "personal") {
      input = {
        section: "personal",
        first_name: formValues.first_name ?? "",
        last_name: formValues.last_name ?? "",
        phone: formValues.phone ?? "",
      };
    } else if (editingSection === "professional") {
      input = {
        section: "professional",
        specialty: formValues.specialty ?? "",
        registration_number: formValues.registration_number ?? "",
        practice_type: formValues.practice_type ?? "",
        cabinet_name: formValues.cabinet_name ?? "",
        years_experience: formValues.years_experience
          ? Number(formValues.years_experience)
          : undefined,
        subspecialties: formValues.subspecialties ?? "",
        bio: formValues.bio ?? "",
      };
    } else if (editingSection === "location") {
      input = {
        section: "location",
        address: formValues.address ?? "",
        city: formValues.city ?? "",
        postal_code: formValues.postal_code ?? "",
      };
    } else {
      input = {
        section: "languages",
        languages_spoken: formValues.languages_spoken ?? "",
      };
    }

    startTransition(async () => {
      const result = await updateProfile(input);
      if (result.success) {
        toast.success(t.profile.saveSuccess);
        setEditingSection(null);
        setFormValues({});
        router.refresh();
      } else {
        toast.error(t.profile.saveError);
      }
    });
  }

  // ---- Read-only field definitions ----

  const reviewCount = professional.total_reviews ?? 0;

  // ---- Render helpers ----

  function renderField(label: string, value: string | null | undefined, fallback: string) {
    return (
      <div className="flex justify-between gap-4">
        <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
        <span className="text-right text-sm font-medium">{value || fallback}</span>
      </div>
    );
  }

  function renderInput(label: string, key: string, opts?: { placeholder?: string }) {
    return (
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
        <label className="shrink-0 text-sm text-muted-foreground sm:w-40">
          {label}
        </label>
        <Input
          value={formValues[key] ?? ""}
          onChange={(e) => updateField(key, e.target.value)}
          placeholder={opts?.placeholder}
          className="flex-1"
        />
      </div>
    );
  }

  function renderTextarea(label: string, key: string, opts?: { placeholder?: string }) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted-foreground">{label}</label>
        <Textarea
          value={formValues[key] ?? ""}
          onChange={(e) => updateField(key, e.target.value)}
          placeholder={opts?.placeholder}
          rows={3}
        />
      </div>
    );
  }

  function renderSectionHeader(
    icon: React.ComponentType<{ className?: string }>,
    title: string,
    sectionKey: SectionKey,
  ) {
    const Icon = icon;
    const isEditing = editingSection === sectionKey;
    return (
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="size-4 text-muted-foreground" />
            {title}
          </CardTitle>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => startEditing(sectionKey)}
              disabled={editingSection !== null && editingSection !== sectionKey}
            >
              <Pencil className="size-3" />
              {t.profile.edit}
            </Button>
          )}
          {isEditing && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={cancelEditing}
              disabled={isPending}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </CardHeader>
    );
  }

  function renderSectionFooter() {
    return (
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" size="sm" onClick={cancelEditing} disabled={isPending}>
          {t.profile.cancel}
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="size-3 animate-spin" />
              {t.profile.saving}
            </>
          ) : (
            t.profile.save
          )}
        </Button>
      </div>
    );
  }

  // ---- Render ----

  return (
    <div className="space-y-5">
      {/* Header with avatar */}
      <div className="flex items-center gap-5">
        <div className="flex flex-col items-center gap-1.5">
          <button
            type="button"
            className="group relative size-24 shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => !uploading && fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Avatar className="size-24">
              <AvatarImage
                src={userProfile.avatar_url ?? undefined}
                alt={userProfile.first_name ?? undefined}
              />
              <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
                {initials || "?"}
              </AvatarFallback>
            </Avatar>

            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/40">
              {uploading ? (
                <Loader2 className="size-6 animate-spin text-white" />
              ) : (
                <span className="flex flex-col items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Pencil className="size-4 text-white" />
                  <span className="text-[10px] font-medium text-white">
                    {t.profile.changePhoto}
                  </span>
                </span>
              )}
            </span>

            {!uploading && (
              <span className="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full bg-foreground shadow-sm">
                <Pencil className="size-3 text-background" />
              </span>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          {userProfile.avatar_url && !uploading && (
            <button
              type="button"
              onClick={remove}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              {t.profile.deletePhoto}
            </button>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {userProfile.first_name} {userProfile.last_name}
            </h1>
            <StatusBadge type="verification" value={professional.verification_status ?? "pending"} />
          </div>
          <p className="text-sm text-muted-foreground">
            {translateSpecialty(professional.specialty, locale)}
            {professional.cabinet_name && ` \u2014 ${professional.cabinet_name}`}
          </p>
        </div>
      </div>

      {/* Rating + Bio */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-xl bg-amber-50 p-2.5">
              <Star className="size-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {professional.rating?.toFixed(1) ?? "-"}
              </p>
              <p className="text-xs text-muted-foreground">
                {reviewCount} {reviewCount !== 1 ? t.profile.reviewPlural : t.profile.reviewSingular}
              </p>
            </div>
          </CardContent>
        </Card>

        {professional.bio && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {professional.bio}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent ratings */}
      {recentRatings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="size-4 text-muted-foreground" />
              {t.profile.recentReviews}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRatings.map((r, idx) => {
                const patientName = r.patient_first_name
                  ? `${r.patient_first_name} ${r.patient_last_name ?? ""}`.trim()
                  : t.profile.patient;
                const patientInitials = r.patient_first_name
                  ? `${r.patient_first_name[0]}${r.patient_last_name?.[0] ?? ""}`.toUpperCase()
                  : "P";
                return (
                  <div key={r.id}>
                    {idx > 0 && <Separator className="mb-4" />}
                    <div className="flex items-start gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs">{patientInitials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">{patientName}</span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`size-3 ${
                                  i < r.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(r.created_at), "d MMM yyyy", { locale: dateLocale })}
                          </span>
                        </div>
                        {r.service_name && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {r.service_name}
                          </p>
                        )}
                        {r.comment && (
                          <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---- Personal Info ---- */}
      <Card>
        {renderSectionHeader(UserCircle, t.profile.personalInfo, "personal")}
        <CardContent>
          {editingSection === "personal" ? (
            <div className="space-y-3">
              {renderInput(t.profile.firstName, "first_name")}
              {renderInput(t.profile.lastName, "last_name")}
              {renderInput(t.profile.phone, "phone")}
              {renderSectionFooter()}
            </div>
          ) : (
            <div className="space-y-3">
              {renderField(t.profile.name, `${userProfile.first_name} ${userProfile.last_name}`, "")}
              <Separator />
              {renderField(t.profile.email, userProfile.email, "")}
              <Separator />
              {renderField(t.profile.phone, userProfile.phone, t.profile.notDefined)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---- Professional Info ---- */}
      <Card>
        {renderSectionHeader(Stethoscope, t.profile.professionalInfo, "professional")}
        <CardContent>
          {editingSection === "professional" ? (
            <div className="space-y-3">
              {renderInput(t.profile.specialty, "specialty")}
              {renderInput(t.profile.registrationNumber, "registration_number")}
              {renderInput(t.profile.practiceType, "practice_type")}
              {renderInput(t.profile.cabinetName, "cabinet_name")}
              {renderInput(t.profile.yearsExperience, "years_experience")}
              {renderInput(t.profile.subspecialties, "subspecialties", {
                placeholder: t.profile.subspecialtiesHint,
              })}
              {renderTextarea(t.profile.bio, "bio", {
                placeholder: t.profile.bioPlaceholder,
              })}
              {renderSectionFooter()}
            </div>
          ) : (
            <div className="space-y-3">
              {renderField(t.profile.specialty, translateSpecialty(professional.specialty, locale), t.profile.notDefined)}
              <Separator />
              {renderField(t.profile.registrationNumber, professional.registration_number, t.profile.notDefined)}
              <Separator />
              {renderField(t.profile.practiceType, professional.practice_type, t.profile.notDefined)}
              <Separator />
              {renderField(t.profile.cabinetName, professional.cabinet_name, t.profile.notDefined)}
              <Separator />
              {renderField(t.profile.yearsExperience, professional.years_experience?.toString(), t.profile.notDefined)}
              <Separator />
              {renderField(t.profile.subspecialties, professional.subspecialties?.join(", "), t.profile.none)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---- Location ---- */}
      <Card>
        {renderSectionHeader(MapPin, t.profile.location, "location")}
        <CardContent>
          {editingSection === "location" ? (
            <div className="space-y-3">
              {renderInput(t.profile.address, "address")}
              {renderInput(t.profile.city, "city")}
              {renderInput(t.profile.postalCode, "postal_code")}
              {renderSectionFooter()}
            </div>
          ) : (
            <div className="space-y-3">
              {renderField(t.profile.address, professional.address, t.profile.notDefinedFeminine)}
              <Separator />
              {renderField(t.profile.city, professional.city, t.profile.notDefinedFeminine)}
              <Separator />
              {renderField(t.profile.postalCode, professional.postal_code, t.profile.notDefined)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---- Languages ---- */}
      <Card>
        {renderSectionHeader(Globe, t.profile.languages, "languages")}
        <CardContent>
          {editingSection === "languages" ? (
            <div className="space-y-3">
              {renderInput(t.profile.spokenLanguages, "languages_spoken", {
                placeholder: t.profile.languagesHint,
              })}
              {renderSectionFooter()}
            </div>
          ) : (
            <div className="space-y-3">
              {renderField(t.profile.spokenLanguages, professional.languages_spoken?.join(", "), t.profile.notDefined)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
