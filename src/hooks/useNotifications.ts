"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  markNotificationRead,
  markNotificationUnread,
  markAllNotificationsRead,
} from "@/app/_actions/notification-actions"

export type Notification = {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  link: string | null
  read_at: string | null
  created_at: string
}

export type NotificationsState = {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markAsRead: (id: string) => Promise<void>
  markAsUnread: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

export function useNotifications(userId: string): NotificationsState {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const unreadCount = notifications.filter((n) => !n.read_at).length

  // Fetch initial notifications
  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    supabase
      .from("notifications")
      .select("id, user_id, type, title, message, link, read_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (!cancelled) {
          setNotifications((data as Notification[]) ?? [])
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  // Realtime subscription — INSERT only
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`notif-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as Notification
          setNotifications((prev) => [row, ...prev].slice(0, 30))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const markAsRead = useCallback(async (id: string) => {
    const now = new Date().toISOString()

    // Optimistic
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: now } : n)),
    )

    // Server action
    const { success } = await markNotificationRead(id)
    if (!success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: null } : n)),
      )
    }
  }, [])

  const markAsUnread = useCallback(async (id: string) => {
    let previousReadAt: string | null = null
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          previousReadAt = n.read_at
          return { ...n, read_at: null }
        }
        return n
      }),
    )

    const { success } = await markNotificationUnread(id)
    if (!success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: previousReadAt } : n,
        ),
      )
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    const now = new Date().toISOString()
    const snapshot = [...notifications]

    // Optimistic
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? now })),
    )

    // Server action
    const { success } = await markAllNotificationsRead()
    if (!success) {
      setNotifications(snapshot)
    }
  }, [notifications])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAsUnread,
    markAllAsRead,
  }
}
