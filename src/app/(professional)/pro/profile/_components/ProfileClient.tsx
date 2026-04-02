"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UserCircle, MapPin, Globe, Stethoscope, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { translateSpecialty } from "@/locales/patient/specialties";
import { ProfileAvatarHeader } from "./ProfileAvatarHeader";
import { ProfileRatingsSection } from "./ProfileRatingsSection";
import { useProfileEditing } from "./useProfileEditing";
import { DisplayField, EditField, SectionCardHeader, SectionCardFooter } from "./ProfileFieldHelpers";
import { LockedField } from "./LockedField";
import { ApprovalField } from "./ApprovalField";
import type { ProfileClientProps } from "./profile-types";

export function ProfileClient({ userId, userProfile, professional, recentRatings, insuranceProviders, professionalInsuranceIds }: ProfileClientProps) {
  const { t, locale } = useProfessionalI18n();
  const editing = useProfileEditing({
    userProfile, professional, professionalInsuranceIds,
    translations: { saveSuccess: t.profile.saveSuccess, saveError: t.profile.saveError, saveSuccessGeocoded: t.profile.saveSuccessGeocoded, saveSuccessNoGeocode: t.profile.saveSuccessNoGeocode },
  });

  const footerProps = { onCancel: editing.cancelEditing, onSave: editing.handleSave, isPending: editing.isPending, cancelLabel: t.profile.cancel, saveLabel: t.profile.save, savingLabel: t.profile.saving };
  const headerBase = { editingSection: editing.editingSection, onEdit: editing.startEditing, onCancel: editing.cancelEditing, isPending: editing.isPending, editLabel: t.profile.edit };

  return (
    <div className="space-y-5">
      <ProfileAvatarHeader userId={userId} userProfile={userProfile} professional={professional} />
      <ProfileRatingsSection professional={professional} recentRatings={recentRatings} />

      {/* Personal Info */}
      <Card>
        <SectionCardHeader icon={UserCircle} title={t.profile.personalInfo} sectionKey="personal" {...headerBase} />
        <CardContent>
          {editing.editingSection === "personal" ? (
            <div className="space-y-3">
              <EditField label={t.profile.firstName} value={editing.formValues.first_name ?? ""} onChange={(v) => editing.updateField("first_name", v)} />
              <EditField label={t.profile.lastName} value={editing.formValues.last_name ?? ""} onChange={(v) => editing.updateField("last_name", v)} />
              <EditField label={t.profile.phone} value={editing.formValues.phone ?? ""} onChange={(v) => editing.updateField("phone", v)} />
              <SectionCardFooter {...footerProps} />
            </div>
          ) : (
            <div className="space-y-3">
              <DisplayField label={t.profile.name} value={`${userProfile.first_name} ${userProfile.last_name}`} fallback="" />
              <Separator /><DisplayField label={t.profile.email} value={userProfile.email} fallback="" />
              <Separator /><DisplayField label={t.profile.phone} value={userProfile.phone} fallback={t.profile.notDefined} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Professional Info */}
      <Card>
        <SectionCardHeader icon={Stethoscope} title={t.profile.professionalInfo} sectionKey="professional" {...headerBase} />
        <CardContent>
          {editing.editingSection === "professional" ? (
            <div className="space-y-3">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                <label className="shrink-0 text-sm text-muted-foreground sm:w-40">{t.profile.specialty}</label>
                <Select value={editing.formValues.specialty ?? ""} onValueChange={(v) => editing.updateField("specialty", v)}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{getSpecialtyOptions(locale).map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <EditField label={t.profile.registrationNumber} value={editing.formValues.registration_number ?? ""} onChange={(v) => editing.updateField("registration_number", v)} />
              <EditField label={t.profile.practiceType} value={editing.formValues.practice_type ?? ""} onChange={(v) => editing.updateField("practice_type", v)} />
              <EditField label={t.profile.cabinetName} value={editing.formValues.cabinet_name ?? ""} onChange={(v) => editing.updateField("cabinet_name", v)} />
              <EditField label={t.profile.yearsExperience} value={editing.formValues.years_experience ?? ""} onChange={(v) => editing.updateField("years_experience", v)} />
              <EditField label={t.profile.subspecialties} value={editing.formValues.subspecialties ?? ""} onChange={(v) => editing.updateField("subspecialties", v)} placeholder={t.profile.subspecialtiesHint} />
              <div className="space-y-2">
                <Label>{t.profile.bio}</Label>
                <Tabs defaultValue="pt" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="pt" className="flex-1">{t.profile.bioTabPt}</TabsTrigger>
                    <TabsTrigger value="fr" className="flex-1">{t.profile.bioTabFr} <span className="ml-1 text-xs text-muted-foreground">{t.profile.bioOptional}</span></TabsTrigger>
                    <TabsTrigger value="en" className="flex-1">{t.profile.bioTabEn} <span className="ml-1 text-xs text-muted-foreground">{t.profile.bioOptional}</span></TabsTrigger>
                  </TabsList>
                  <TabsContent value="pt">
                    <Textarea value={editing.formValues.bio_pt ?? ""} onChange={(e) => { editing.updateField("bio_pt", e.target.value); editing.updateField("bio", e.target.value); }} placeholder={t.profile.bioPlaceholder} rows={4} />
                  </TabsContent>
                  <TabsContent value="fr">
                    <Textarea value={editing.formValues.bio_fr ?? ""} onChange={(e) => editing.updateField("bio_fr", e.target.value)} placeholder={t.profile.bioPlaceholder} rows={4} />
                  </TabsContent>
                  <TabsContent value="en">
                    <Textarea value={editing.formValues.bio_en ?? ""} onChange={(e) => editing.updateField("bio_en", e.target.value)} placeholder={t.profile.bioPlaceholder} rows={4} />
                  </TabsContent>
                </Tabs>
              </div>
              <SectionCardFooter {...footerProps} />
            </div>
          ) : (
            <div className="space-y-3">
              <DisplayField label={t.profile.specialty} value={translateSpecialty(professional.specialty, locale)} fallback={t.profile.notDefined} />
              <Separator /><DisplayField label={t.profile.registrationNumber} value={professional.registration_number} fallback={t.profile.notDefined} />
              <Separator /><DisplayField label={t.profile.practiceType} value={professional.practice_type} fallback={t.profile.notDefined} />
              <Separator /><DisplayField label={t.profile.cabinetName} value={professional.cabinet_name} fallback={t.profile.notDefined} />
              <Separator /><DisplayField label={t.profile.yearsExperience} value={professional.years_experience?.toString()} fallback={t.profile.notDefined} />
              <Separator /><DisplayField label={t.profile.subspecialties} value={professional.subspecialties?.join(", ")} fallback={t.profile.none} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <SectionCardHeader icon={MapPin} title={t.profile.location} sectionKey="location" {...headerBase} />
        <CardContent>
          {editing.editingSection === "location" ? (
            <div className="space-y-3">
              <EditField label={t.profile.address} value={editing.formValues.address ?? ""} onChange={(v) => editing.updateField("address", v)} />
              <EditField label={t.profile.city} value={editing.formValues.city ?? ""} onChange={(v) => editing.updateField("city", v)} />
              <EditField label={t.profile.postalCode} value={editing.formValues.postal_code ?? ""} onChange={(v) => editing.updateField("postal_code", v)} />
              <SectionCardFooter {...footerProps} />
            </div>
          ) : (
            <div className="space-y-3">
              <DisplayField label={t.profile.address} value={professional.address} fallback={t.profile.notDefinedFeminine} />
              <Separator /><DisplayField label={t.profile.city} value={professional.city} fallback={t.profile.notDefinedFeminine} />
              <Separator /><DisplayField label={t.profile.postalCode} value={professional.postal_code} fallback={t.profile.notDefined} />
            </div>
          )}
        </CardContent>
      </Card>

      {editing.editingSection !== "location" && (
        professional.latitude != null && professional.longitude != null ? (
          <Badge variant="outline" className="w-fit gap-1.5 border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-400">
            <MapPin className="size-3" />{t.profile.geocodedVisible}
          </Badge>
        ) : (
          <Badge variant="outline" className="w-fit gap-1.5 border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-950 dark:text-orange-400">
            <MapPin className="size-3" />{t.profile.geocodedMissing}
          </Badge>
        )
      )}

      {/* Languages */}
      <Card>
        <SectionCardHeader icon={Globe} title={t.profile.languages} sectionKey="languages" {...headerBase} />
        <CardContent>
          {editing.editingSection === "languages" ? (
            <div className="space-y-3">
              <EditField label={t.profile.spokenLanguages} value={editing.formValues.languages_spoken ?? ""} onChange={(v) => editing.updateField("languages_spoken", v)} placeholder={t.profile.languagesHint} />
              <SectionCardFooter {...footerProps} />
            </div>
          ) : (
            <DisplayField label={t.profile.spokenLanguages} value={professional.languages_spoken?.join(", ")} fallback={t.profile.notDefined} />
          )}
        </CardContent>
      </Card>

      {/* Insurances */}
      <Card>
        <SectionCardHeader icon={Shield} title={t.profile.insuranceSection} sectionKey="insurances" {...headerBase} />
        <CardContent>
          {editing.editingSection === "insurances" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t.profile.insuranceDescription}</p>
              <div className="flex flex-wrap gap-2">
                {insuranceProviders.map((provider) => {
                  const selected = editing.selectedInsuranceIds.includes(provider.id);
                  return (
                    <button key={provider.id} type="button" onClick={() => editing.setSelectedInsuranceIds((prev) => selected ? prev.filter((x) => x !== provider.id) : [...prev, provider.id])} className="min-h-[44px]">
                      <Badge variant={selected ? "default" : "outline"} className="cursor-pointer px-3 py-1.5 text-sm transition-colors">{provider.name}</Badge>
                    </button>
                  );
                })}
              </div>
              <SectionCardFooter {...footerProps} />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {professionalInsuranceIds.length > 0 ? (
                insuranceProviders.filter((p) => professionalInsuranceIds.includes(p.id)).map((p) => (<Badge key={p.id} variant="secondary">{p.name}</Badge>))
              ) : (
                <span className="text-sm text-muted-foreground">{t.profile.noInsuranceSelected}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
