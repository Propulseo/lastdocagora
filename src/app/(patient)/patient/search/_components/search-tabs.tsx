"use client"

import { type ReactNode } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Search, Sparkles, MapPin } from "lucide-react"
import { Card } from "@/components/ui/card"
import { AISearchChat } from "./ai-search-chat"
import type { PatientTranslations } from "@/locales/patient"

export function SearchTabs({
  classicContent,
  mapContent,
  locale,
  t,
  onTabChange,
}: {
  classicContent: ReactNode
  mapContent?: ReactNode
  locale: string
  t: PatientTranslations["search"]
  onTabChange?: (tab: string) => void
}) {
  return (
    <Tabs defaultValue="ai" className="space-y-3" onValueChange={onTabChange}>
      <TabsList className="h-9">
        <TabsTrigger value="ai" className="gap-1.5 text-sm px-3 h-7">
          <Sparkles className="size-3.5" />
          {t.aiTab}
        </TabsTrigger>
        <TabsTrigger value="classic" className="gap-1.5 text-sm px-3 h-7">
          <Search className="size-3.5" />
          {t.classicTab}
        </TabsTrigger>
        <TabsTrigger value="map" className="gap-1.5 text-sm px-3 h-7">
          <MapPin className="size-3.5" />
          {t.mapTab}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="ai" className="mt-2">
        <Card>
          <AISearchChat locale={locale} t={t} />
        </Card>
      </TabsContent>

      <TabsContent value="classic">{classicContent}</TabsContent>

      <TabsContent value="map" className="mt-0">{mapContent}</TabsContent>
    </Tabs>
  )
}
