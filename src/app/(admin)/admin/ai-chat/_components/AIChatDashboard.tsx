"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n"
import { PageHeader } from "@/components/shared/page-header"
import { AIChatAnalytics } from "./AIChatAnalytics"
import { AIChatConversations } from "./AIChatConversations"
import { AIChatPromptManager } from "./AIChatPromptManager"
import { AIChatFeedbackReview } from "./AIChatFeedbackReview"

export function AIChatDashboard() {
  const { t } = useAdminI18n()
  const ct = t.aiChat
  const [activeTab, setActiveTab] = useState("analytics")

  return (
    <div className="space-y-6">
      <PageHeader title={ct.title} description={ct.description} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="analytics">{ct.tabs.analytics}</TabsTrigger>
          <TabsTrigger value="conversations">{ct.tabs.conversations}</TabsTrigger>
          <TabsTrigger value="promptManager">{ct.tabs.promptManager}</TabsTrigger>
          <TabsTrigger value="feedbackReview">{ct.tabs.feedbackReview}</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-6">
          <AIChatAnalytics ct={ct} />
        </TabsContent>

        <TabsContent value="conversations" className="mt-6">
          <AIChatConversations ct={ct} />
        </TabsContent>

        <TabsContent value="promptManager" className="mt-6">
          <AIChatPromptManager ct={ct} />
        </TabsContent>

        <TabsContent value="feedbackReview" className="mt-6">
          <AIChatFeedbackReview ct={ct} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
