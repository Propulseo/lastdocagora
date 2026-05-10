# CLAUDE.md — DocAgora

Lire ce document avant toute modification.
Quand une règle du doc contredit le code réel, le code source de vérité gagne après vérification.

## 1. Contexte projet

DocAgora est une plateforme SaaS santé type Doctolib pour le Portugal.
Interfaces : patient, professionnel, admin.
Langues : PT / FR / EN.

## 2. Stack validé

- Next.js 16.1.6 App Router.
- React 19.
- TypeScript strict.
- Tailwind CSS v4, sans tailwind.config.ts, config via `@theme inline` dans `globals.css`.
- shadcn/ui style new-york, base neutral.
- Supabase SSR via `@supabase/ssr`.
- react-hook-form + zod v4.
- date-fns + date-fns-tz, nuqs, zustand.
- Sonner, Lucide.
- Leaflet + react-leaflet + react-leaflet-cluster.
- recharts, react-day-picker.
- OpenAI SDK.
- Resend.

Commandes de référence :
```bash
npm run dev
npm run build
npm run lint
npm run check:i18n
npm run audit:lines
npm run check:tracked
```

Pas de framework de test configuré.
Alias : `@/*` -> `./src/*`

## 3. Règles absolues

- Zéro mock data.
- Zéro regression : modifications additives via breakpoints Tailwind.
- TypeScript strict : pas de `any`, pas de `@ts-ignore`.
- i18n obligatoire : aucune string hardcodée.
- Build propre avant finalisation.
- RLS Supabase à vérifier sur chaque table modifiée.
- Un fichier = code complet, pas de snippets partiels.

## 4. Sources de vérité

Toujours vérifier en priorité :
- `src/types/index.ts`
- `src/lib/supabase/*`
- `src/lib/i18n/*`
- schéma Supabase / migrations
- routes dans `src/app/*`

## 5. Architecture routes

### Public
- `(public)` : landing.
- `(auth)` : login / register.
- `(patient)` : patient.
- `(professional)` : pro.
- `(admin)` : admin.

### Règles d'accès
- `/` : landing publique, redirection dashboard si connecté.
- `/patient/search*` : public.
- `/patient/*` : auth requise sauf search.
- `/pro/*` : pro uniquement.
- `/admin/*` : admin uniquement.

Middleware : `src/lib/supabase/middleware.ts`.
Routes publiques : `/`, `/login`, `/register`, `/patient/search*`, `/api/health`.

## 6. Supabase

### Clients
```ts
import { createClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/client"
```

### Service role
Uniquement dans les API routes.
Jamais côté client.

### Types
`src/lib/supabase/types.ts` est généré automatiquement.

## 7. Types métier

Valeurs à respecter :
- `UserRole = "patient" | "professional" | "admin"`
- `AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "rejected" | "no-show"`
- `AttendanceStatus = "waiting" | "present" | "absent" | "late" | "cancelled"`
- `CreatedVia = "patient_booking" | "manual" | "walk_in"`
- `VerificationStatus = "pending" | "verified" | "rejected" | "suspended"`
- `ConsultationType = "in-person"`
- `PracticeType = "doctor" | "dentist" | "psychologist" | "physiotherapist" | "other"`
- `TicketStatus = "open" | "in_progress" | "awaiting_confirmation" | "resolved" | "closed"`
- `TicketPriority = "low" | "medium" | "high" | "urgent"`
- `NotificationChannel = "email" | "sms" | "push"`
- `ReminderTrigger = "before" | "after" | "immediate"`

Ne pas utiliser `PaymentStatus`.

## 8. Schema DB

Tables core :
- `users`
- `patients`
- `professionals`
- `appointments`
- `availability`
- `services`

Colonnes importantes `professionals` :
- `verification_status`
- `is_active`
- `latitude`, `longitude`
- `onboarding_completed`
- `onboarding_step`
- `languages`
- `avatar_url`

Colonnes importantes `appointments` :
- `status`
- `attendance_status`
- `created_via`
- `professional_notes`

## 9. I18n

Règle générale :
- Langue par défaut = PT.
- `DEFAULT_LOCALE = "pt"`.
- Toutes les strings passent par le système i18n du rôle concerné.
- Pas de `next-intl`.

Structure :
- Patient/landing : fichiers `.ts`.
- Admin/pro : fichiers `.json` par domaine.

## 10. Theme

- Tailwind v4 via `@theme inline`.
- Pas de `tailwind.config.ts`.
- Tokens CSS en `oklch`.
- Thèmes par rôle via classes `role-patient`, `role-professional`, `role-admin`.
- Default theme : `light`.

## 11. Mobile first

- Cible principale : mobile < 640px.
- Touch targets minimum : 44px.
- Tables sur mobile -> cards.
- Modals desktop -> `ResponsiveDialog` sur mobile.
- Leaflet : `dynamic(..., { ssr: false })`.
- Ne pas casser le desktop.

## 12. Server actions

Toujours :
1. Vérifier l'auth.
2. Vérifier le rôle.
3. Exécuter l'action DB.
4. Revalider avec `revalidatePath()` si besoin.

## 13. AI search

- Modèle : `gpt-4o-mini`.
- Recherche patient et landing.
- Cache contexte 5 min.
- Ne jamais retourner `0 résultat` si des pros existent.
- Fallback obligatoire :
  1. Tous filtres.
  2. specialty + city.
  3. specialty seule.
  4. top pros vérifiés.

## 14. Maps

- Leaflet uniquement en import dynamique.
- Tiles Google.
- Centre initial Portugal.
- Max 100 markers.

## 15. Agenda

- Statuts masqués par défaut : `cancelled`, `rejected`.
- Walk-in : `created_via = "walk_in"`, `status = "confirmed"`, `attendance_status = "present"`.
- Attendance modifiable selon les règles métier.

## 16. RGPD

- Dans l'admin, anonymiser les patients.
- Pas de nom, email, téléphone en clair.
- Inscription : 4 checkboxes séparées, dont marketing optionnel.

## 17. Onboarding pro

Étapes :
1. Profile.
2. Specialty.
3. Services.
4. Availability.
5. Address.
6. Verification.
7. Complete.

Contraintes :
- au moins 1 service.
- au moins 1 jour actif.
- `onboarding_step` sauvegardé à chaque étape.

## 18. Google Calendar

- OAuth start/callback.
- Sync bidirectionnelle.
- Tokens chiffrés.
- Config via `CALENDAR_ENCRYPTION_KEY`.

## 19. Reviews

- Demande, soumission, refus, suppression.
- Modération admin.
- Traductions dédiées.

## 20. Avant commit

Vérifier :
- build.
- lint.
- i18n.
- types.
- RLS.
- touch targets.
- dark mode.
- mobile 375px.
- desktop 1024px+.
- `revalidatePath()` sur mutations.
- pas de `console.log`.
- Leaflet en `ssr:false`.
