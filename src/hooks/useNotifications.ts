"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean | null;
  read_at: string | null;
  related_id: string | null;
  created_at: string | null;
  params: Record<string, string> | null;
};

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  // Fetch initial notifications
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase
      .from("notifications")
      .select(
        "id, user_id, title, message, type, is_read, read_at, related_id, created_at, params"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (!cancelled) {
          setNotifications((data as Notification[]) ?? []);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Realtime subscription for INSERT and UPDATE
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`notif-bell-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications((prev) => [newNotif, ...prev].slice(0, 30));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAsRead = useCallback(
    async (id: string) => {
      const now = new Date().toISOString();

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: now, is_read: true } : n
        )
      );

      const supabase = createClient();
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: now, is_read: true })
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        // Revert on failure
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, read_at: null, is_read: false } : n
          )
        );
      }
    },
    [userId]
  );

  const markAsUnread = useCallback(
    async (id: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: null, is_read: false } : n
        )
      );

      const supabase = createClient();
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: null, is_read: false })
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        // Revert on failure
        const now = new Date().toISOString();
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, read_at: now, is_read: true } : n
          )
        );
      }
    },
    [userId]
  );

  const markAllAsRead = useCallback(async () => {
    const now = new Date().toISOString();
    const previous = [...notifications];

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        read_at: n.read_at ?? now,
        is_read: true,
      }))
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: now, is_read: true })
      .eq("user_id", userId)
      .is("read_at", null);

    if (error) {
      // Revert on failure
      setNotifications(previous);
    }
  }, [userId, notifications]);

  return { notifications, unreadCount, loading, markAsRead, markAsUnread, markAllAsRead };
}
