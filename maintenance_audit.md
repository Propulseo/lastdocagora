# Audit de maintenance — Taille des fichiers

> Rapport généré le 2026-02-24 par `node scripts/audit-lines.mjs`

## Résumé

| Métrique | Valeur |
|---|---|
| Fichiers scannés | 215 |
| Fichiers > 250 lignes utiles | 2 |
| Seuil d'alerte | 250 lignes (hors vides & commentaires) |

### Répartition par catégorie

| Catégorie | Total | > 250 lignes |
|---|---|---|
| page | 46 | 0 |
| component | 114 | 1 |
| lib | 41 | 1 |
| other | 14 | 0 |

## Top 30 des fichiers les plus longs

| # | Fichier | Lignes utiles | Total | Catégorie |
|---|---|---|---|---|
| 1 | `src/components/ui/sidebar.tsx` | **659** | 725 | component :warning: |
| 2 | `src/locales/patient/pt.ts` | **274** | 276 | lib :warning: |
| 3 | `src/app/(professional)/pro/agenda/_hooks/useManualAppointment.ts` | **243** | 278 | other |
| 4 | `src/app/(professional)/pro/reminders/_components/TemplateCard.tsx` | **242** | 258 | component |
| 5 | `src/app/(patient)/patient/search/[id]/page.tsx` | **240** | 253 | page |
| 6 | `src/components/ui/dropdown-menu.tsx` | **239** | 258 | component |
| 7 | `src/app/(patient)/patient/profile/page.tsx` | **234** | 248 | page |
| 8 | `src/app/(patient)/patient/appointments/page.tsx` | **229** | 249 | page |
| 9 | `src/app/(professional)/pro/agenda/_components/DayTimeGrid.tsx` | **225** | 257 | component |
| 10 | `src/app/api/integrations/google/callback/route.ts` | **222** | 271 | lib |
| 11 | `src/app/(patient)/patient/profile/_components/edit-profile-form.tsx` | **218** | 235 | component |
| 12 | `src/app/(professional)/pro/agenda/_hooks/useAgendaData.ts` | **218** | 250 | other |
| 13 | `src/app/(patient)/patient/search/[id]/booking-form.tsx` | **217** | 238 | component |
| 14 | `src/app/(professional)/pro/dashboard/page.tsx` | **217** | 230 | page |
| 15 | `src/app/(patient)/patient/settings/_components/settings-form.tsx` | **211** | 224 | component |
| 16 | `src/components/ui/calendar.tsx` | **210** | 221 | component |
| 17 | `src/app/(patient)/patient/dashboard/page.tsx` | **209** | 220 | page |
| 18 | `src/app/(professional)/pro/agenda/_components/CalendarIntegrationDialog.tsx` | **207** | 218 | component |
| 19 | `src/app/(professional)/pro/statistics/_lib/aggregation.ts` | **205** | 248 | other |
| 20 | `src/lib/calendar/google-sync.ts` | **205** | 252 | lib |
| 21 | `src/app/(professional)/pro/agenda/_components/PatientPicker.tsx` | **201** | 210 | component |
| 22 | `src/app/(professional)/pro/patients/_components/patients-table.tsx` | **201** | 212 | component |
| 23 | `src/app/(professional)/pro/agenda/_components/WeekTimeGrid.tsx` | **199** | 224 | component |
| 24 | `src/app/(patient)/patient-sidebar.tsx` | **197** | 208 | component |
| 25 | `src/app/(patient)/_actions/ai-search.ts` | **196** | 230 | lib |
| 26 | `src/app/(professional)/pro/profile/page.tsx` | **190** | 200 | page |
| 27 | `src/app/(admin)/admin/content/_components/content-tabs.tsx` | **189** | 201 | component |
| 28 | `src/app/(professional)/pro/reminders/_components/ReminderFormFields.tsx` | **186** | 196 | component |
| 29 | `src/app/(professional)/pro/reminders/_components/TemplatesTab.tsx` | **181** | 191 | component |
| 30 | `src/components/ui/alert-dialog.tsx` | **181** | 197 | component |

## Fichiers dépassant 250 lignes — Suggestions de refactoring

| Fichier | Lignes utiles | Catégorie | Suggestion |
|---|---|---|---|
| `src/components/ui/sidebar.tsx` | **659** | component | Composant UI shadcn/ui — normal, laisser tel quel sauf si customisé lourdement |
| `src/locales/patient/pt.ts` | **274** | lib | Vérifier si certaines fonctions peuvent être extraites dans un module dédié |

## Méthodologie

- **Lignes utiles** : lignes non vides, hors commentaires (`//` et `/* */`)
- **Limite connue** : les chaînes de caractères contenant des patterns de commentaires
  (ex: `"// ceci"`) sont comptées comme commentaires. Impact négligeable en pratique.
- **Répertoires scannés** : `src/`, `app/`, `pages/`
- **Répertoires ignorés** : `node_modules/`, `.next/`, `dist/`, `build/`, `coverage/`, `supabase/`, `public/`, `generated/`
- **Extensions** : .ts, .tsx, .js, .jsx
