"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB (matches bucket limit)
const MAX_DIMENSION = 400;

function getExtension(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}

function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Blob conversion failed"))),
        file.type,
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

interface UseAvatarUploadOptions {
  userId: string;
  t: {
    uploadSuccess: string;
    uploadError: string;
    fileTooLarge: string;
    invalidFormat: string;
    deleteSuccess: string;
  };
}

export function useAvatarUpload({ userId, t }: UseAvatarUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function upload(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error(t.invalidFormat);
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error(t.fileTooLarge);
      return;
    }

    setUploading(true);
    try {
      const resized = await resizeImage(file);
      const ext = getExtension(file.type);
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, resized, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: dbError } = await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (dbError) throw dbError;

      toast.success(t.uploadSuccess);
      router.refresh();
    } catch {
      toast.error(t.uploadError);
    } finally {
      setUploading(false);
    }
  }

  async function remove() {
    setUploading(true);
    try {
      // Remove all possible extensions
      const paths = ["jpg", "png", "webp"].map(
        (ext) => `${userId}/avatar.${ext}`,
      );
      await supabase.storage.from("avatars").remove(paths);

      const { error: dbError } = await supabase
        .from("users")
        .update({ avatar_url: null })
        .eq("id", userId);

      if (dbError) throw dbError;

      toast.success(t.deleteSuccess);
      router.refresh();
    } catch {
      toast.error(t.uploadError);
    } finally {
      setUploading(false);
    }
  }

  return { uploading, upload, remove };
}
