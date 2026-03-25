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
}: {
  classicContent: ReactNode
  mapContent?: ReactNode
  locale: string
  t: PatientTranslations["search"]
}) {
  return (
    <Tabs defaultValue="classic" className="space-y-4">
      <TabsList>
        <TabsTrigger value="classic" className="gap-2">
          <Search className="size-4" />
          {t.classicTab}
        </TabsTrigger>
        <TabsTrigger value="map" className="gap-2">
          <MapPin className="size-4" />
          {t.mapTab}
        </TabsTrigger>
        <TabsTrigger value="ai" className="gap-2">
          <Sparkles className="size-4" />
          {t.aiTab}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="classic">{classicContent}</TabsContent>

      <TabsContent value="map" className="mt-0">{mapContent}</TabsContent>

      <TabsContent value="ai">
        <Card>
          <AISearchChat locale={locale} t={t} />
        </Card>
      </TabsContent>
    </Tabs>
  )
}
