import "server-only"

import { getOpenAIClient } from "./openai-client"

export type TranslationInput = {
  name: string
  description?: string | null
  sourceLocale: "pt" | "fr" | "en"
}

export type TranslationResult = {
  name_pt: string
  name_fr: string
  name_en: string
  description_pt: string | null
  description_fr: string | null
  description_en: string | null
}

type TranslationResponse = {
  name: Record<string, string>
  description?: Record<string, string> | null
}

const LOCALE_LABELS: Record<string, string> = {
  pt: "Portuguese",
  fr: "French",
  en: "English",
}

function getTargetLocales(
  sourceLocale: "pt" | "fr" | "en"
): Array<"pt" | "fr" | "en"> {
  const all: Array<"pt" | "fr" | "en"> = ["pt", "fr", "en"]
  return all.filter((l) => l !== sourceLocale)
}

export async function translateService(
  input: TranslationInput
): Promise<TranslationResult | null> {
  try {
    const openai = getOpenAIClient()
    const targetLocales = getTargetLocales(input.sourceLocale)

    const targetLabels = targetLocales
      .map((l) => `${LOCALE_LABELS[l]} (${l})`)
      .join(" and ")

    const hasDescription =
      input.description !== null && input.description !== undefined && input.description.trim() !== ""

    let userMessage = `Translate the following medical service name from ${LOCALE_LABELS[input.sourceLocale]} into ${targetLabels}.`

    if (hasDescription) {
      userMessage += ` Also translate the description.`
    }

    userMessage += `\n\nService name: "${input.name}"`

    if (hasDescription) {
      userMessage += `\nDescription: "${input.description}"`
    }

    userMessage += `\n\nReturn JSON with this structure:\n{\n  "name": { "${targetLocales[0]}": "...", "${targetLocales[1]}": "..." }`

    if (hasDescription) {
      userMessage += `,\n  "description": { "${targetLocales[0]}": "...", "${targetLocales[1]}": "..." }`
    }

    userMessage += `\n}`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 300,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a medical translation assistant. Return only valid JSON.",
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return null
    }

    const parsed: TranslationResponse = JSON.parse(content)

    if (!parsed.name) {
      return null
    }

    const result: TranslationResult = {
      name_pt: input.sourceLocale === "pt" ? input.name : (parsed.name.pt ?? input.name),
      name_fr: input.sourceLocale === "fr" ? input.name : (parsed.name.fr ?? input.name),
      name_en: input.sourceLocale === "en" ? input.name : (parsed.name.en ?? input.name),
      description_pt: null,
      description_fr: null,
      description_en: null,
    }

    if (hasDescription && input.description) {
      result.description_pt =
        input.sourceLocale === "pt"
          ? input.description
          : (parsed.description?.pt ?? input.description)
      result.description_fr =
        input.sourceLocale === "fr"
          ? input.description
          : (parsed.description?.fr ?? input.description)
      result.description_en =
        input.sourceLocale === "en"
          ? input.description
          : (parsed.description?.en ?? input.description)
    }

    return result
  } catch {
    return null
  }
}
