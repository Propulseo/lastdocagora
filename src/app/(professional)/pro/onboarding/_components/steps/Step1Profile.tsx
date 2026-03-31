"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, Loader2 } from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { useAvatarUpload } from "@/app/(professional)/pro/profile/_hooks/useAvatarUpload";

export interface StepHandle {
  submit: () => boolean;
}

interface Step1Props {
  userId: string;
  initialData: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    registration_number: string | null;
    languages_spoken: string[] | null;
  };
  onSubmit: (data: {
    first_name: string;
    last_name: string;
    bio: string;
    registration_number: string;
    languages_spoken: string;
  }) => void;
}

export const Step1Profile = forwardRef<StepHandle, Step1Props>(
  function Step1Profile({ userId, initialData, onSubmit }, ref) {
    const { t } = useProfessionalI18n();
    const ob = t.onboarding;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [firstName, setFirstName] = useState(initialData.first_name ?? "");
    const [lastName, setLastName] = useState(initialData.last_name ?? "");
    const [bio, setBio] = useState(initialData.bio ?? "");
    const [regNumber, setRegNumber] = useState(initialData.registration_number ?? "");
    const [languages, setLanguages] = useState(
      initialData.languages_spoken?.join(", ") ?? "",
    );
    const [errors, setErrors] = useState<Record<string, string>>({});

    const { uploading, upload } = useAvatarUpload({
      userId,
      t: {
        uploadSuccess: ob.step1.photo,
        uploadError: ob.errors.uploadError,
        fileTooLarge: ob.errors.fileTooLarge,
        invalidFormat: ob.errors.invalidFormat,
        deleteSuccess: "",
      },
    });

    const initials = (firstName?.[0] ?? "") + (lastName?.[0] ?? "");

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (file) upload(file);
      e.target.value = "";
    }

    useImperativeHandle(ref, () => ({
      submit() {
        const errs: Record<string, string> = {};
        if (!firstName.trim()) errs.first_name = ob.errors.firstNameRequired;
        if (!lastName.trim()) errs.last_name = ob.errors.lastNameRequired;
        if (!regNumber.trim())
          errs.registration_number = ob.errors.registrationRequired;
        setErrors(errs);
        if (Object.keys(errs).length > 0) return false;

        onSubmit({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          bio: bio.trim(),
          registration_number: regNumber.trim(),
          languages_spoken: languages,
        });
        return true;
      },
    }));

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">{ob.step1.title}</h2>
          <p className="text-sm text-muted-foreground">{ob.step1.subtitle}</p>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="group relative size-20 shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => !uploading && fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Avatar className="size-20">
              <AvatarImage src={initialData.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                {initials || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/40">
              {uploading ? (
                <Loader2 className="size-5 animate-spin text-white" />
              ) : (
                <Pencil className="size-4 text-white opacity-0 transition-opacity group-hover:opacity-100" />
              )}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <div>
            <p className="text-sm font-medium">{ob.step1.photo}</p>
            <p className="text-xs text-muted-foreground">{ob.step1.photoHint}</p>
          </div>
        </div>

        {/* Fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{ob.step1.firstName} *</Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={ob.step1.firstNamePlaceholder}
            />
            {errors.first_name && (
              <p className="text-xs text-destructive">{errors.first_name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{ob.step1.lastName} *</Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={ob.step1.lastNamePlaceholder}
            />
            {errors.last_name && (
              <p className="text-xs text-destructive">{errors.last_name}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{ob.step1.registrationNumber} *</Label>
          <Input
            value={regNumber}
            onChange={(e) => setRegNumber(e.target.value)}
            placeholder={ob.step1.registrationNumberPlaceholder}
          />
          {errors.registration_number && (
            <p className="text-xs text-destructive">
              {errors.registration_number}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>{ob.step1.bio}</Label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 500))}
            placeholder={ob.step1.bioPlaceholder}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            {ob.step1.bioHint.replace("{count}", String(bio.length))}
          </p>
        </div>

        <div className="space-y-2">
          <Label>{ob.step1.languages}</Label>
          <Input
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
            placeholder={ob.step1.languagesPlaceholder}
          />
          <p className="text-xs text-muted-foreground">{ob.step1.languagesHint}</p>
        </div>
      </div>
    );
  },
);
