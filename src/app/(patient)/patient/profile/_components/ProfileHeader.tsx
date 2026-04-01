"use client"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { PatientTranslations } from "@/locales/patient"

interface ProfileHeaderProps {
  userId: string
  firstName: string
  lastName: string
  email: string
  gender: string | null
  initialAvatarUrl: string | null
  genderLabels: Record<string, string>
  t: PatientTranslations["profile"]
}

export function ProfileHeader({
  userId,
  firstName,
  lastName,
  email,
  gender,
  initialAvatarUrl,
  genderLabels,
  t,
}: ProfileHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [uploading, setUploading] = useState(false)

  const initials =
    `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "P"

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error(t.invalidFormat)
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t.fileTooLarge)
      return
    }

    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
    const path = `${userId}/avatar.${ext}`

    const objectUrl = URL.createObjectURL(file)
    setAvatarUrl(objectUrl)

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setAvatarUrl(initialAvatarUrl)
      toast.error(t.uploadError)
      setUploading(false)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(path)

    const publicUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`

    const { error: updateError } = await supabase
      .from("users")
      .update({ avatar_url: publicUrl })
      .eq("id", userId)

    if (updateError) {
      toast.error(t.uploadError)
      setUploading(false)
      return
    }

    URL.revokeObjectURL(objectUrl)
    setAvatarUrl(publicUrl)
    setUploading(false)
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 pt-6 text-center sm:flex-row sm:items-center sm:text-left">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={handleAvatarUpload}
        />
        <button
          type="button"
          className="relative group cursor-pointer rounded-full min-h-[44px] min-w-[44px]"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          aria-label={t.changePhoto}
        >
          <Avatar size="lg">
            {avatarUrl && (
              <AvatarImage
                src={avatarUrl}
                alt={`${firstName} ${lastName}`}
              />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            {uploading ? (
              <Loader2 className="size-5 animate-spin text-white" />
            ) : (
              <Camera className="size-5 text-white" />
            )}
          </div>
        </button>
        <div>
          <h2 className="text-xl font-semibold">
            {firstName} {lastName}
          </h2>
          <p className="text-sm text-muted-foreground">{email}</p>
          {gender && (
            <Badge variant="secondary" className="mt-1">
              {genderLabels[gender] ?? gender}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
