"use client"

import Link from "next/link"
import { Bell, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { usePatientTranslations } from "@/locales/locale-context"

interface PatientLayoutHeaderProps {
  notificationCount: number
}

export function PatientLayoutHeader({ notificationCount }: PatientLayoutHeaderProps) {
  const { t } = usePatientTranslations()

  return (
    <>
      <span className="text-sm font-medium text-muted-foreground">
        {t.common.patientArea}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="size-9" asChild>
          <Link href="/patient/search" title={t.common.searchProfessionals}>
            <Search className="size-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9"
          asChild
        >
          <Link href="/patient/messages" title={t.common.notifications}>
            <Bell className="size-4" />
            {notificationCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 size-5 p-0 text-[10px]"
              >
                {notificationCount > 99 ? "99+" : notificationCount}
              </Badge>
            )}
          </Link>
        </Button>
      </div>
    </>
  )
}
