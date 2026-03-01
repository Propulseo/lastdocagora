"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useProfessionalI18n } from "@/lib/i18n/pro";

export interface CalendarConnection {
  id: string;
  provider: string;
  account_email: string;
  created_at: string;
  revoked_at: string | null;
}

export interface CalendarEntry {
  id: string;
  external_calendar_id: string;
  name: string;
  color: string | null;
  is_primary: boolean;
  selected: boolean;
  timezone: string | null;
  connection_id: string;
  calendar_connections: {
    id: string;
    provider: string;
    account_email: string;
    revoked_at: string | null;
  };
}

export function useCalendarIntegration(
  open: boolean,
  onSyncComplete: () => void
) {
  const { t } = useProfessionalI18n();
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [calendars, setCalendars] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [connRes, calRes] = await Promise.all([
      fetch("/api/integrations/connections"),
      fetch("/api/integrations/calendars"),
    ]);
    if (connRes.ok) {
      const data = await connRes.json();
      setConnections(data.connections ?? []);
    }
    if (calRes.ok) {
      const data = await calRes.json();
      setCalendars(data.calendars ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) loadData();
  }, [open, loadData]);

  const activeConnections = connections.filter((c) => !c.revoked_at);

  const handleConnectGoogle = () => {
    window.location.href = "/api/integrations/google/start";
  };

  const handleRevoke = async (connectionId: string) => {
    setRevoking(connectionId);
    const res = await fetch("/api/integrations/connections", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ connectionId }),
    });
    if (res.ok) {
      toast.success(t.agenda.calendarDisconnected);
      await loadData();
      onSyncComplete();
    } else {
      toast.error(t.agenda.calendarError);
    }
    setRevoking(null);
  };

  const handleToggleCalendar = async (
    calendarId: string,
    selected: boolean
  ) => {
    setCalendars((prev) =>
      prev.map((c) => (c.id === calendarId ? { ...c, selected } : c))
    );
    const res = await fetch("/api/integrations/calendars", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ calendarId, selected }),
    });
    if (!res.ok) {
      setCalendars((prev) =>
        prev.map((c) =>
          c.id === calendarId ? { ...c, selected: !selected } : c
        )
      );
      toast.error(t.agenda.calendarError);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    const res = await fetch("/api/integrations/sync", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      toast.success(
        t.agenda.syncComplete.replace(
          "{{count}}",
          String(data.totalUpserted)
        )
      );
      onSyncComplete();
    } else {
      toast.error(t.agenda.calendarError);
    }
    setSyncing(false);
  };

  return {
    calendars,
    loading,
    syncing,
    revoking,
    activeConnections,
    handleConnectGoogle,
    handleRevoke,
    handleToggleCalendar,
    handleSync,
  };
}
