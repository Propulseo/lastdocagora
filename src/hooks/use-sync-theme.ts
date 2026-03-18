"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";

/**
 * Syncs the next-themes preference with the professional_settings table.
 * - On mount: reads DB preference and applies it (DB is source of truth)
 * - On change: writes to DB in background
 */
export function useSyncTheme(userId: string | undefined) {
  const { theme, setTheme } = useTheme();
  const hasSynced = useRef(false);

  // On mount: read from DB and apply
  useEffect(() => {
    if (!userId || hasSynced.current) return;
    hasSynced.current = true;

    const supabase = createClient();
    supabase
      .from("professional_settings")
      .select("theme_preference")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        if (data?.theme_preference) {
          setTheme(data.theme_preference);
        }
      });
  }, [userId, setTheme]);

  // On theme change: persist to DB
  useEffect(() => {
    if (!userId || !theme || !hasSynced.current) return;

    const supabase = createClient();
    supabase
      .from("professional_settings")
      .update({ theme_preference: theme })
      .eq("user_id", userId)
      .then(() => {
        // silent — localStorage is the fast path
      });
  }, [userId, theme]);
}
