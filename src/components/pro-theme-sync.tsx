"use client";

import { useSyncTheme } from "@/hooks/use-sync-theme";

/**
 * Invisible component that syncs the professional's theme preference
 * between next-themes (localStorage) and Supabase (source of truth).
 */
export function ProThemeSync({ userId }: { userId: string }) {
  useSyncTheme(userId);
  return null;
}
