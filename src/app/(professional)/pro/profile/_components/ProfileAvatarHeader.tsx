"use client";

import { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { Pencil, Loader2 } from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { translateSpecialty } from "@/locales/patient/specialties";
import { useAvatarUpload } from "../_hooks/useAvatarUpload";
import type { UserProfile, Professional } from "./profile-types";

interface ProfileAvatarHeaderProps {
  userId: string;
  userProfile: UserProfile;
  professional: Professional;
}

export function ProfileAvatarHeader({ userId, userProfile, professional }: ProfileAvatarHeaderProps) {
  const { t, locale } = useProfessionalI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const initials = (userProfile.first_name?.[0] ?? "") + (userProfile.last_name?.[0] ?? "");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  }

  return (
    <div className="flex items-center gap-5">
      <div className="flex flex-col items-center gap-1.5">
        <button
          type="button"
          className="group relative size-32 shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => !uploading && fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Avatar className="size-32">
            <AvatarImage src={userProfile.avatar_url ?? undefined} alt={userProfile.first_name ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">{initials || "?"}</AvatarFallback>
          </Avatar>
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/40">
            {uploading ? (
              <Loader2 className="size-6 animate-spin text-white" />
            ) : (
              <span className="flex flex-col items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Pencil className="size-4 text-white" />
                <span className="text-[10px] font-medium text-white">{t.profile.changePhoto}</span>
              </span>
            )}
          </span>
          {!uploading && (
            <span className="absolute bottom-0 right-0 flex size-6 items-center justify-center rounded-full bg-foreground shadow-sm">
              <Pencil className="size-3 text-background" />
            </span>
          )}
        </button>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
        {userProfile.avatar_url && !uploading && (
          <button type="button" onClick={remove} className="text-xs text-muted-foreground hover:text-destructive">{t.profile.deletePhoto}</button>
        )}
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{userProfile.first_name} {userProfile.last_name}</h1>
          <StatusBadge type="verification" value={professional.verification_status ?? "pending"} labels={{ verified: t.profile.verified, pending: t.profile.pendingVerification, rejected: t.profile.rejected }} />
        </div>
        <p className="text-sm text-muted-foreground">
          {translateSpecialty(professional.specialty, locale)}
          {professional.cabinet_name && ` \u2014 ${professional.cabinet_name}`}
        </p>
      </div>
    </div>
  );
}
