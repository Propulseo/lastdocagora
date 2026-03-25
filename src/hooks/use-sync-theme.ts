"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";

type SyncTarget = "professional_settings" | "patient_settings";

/**
 * Syncs the next-themes preference with a role-specific settings table.
 * - On mount: reads DB preference and applies it (DB is source of truth)
 * - On change: writes to DB in background
 */
export function useSyncTheme(
  userId: string | undefined | null,
  target: SyncTarget = "professional_settings"
) {
  const { theme, setTheme } = useTheme();
  const hasSynced = useRef(false);

  // On mount: read from DB and apply
  useEffect(() => {
    if (!userId || hasSynced.current) return;
    hasSynced.current = true;

    const supabase = createClient();
    supabase
      .from(target)
      .select("theme_preference")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        if (data?.theme_preference) {
          setTheme(data.theme_preference);
        }
      });
  }, [userId, target, setTheme]);

  // On theme change: persist to DB
  useEffect(() => {
    if (!userId || !theme || !hasSynced.current) return;

    const supabase = createClient();
    supabase
      .from(target)
      .update({ theme_preference: theme })
      .eq("user_id", userId)
      .then(() => {
        // silent — localStorage is the fast path
      });
  }, [userId, theme, target]);
}
