"use client";

import { useSyncTheme } from "@/hooks/use-sync-theme";

type SyncTarget = "professional_settings" | "patient_settings";

export function ThemeSync({
  userId,
  target,
}: {
  userId: string;
  target: SyncTarget;
}) {
  useSyncTheme(userId, target);
  return null;
}
