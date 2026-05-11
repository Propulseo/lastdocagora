/**
 * Backfill script: translate existing services that are missing FR/EN translations.
 *
 * Usage:
 *   npx tsx scripts/backfill-service-translations.ts
 *
 * Environment variables required:
 *   - NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - OPENAI_API_KEY
 *
 * This script is idempotent: it only fills columns that are currently NULL.
 */

import { createClient } from "@supabase/supabase-js"
import OpenAI from "openai"

// ---------------------------------------------------------------------------
// 1. Validate environment variables
// ---------------------------------------------------------------------------

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL

if (!SUPABASE_URL) {
  console.error(
    "ERROR: Missing SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable."
  )
  process.exit(1)
}

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "ERROR: Missing SUPABASE_SERVICE_ROLE_KEY environment variable."
  )
  process.exit(1)
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!OPENAI_API_KEY) {
  console.error("ERROR: Missing OPENAI_API_KEY environment variable.")
  process.exit(1)
}

// ---------------------------------------------------------------------------
// 2. Create clients
// ---------------------------------------------------------------------------

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

// ---------------------------------------------------------------------------
// 3. Translation helper
// ---------------------------------------------------------------------------

type TranslationResult = {
  name_fr: string
  name_en: string
  description_fr: string | null
  description_en: string | null
}

async function translateService(
  name: string,
  description: string | null
): Promise<TranslationResult | null> {
  const desc =
    description !== null &&
    description !== undefined &&
    description.trim() !== ""
      ? description
      : null

  const userContent = `Translate this medical service from Portuguese into French (fr) and English (en).\n\nService name: "${name}"\n${desc ? `Description: "${desc}"\n` : ""}\nReturn JSON: { "name": { "fr": "...", "en": "..." }${desc ? `, "description": { "fr": "...", "en": "..." }` : ""} }`

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 300,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a medical translation assistant. Return only valid JSON.",
      },
      {
        role: "user",
        content: userContent,
      },
    ],
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    return null
  }

  const parsed = JSON.parse(content) as {
    name?: { fr?: string; en?: string }
    description?: { fr?: string; en?: string }
  }

  if (!parsed.name) {
    return null
  }

  return {
    name_fr: parsed.name.fr ?? name,
    name_en: parsed.name.en ?? name,
    description_fr: desc ? (parsed.description?.fr ?? desc) : null,
    description_en: desc ? (parsed.description?.en ?? desc) : null,
  }
}

// ---------------------------------------------------------------------------
// 4. Utility: sleep
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// 5. Main
// ---------------------------------------------------------------------------

async function main() {
  // Fetch services that are missing at least one translation column
  const { data: services, error } = await supabase
    .from("services")
    .select(
      "id, name, name_pt, name_fr, name_en, description, description_pt, description_fr, description_en"
    )
    .or("name_fr.is.null,name_en.is.null")

  if (error) {
    console.error("ERROR: Failed to fetch services:", error.message)
    process.exit(1)
  }

  if (!services || services.length === 0) {
    console.log("No services need translation. All done!")
    process.exit(0)
  }

  console.log(`Found ${services.length} services to translate`)

  let translated = 0

  for (let i = 0; i < services.length; i++) {
    const service = services[i]
    const index = i + 1

    // Determine source text: name_pt takes priority, fallback to name
    const sourceName: string = service.name_pt ?? service.name
    // Determine source description: description_pt takes priority, fallback to description
    const sourceDesc: string | null =
      service.description_pt ?? service.description ?? null

    try {
      const result = await translateService(sourceName, sourceDesc)

      if (!result) {
        console.warn(
          `[${index}/${services.length}] WARNING: Translation returned null for "${sourceName}" — skipping`
        )
        continue
      }

      // Build update payload: only fill columns that are currently NULL
      const updatePayload: Record<string, string> = {}

      // Backfill description_pt from legacy description if missing
      if (service.description_pt === null && service.description) {
        updatePayload.description_pt = service.description
      }
      if (service.name_fr === null) {
        updatePayload.name_fr = result.name_fr
      }
      if (service.name_en === null) {
        updatePayload.name_en = result.name_en
      }
      if (service.description_fr === null && result.description_fr !== null) {
        updatePayload.description_fr = result.description_fr
      }
      if (service.description_en === null && result.description_en !== null) {
        updatePayload.description_en = result.description_en
      }

      if (Object.keys(updatePayload).length === 0) {
        console.log(
          `[${index}/${services.length}] - "${sourceName}" — already translated, skipping`
        )
        continue
      }

      const { error: updateError } = await supabase
        .from("services")
        .update(updatePayload)
        .eq("id", service.id)

      if (updateError) {
        console.warn(
          `[${index}/${services.length}] WARNING: DB update failed for "${sourceName}": ${updateError.message}`
        )
        continue
      }

      console.log(
        `[${index}/${services.length}] OK "${sourceName}" -> FR: "${result.name_fr}", EN: "${result.name_en}"`
      )
      translated++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn(
        `[${index}/${services.length}] WARNING: Translation failed for "${sourceName}": ${message} — skipping`
      )
    }

    // Delay between API calls to avoid rate limits
    if (i < services.length - 1) {
      await sleep(200)
    }
  }

  console.log(
    `Done! ${translated} services translated out of ${services.length} found.`
  )
}

main().catch((err) => {
  console.error("Unhandled error:", err)
  process.exit(1)
})
