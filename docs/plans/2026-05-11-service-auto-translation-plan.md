# Service Auto-Translation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Auto-translate professional service names/descriptions into PT/FR/EN via OpenAI gpt-4o-mini when a pro creates or edits a service.

**Architecture:** Single OpenAI call per service create/edit generates translations for the 2 missing locales. Translation happens synchronously in the server action. UI simplified: single name/description field by default, optional toggle reveals manual translation tabs. Existing `getServiceName()` fallback chain handles cases where translations are missing.

**Tech Stack:** OpenAI SDK (already installed), gpt-4o-mini, Next.js server actions, Supabase, react-hook-form, shadcn/ui Tabs/Collapsible.

**No test framework configured** — verification is manual (`npm run build` + `npm run lint` + `npm run check:i18n`).

---

## Task 1: Create translation function

**Files:**
- Create: `src/lib/ai/translate-service.ts`

**Step 1: Create `translateService()` function**

```typescript
// src/lib/ai/translate-service.ts
import "server-only"
import { getOpenAIClient } from "./openai-client"

type Locale = "pt" | "fr" | "en"

interface TranslationInput {
  name: string
  description?: string | null
  sourceLocale: Locale
}

interface TranslationResult {
  name_pt: string
  name_fr: string
  name_en: string
  description_pt: string | null
  description_fr: string | null
  description_en: string | null
}

const LOCALE_LABELS: Record<Locale, string> = {
  pt: "Portuguese",
  fr: "French",
  en: "English",
}

export async function translateService(
  input: TranslationInput,
): Promise<TranslationResult | null> {
  const { name, description, sourceLocale } = input
  const targetLocales = (["pt", "fr", "en"] as Locale[]).filter(
    (l) => l !== sourceLocale,
  )

  // Build the source result first
  const result: TranslationResult = {
    name_pt: sourceLocale === "pt" ? name : "",
    name_fr: sourceLocale === "fr" ? name : "",
    name_en: sourceLocale === "en" ? name : "",
    description_pt: sourceLocale === "pt" ? (description ?? null) : null,
    description_fr: sourceLocale === "fr" ? (description ?? null) : null,
    description_en: sourceLocale === "en" ? (description ?? null) : null,
  }

  const hasDescription = description && description.trim().length > 0

  const prompt = `Translate this medical/healthcare service into ${targetLocales.map((l) => LOCALE_LABELS[l]).join(" and ")}.

Service name (${LOCALE_LABELS[sourceLocale]}): "${name}"${hasDescription ? `\nService description (${LOCALE_LABELS[sourceLocale]}): "${description}"` : ""}

Return ONLY a JSON object with these exact keys:
${targetLocales.map((l) => `"name_${l}": "translated name in ${LOCALE_LABELS[l]}"`).join(",\n")}${hasDescription ? `,\n${targetLocales.map((l) => `"description_${l}": "translated description in ${LOCALE_LABELS[l]}"`).join(",\n")}` : ""}

Rules:
- Keep medical terminology accurate
- Keep it concise and professional
- Do not add explanations, only the JSON`

  try {
    const client = getOpenAIClient()
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a medical translation assistant. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 300,
      response_format: { type: "json_object" },
    })

    const content = response.choices[0]?.message?.content
    if (!content) return null

    const parsed = JSON.parse(content)

    for (const locale of targetLocales) {
      const nameKey = `name_${locale}` as keyof TranslationResult
      const descKey = `description_${locale}` as keyof TranslationResult
      if (typeof parsed[nameKey] === "string" && parsed[nameKey]) {
        ;(result as Record<string, string | null>)[nameKey] = parsed[nameKey]
      }
      if (hasDescription && typeof parsed[descKey] === "string") {
        ;(result as Record<string, string | null>)[descKey] =
          parsed[descKey] || null
      }
    }

    return result
  } catch {
    return null
  }
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: No errors related to the new file.

**Step 3: Commit**

```bash
git add src/lib/ai/translate-service.ts
git commit -m "feat: add translateService() helper using gpt-4o-mini"
```

---

## Task 2: Add i18n keys for auto-translation UI

**Files:**
- Modify: `src/locales/pt/professional/services.json`
- Modify: `src/locales/fr/professional/services.json`
- Modify: `src/locales/en/professional/services.json`

**Step 1: Add new keys to all 3 locale files**

Add these keys after the `"descTabEn"` line (line 54) in each file:

**PT:**
```json
"autoTranslated": "Traduções geradas automaticamente",
"editTranslations": "Editar traduções manualmente",
"hideTranslations": "Ocultar traduções"
```

**FR:**
```json
"autoTranslated": "Traductions générées automatiquement",
"editTranslations": "Modifier les traductions manuellement",
"hideTranslations": "Masquer les traductions"
```

**EN:**
```json
"autoTranslated": "Translations auto-generated",
"editTranslations": "Edit translations manually",
"hideTranslations": "Hide translations"
```

**Step 2: Verify i18n**

Run: `npm run check:i18n`
Expected: No missing keys.

**Step 3: Commit**

```bash
git add src/locales/*/professional/services.json
git commit -m "feat(i18n): add auto-translation UI keys for services"
```

---

## Task 3: Integrate auto-translation in server actions

**Files:**
- Modify: `src/app/(professional)/_actions/services.ts`

**Step 1: Add `sourceLocale` param and auto-translation to `createService()`**

Key changes:
- Import `translateService` from `@/lib/ai/translate-service`
- Add `sourceLocale?: "pt" | "fr" | "en"` to both `createService` and `updateService` form data
- After building the insert/update object, call `translateService()` for any locale columns the pro didn't fill manually
- If `translateService()` returns null (OpenAI failure), proceed with source language only — the existing fallback in `getServiceName()` handles this

The logic for merging manual overrides:
```
// For each target locale:
// If the pro provided a manual value (e.g. name_fr is non-empty), keep it
// Otherwise, use the auto-translated value
```

**Step 2: Same for `updateService()`**

Same pattern. Only call translation if the name or description actually changed (compare with previous values if available, or always re-translate — simpler and cost is negligible with gpt-4o-mini).

**Step 3: Verify build**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/app/(professional)/_actions/services.ts
git commit -m "feat: auto-translate services on create/update via gpt-4o-mini"
```

---

## Task 4: Integrate auto-translation in onboarding step 3

**Files:**
- Modify: `src/app/(professional)/pro/onboarding/_actions/onboarding-steps.ts`

**Step 1: Add auto-translation to `handleStep3()`**

Import `translateService`. For each service in the array:
- Call `translateService()` with `sourceLocale: "pt"` (onboarding default — the main `name` field is always PT in the schema)
- Merge results into `servicesToInsert`, preserving any manual `name_fr`/`name_en` the pro provided
- Use `Promise.allSettled()` to translate all services in parallel without blocking each other

**Step 2: Verify build**

Run: `npm run build`

**Step 3: Commit**

```bash
git add src/app/(professional)/pro/onboarding/_actions/onboarding-steps.ts
git commit -m "feat: auto-translate services during onboarding step 3"
```

---

## Task 5: Simplify Create Service Dialog (Option B UI)

**Files:**
- Modify: `src/app/(professional)/pro/services/_components/create-service-dialog.tsx`

**Step 1: Refactor to single field + toggle**

Key changes:
- Remove the Tabs for name by default — show a single Input for `name`
- Remove the Tabs for description by default — show a single Textarea for `description`
- Add a small clickable text link: `sv.editTranslations` / `sv.hideTranslations` that toggles visibility of the PT/FR/EN tabs
- When toggled open, show the 3-tab interface (current behavior)
- When toggled closed (default), only the single field is visible
- Add `sourceLocale` (from `useProfessionalI18n().locale`) to the `createService()` call
- Add a subtle `<p>` hint below the name field: `sv.autoTranslated` in muted text
- Remove the `(optional)` labels from FR/EN tabs when shown — they're now auto-filled

The default tab when toggle is open should match the pro's current locale.

**Step 2: Verify build + lint**

Run: `npm run build && npm run lint`

**Step 3: Commit**

```bash
git add src/app/(professional)/pro/services/_components/create-service-dialog.tsx
git commit -m "feat: simplify create-service dialog with auto-translation toggle"
```

---

## Task 6: Simplify Edit Service Dialog (Option B UI)

**Files:**
- Modify: `src/app/(professional)/pro/services/_components/edit-service-dialog.tsx`
- Modify: `src/app/(professional)/pro/services/_components/EditServiceFields.tsx`

**Step 1: Update EditServiceFields to support collapsed/expanded mode**

Add a `collapsed` boolean prop. When `collapsed=true`, show only the single name + description fields (no tabs). When `collapsed=false`, show the full tabs. Also add a `defaultTab` prop (the pro's active locale).

**Step 2: Update EditServiceDialog**

- Add toggle state for showing/hiding translations
- Pass `sourceLocale` to `updateService()`
- Add the `sv.autoTranslated` hint
- Pre-populate the main field from `service.name_{locale}` based on the pro's active locale (not always PT)

**Step 3: Verify build + lint**

Run: `npm run build && npm run lint`

**Step 4: Commit**

```bash
git add src/app/(professional)/pro/services/_components/edit-service-dialog.tsx
git add src/app/(professional)/pro/services/_components/EditServiceFields.tsx
git commit -m "feat: simplify edit-service dialog with auto-translation toggle"
```

---

## Task 7: Simplify Onboarding ServiceFormFields

**Files:**
- Modify: `src/app/(professional)/pro/onboarding/_components/steps/ServiceFormFields.tsx`
- Modify: `src/app/(professional)/pro/onboarding/_components/steps/Step3Services.tsx`

**Step 1: Remove tabs from ServiceFormFields**

- Replace the 3-tab name input with a single Input
- Remove `name_fr`, `name_en` from the `ServiceDraft` interface (translations are now auto-generated server-side)
- Remove corresponding `onUpdate` calls for `name_fr`, `name_en`
- Remove tab-related labels from the `labels` prop interface
- Add the `sv.autoTranslated` hint text below the name field

**Step 2: Update Step3Services to match**

- Remove `name_fr`, `name_en` from draft initialization and `addDraft()`
- Remove them from the `updateDraft` function
- Remove tab labels from `labels` prop passed to `ServiceFormFields`
- Clean up the submit handler (no more `name_fr`, `name_en` in the output)

**Step 3: Update onboarding schema**

In `src/app/(professional)/pro/onboarding/_actions/onboarding-schemas.ts`:
- `name_fr` and `name_en` can stay as optional in the schema (backwards compatible), but the UI no longer sends them

**Step 4: Verify build + lint + check:i18n**

Run: `npm run build && npm run lint && npm run check:i18n`

**Step 5: Commit**

```bash
git add src/app/(professional)/pro/onboarding/_components/steps/ServiceFormFields.tsx
git add src/app/(professional)/pro/onboarding/_components/steps/Step3Services.tsx
git commit -m "feat: simplify onboarding service form — auto-translation replaces manual tabs"
```

---

## Task 8: Backfill existing services

**Files:**
- Create: `scripts/backfill-service-translations.ts`

**Step 1: Create backfill script**

A Node.js script that:
1. Connects to Supabase using the service role key
2. Fetches all services where `name_fr IS NULL OR name_en IS NULL`
3. For each service, calls `translateService()` with `sourceLocale: "pt"` (name_pt as source)
4. Updates the service with the translations
5. Logs progress: `[1/42] Translated: "Consulta geral" → FR: "Consultation générale", EN: "General Consultation"`
6. Rate limits: 1 service per 200ms to stay well within OpenAI limits

**Step 2: Run the script**

Run: `npx tsx scripts/backfill-service-translations.ts`
Expected: All existing services get FR/EN translations.

**Step 3: Verify in Supabase**

Check a few services in the Supabase dashboard to confirm `name_fr` and `name_en` are populated.

**Step 4: Commit**

```bash
git add scripts/backfill-service-translations.ts
git commit -m "feat: backfill script for existing service translations"
```

---

## Task 9: Final verification

**Step 1: Full build check**

Run: `npm run build && npm run lint && npm run check:i18n`
Expected: All pass.

**Step 2: Manual testing**

1. Create a new service in PT → verify `name_fr` and `name_en` columns populate in DB
2. Edit the service → change name → verify translations update
3. Switch patient locale to FR → verify the service appears in French
4. Switch patient locale to EN → verify the service appears in English
5. Test the toggle: click "Edit translations manually" → verify tabs appear → override FR → save → verify FR keeps the manual value
6. Onboarding: create a service in step 3 → verify translations generated
7. Check booking modal, professional profile, appointment cards all show localized names

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: service auto-translation PT/FR/EN via gpt-4o-mini — complete"
```
