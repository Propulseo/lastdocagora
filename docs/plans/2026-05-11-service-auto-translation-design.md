# Service Auto-Translation PT/FR/EN — Design

**Problem:** Professional services (name, description) are stored in the pro's input language only. Patients in other locales see untranslated text.

**Solution:** Auto-translate via OpenAI `gpt-4o-mini` at creation/edit time. Store all 3 locales in DB. UI simplified to single field + optional manual override toggle.

**Approach:** Option B — tabs hidden by default, auto-translation silent, toggle reveals tabs for manual override.

**Validated:** 2026-05-11
