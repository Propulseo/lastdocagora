"use client"

import { useEffect, useState, useCallback } from "react"
import { fetchAISettings, updateAISetting } from "@/app/(admin)/_actions/admin-ai-chat"
import type { AdminTranslations } from "@/lib/i18n/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const MODEL_OPTIONS = [
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
] as const

type ModelOption = (typeof MODEL_OPTIONS)[number]

interface SettingsState {
  model: ModelOption
  temperature: number
  max_tokens: number
  max_free_messages: number
  city_aliases: string
  language_mappings: string
  related_specialties: string
}

function isModelOption(value: unknown): value is ModelOption {
  return (
    typeof value === "string" &&
    MODEL_OPTIONS.includes(value as ModelOption)
  )
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return "{}"
  }
}

function safeJsonParse(text: string): { valid: boolean; value: unknown } {
  try {
    return { valid: true, value: JSON.parse(text) }
  } catch {
    return { valid: false, value: null }
  }
}

export function AIChatPromptManager({
  ct,
}: {
  ct: AdminTranslations["aiChat"]
}) {
  const [settings, setSettings] = useState<SettingsState>({
    model: "gpt-4o-mini",
    temperature: 0.3,
    max_tokens: 1000,
    max_free_messages: 5,
    city_aliases: "{}",
    language_mappings: "{}",
    related_specialties: "{}",
  })
  const [initialSettings, setInitialSettings] = useState<SettingsState | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchAISettings()

      const loaded: SettingsState = {
        model: isModelOption(data.model) ? data.model : "gpt-4o-mini",
        temperature: typeof data.temperature === "number" ? data.temperature : 0.3,
        max_tokens: typeof data.max_tokens === "number" ? data.max_tokens : 1000,
        max_free_messages:
          typeof data.max_free_messages === "number" ? data.max_free_messages : 5,
        city_aliases: safeJsonStringify(data.city_aliases ?? {}),
        language_mappings: safeJsonStringify(data.language_mappings ?? {}),
        related_specialties: safeJsonStringify(data.related_specialties ?? {}),
      }

      setSettings(loaded)
      setInitialSettings(loaded)
    } catch {
      toast.error(ct.promptManager.saveError)
    } finally {
      setLoading(false)
    }
  }, [ct.promptManager.saveError])

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  async function handleSave() {
    if (!initialSettings) return

    // Validate JSON fields before saving
    const jsonFields = [
      { key: "city_aliases", value: settings.city_aliases },
      { key: "language_mappings", value: settings.language_mappings },
      { key: "related_specialties", value: settings.related_specialties },
    ] as const

    for (const field of jsonFields) {
      const { valid } = safeJsonParse(field.value)
      if (!valid) {
        toast.error(`${ct.promptManager.saveError}: Invalid JSON in ${field.key}`)
        return
      }
    }

    setSaving(true)

    try {
      const updates: Array<{ key: string; value: unknown }> = []

      if (settings.model !== initialSettings.model) {
        updates.push({ key: "model", value: settings.model })
      }
      if (settings.temperature !== initialSettings.temperature) {
        updates.push({ key: "temperature", value: settings.temperature })
      }
      if (settings.max_tokens !== initialSettings.max_tokens) {
        updates.push({ key: "max_tokens", value: settings.max_tokens })
      }
      if (settings.max_free_messages !== initialSettings.max_free_messages) {
        updates.push({ key: "max_free_messages", value: settings.max_free_messages })
      }
      if (settings.city_aliases !== initialSettings.city_aliases) {
        const { value } = safeJsonParse(settings.city_aliases)
        updates.push({ key: "city_aliases", value })
      }
      if (settings.language_mappings !== initialSettings.language_mappings) {
        const { value } = safeJsonParse(settings.language_mappings)
        updates.push({ key: "language_mappings", value })
      }
      if (settings.related_specialties !== initialSettings.related_specialties) {
        const { value } = safeJsonParse(settings.related_specialties)
        updates.push({ key: "related_specialties", value })
      }

      if (updates.length === 0) {
        toast.success(ct.promptManager.saved)
        setSaving(false)
        return
      }

      const results = await Promise.all(
        updates.map((u) => updateAISetting(u.key, u.value))
      )

      const hasError = results.some((r) => !r.success)
      if (hasError) {
        toast.error(ct.promptManager.saveError)
      } else {
        toast.success(ct.promptManager.saved)
        setInitialSettings({ ...settings })
      }
    } catch {
      toast.error(ct.promptManager.saveError)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>{ct.promptManager.parameters}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Model */}
          <div className="space-y-2">
            <Label>{ct.promptManager.model}</Label>
            <Select
              value={settings.model}
              onValueChange={(value) => {
                if (isModelOption(value)) {
                  setSettings((prev) => ({ ...prev, model: value }))
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODEL_OPTIONS.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <Label>
              {ct.promptManager.temperature}:{" "}
              <span className="text-muted-foreground font-mono">
                {settings.temperature.toFixed(1)}
              </span>
            </Label>
            <Slider
              value={[settings.temperature]}
              onValueChange={(values) =>
                setSettings((prev) => ({
                  ...prev,
                  temperature: Math.round(values[0] * 10) / 10,
                }))
              }
              min={0}
              max={1}
              step={0.1}
              className="w-full sm:w-64"
            />
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <Label>{ct.promptManager.maxTokens}</Label>
            <Input
              type="number"
              value={settings.max_tokens}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  max_tokens: parseInt(e.target.value, 10) || 0,
                }))
              }
              min={1}
              className="w-full sm:w-64"
            />
          </div>

          {/* Max Free Messages */}
          <div className="space-y-2">
            <Label>{ct.promptManager.maxFreeMessages}</Label>
            <Input
              type="number"
              value={settings.max_free_messages}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  max_free_messages: parseInt(e.target.value, 10) || 0,
                }))
              }
              min={0}
              className="w-full sm:w-64"
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Prompt (readonly) */}
      <Card>
        <CardHeader>
          <CardTitle>{ct.promptManager.currentPrompt}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm italic">
            System prompt is dynamically generated based on locale, context, and
            professional data. It cannot be edited directly from this interface.
          </p>
        </CardContent>
      </Card>

      {/* Mappings */}
      <Card>
        <CardHeader>
          <CardTitle>{ct.promptManager.mappings}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* City Aliases */}
          <div className="space-y-2">
            <Label>{ct.promptManager.cityAliases}</Label>
            <Textarea
              value={settings.city_aliases}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  city_aliases: e.target.value,
                }))
              }
              rows={6}
              className="font-mono text-xs"
            />
          </div>

          {/* Language Mappings */}
          <div className="space-y-2">
            <Label>{ct.promptManager.languageMappings}</Label>
            <Textarea
              value={settings.language_mappings}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  language_mappings: e.target.value,
                }))
              }
              rows={6}
              className="font-mono text-xs"
            />
          </div>

          {/* Related Specialties */}
          <div className="space-y-2">
            <Label>{ct.promptManager.relatedSpecialties}</Label>
            <Textarea
              value={settings.related_specialties}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  related_specialties: e.target.value,
                }))
              }
              rows={6}
              className="font-mono text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "..." : ct.promptManager.save}
        </Button>
      </div>
    </div>
  )
}
