"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { pt, enGB, fr, type Locale } from "date-fns/locale"
import { Bell, BellOff, Check, CheckCheck, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useNotifications, type Notification } from "@/hooks/useNotifications"

export interface NotificationBellTranslations {
  title: string
  markAllRead: string
  empty: string
  markAsRead: string
  markAsUnread: string
  justNow: string
}

interface NotificationBellProps {
  userId: string
  translations: NotificationBellTranslations
  locale?: string
  role: "patient" | "professional" | "admin"
}

const dateLocales: Record<string, Locale> = { pt, en: enGB, fr }

function getNotificationHref(
  notif: Notification,
  role: "patient" | "professional" | "admin",
): string | null {
  if (notif.link) return notif.link

  switch (notif.type) {
    case "appointment":
      if (role === "professional") return "/pro/agenda"
      if (role === "patient") return "/patient/appointments"
      return "/admin/appointments"
    case "support":
      if (role === "professional") return "/pro/support"
      if (role === "patient") return "/patient/support"
      return "/admin/support"
    case "walk_in":
      if (role === "professional") return "/pro/today"
      return null
    case "reminder":
    case "system":
    default:
      return null
  }
}

function formatDate(date: string, locale: Locale, justNow: string): string {
  const diff = Date.now() - new Date(date).getTime()
  if (diff < 60_000) return justNow
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale })
}

export function NotificationBell({
  userId,
  translations: t,
  locale = "pt",
  role,
}: NotificationBellProps) {
  const { notifications, unreadCount, markAsRead, markAsUnread, markAllAsRead } =
    useNotifications(userId)
  const [open, setOpen] = useState(false)

  const dateLocale = dateLocales[locale] ?? dateLocales.pt

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Bell className="size-5" strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 p-0"
        sideOffset={8}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold text-foreground">{t.title}</h4>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto gap-1 px-2 py-1 text-xs text-primary"
            onClick={(e) => {
              e.stopPropagation()
              markAllAsRead()
            }}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="size-3.5" />
            {t.markAllRead}
          </Button>
        </div>

        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground">
              <BellOff className="mb-2 size-8 opacity-30" />
              {t.empty}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => {
                const isUnread = !notif.read_at
                const href = getNotificationHref(notif, role)

                const content = (
                  <>
                    <span
                      className={`mt-1.5 size-2 shrink-0 rounded-full bg-primary ${
                        isUnread ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm ${
                          isUnread
                            ? "font-medium text-foreground"
                            : "font-normal text-muted-foreground"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {notif.message}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground/70">
                        {formatDate(notif.created_at, dateLocale, t.justNow)}
                      </p>
                    </div>
                    <div className="mt-0.5 ml-2 flex shrink-0 flex-col gap-0.5">
                      {isUnread ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            markAsRead(notif.id)
                          }}
                          aria-label={t.markAsRead}
                          title={t.markAsRead}
                        >
                          <Check className="size-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            markAsUnread(notif.id)
                          }}
                          aria-label={t.markAsUnread}
                          title={t.markAsUnread}
                        >
                          <RotateCcw className="size-4" />
                        </Button>
                      )}
                    </div>
                  </>
                )

                const baseClass = `flex w-full items-start gap-2 px-4 py-3 transition-colors ${
                  isUnread
                    ? "bg-primary/[0.06] hover:bg-primary/10"
                    : "hover:bg-muted"
                }`

                if (href) {
                  return (
                    <Link
                      key={notif.id}
                      href={href}
                      className={`${baseClass} cursor-pointer`}
                      onClick={() => {
                        if (isUnread) markAsRead(notif.id)
                        setOpen(false)
                      }}
                    >
                      {content}
                    </Link>
                  )
                }

                return (
                  <div key={notif.id} className={`${baseClass} cursor-default`}>
                    {content}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
