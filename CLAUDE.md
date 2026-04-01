# CLAUDE.md — DocAgora

Guide de référence complet. Lire INTÉGRALEMENT avant chaque modification.

---

## 1. PROJET & STACK

DocAgora est une plateforme SaaS de santé type Doctolib, marché Portugal.
3 interfaces : patient / professionnel / admin. Multi-langue PT/FR/EN.

**Stack vérifié :**
- Next.js 16.1.6 App Router · React 19
- TypeScript strict
- Tailwind CSS v4 (pas de tailwind.config.ts — configuration via `@theme inline` dans globals.css)
- shadcn/ui new-york style, neutral base
- Supabase SSR via @supabase/ssr
- react-hook-form + zod v4
- date-fns · nuqs (URL params) · zustand (stores)
- Sonner (toasts) · Lucide icons
- Leaflet + react-leaflet + react-leaflet-cluster (cartes)
- recharts (graphiques/statistiques)
- openai SDK (chatbot IA patient)

```bash
npm run dev          # dev server
npm run build        # build production — doit passer à 0 erreurs
npm run lint         # ESLint core-web-vitals + TypeScript
npm run check:i18n   # Vérifier parité des traductions
npm run audit:lines  # Audit taille des fichiers
```

Pas de framework de test configuré.
Path alias : `@/*` → `./src/*`

---

## 2. RÈGLES ABSOLUES — NE JAMAIS DÉROGER

1. **Zéro mock data** — tout connecté à Supabase
2. **Zéro régression** — modifications additives via breakpoints Tailwind
3. **TypeScript strict** — zéro `any`, zéro `@ts-ignore`
4. **i18n intact** — toutes strings via le système de traduction, jamais hardcodé
5. **Build propre** — `npm run build` à 0 erreurs avant de terminer
6. **RLS Supabase** — vérifier les policies sur chaque table modifiée
7. **Un fichier = code complet** — jamais de snippets partiels

---

## 3. ARCHITECTURE DES ROUTES

```
src/app/
├── (public)/                    ← Landing page visiteurs anonymes
│   ├── layout.tsx               ← PublicHeader + PublicFooter
│   ├── page.tsx                 ← Landing (si user connecté → redirect dashboard)
│   └── _components/
│       ├── landing-page.tsx
│       ├── public-header.tsx
│       ├── public-footer.tsx
│       ├── hero-section.tsx
│       ├── hero-search-bar.tsx
│       ├── benefits-section.tsx
│       ├── stats-section.tsx
│       ├── mobile-app-section.tsx
│       ├── professional-cta-section.tsx
│       └── rgpd-section.tsx
│
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
│
├── (patient)/
│   ├── layout.tsx               ← Auth check (sauf /patient/search*)
│   ├── _actions/
│   │   └── ai-search.ts         ← Server action AI search (PAS une API route)
│   ├── _components/
│   │   ├── patient-bottom-nav.tsx
│   │   ├── patient-layout-header.tsx
│   │   ├── patient-page-header.tsx
│   │   ├── patient-loading.tsx
│   │   ├── patient-realtime-notifier.tsx
│   │   ├── professional-name.tsx
│   │   ├── public-search-header.tsx
│   │   └── auth-required-modal.tsx  ← (shared)
│   └── patient/
│       ├── dashboard/
│       ├── search/              ← PUBLIC — accessible sans compte
│       │   ├── _components/
│       │   │   ├── MapComponent.tsx   ← Leaflet map (dynamic import ssr:false)
│       │   │   ├── MapView.tsx
│       │   │   └── ProMapCard.tsx
│       │   └── [id]/            ← PUBLIC — accessible sans compte
│       ├── appointments/
│       ├── profile/
│       ├── messages/
│       └── settings/
│
├── (professional)/
│   ├── layout.tsx               ← Auth + redirect /pro/onboarding si incomplet
│   ├── _components/
│   │   ├── pro-bottom-nav.tsx
│   │   ├── pro-mobile-header.tsx
│   │   ├── pro-layout-header-title.tsx
│   │   ├── pro-page-header.tsx
│   │   └── pro-realtime-notifier.tsx
│   └── pro/
│       ├── dashboard/
│       ├── agenda/
│       ├── today/               ← "Consultations du jour"
│       ├── patients/
│       ├── services/
│       ├── statistics/
│       ├── reminders/
│       ├── profile/
│       ├── support/
│       ├── settings/
│       └── onboarding/          ← Wizard 7 étapes
│           ├── _actions/onboarding-actions.ts
│           └── _components/
│               ├── OnboardingShell.tsx
│               └── steps/Step1..Step7
│
├── (admin)/
│   └── admin/
│       ├── dashboard/
│       ├── users/
│       ├── professionals/
│       ├── appointments/
│       ├── statistics/
│       ├── content/
│       ├── support/
│       └── settings/
│
├── _actions/
│   └── geocode.ts               ← Géocodage Nominatim (server action)
│
└── api/
    ├── integrations/
    │   ├── google/start/        ← OAuth Google Calendar
    │   ├── google/callback/     ← OAuth callback
    │   ├── calendars/           ← List/toggle calendriers
    │   ├── connections/         ← List/revoke connexions
    │   └── sync/                ← Trigger sync
    └── health/search/           ← Monitoring: vérifie DB pros
```

### Matrice permissions

| Route | Public | Patient | Pro | Admin |
|-------|--------|---------|-----|-------|
| `/` | Landing | → dashboard | → dashboard | → dashboard |
| `/patient/search*` | ✓ | ✓ | ✗ | ✓ |
| `/patient/*` (reste) | ✗ → /login | ✓ | ✗ | ✓ |
| `/pro/*` | ✗ | ✗ | ✓ | ✗ |
| `/admin/*` | ✗ | ✗ | ✗ | ✓ |

Middleware : `middleware.ts` → `src/lib/supabase/middleware.ts`
Routes publiques whitelistées : `/`, `/login`, `/register`, `/patient/search*`, `/api/health`

---

## 4. SUPABASE — CLIENTS

```typescript
// Composant serveur / server actions
import { createClient } from "@/lib/supabase/server"

// Composant client
import { createClient } from "@/lib/supabase/client"

// Service role — API routes UNIQUEMENT (bypass RLS)
import { createClient } from "@supabase/supabase-js"
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // jamais exposé côté client
)
```

**Types DB :** `src/lib/supabase/types.ts` — auto-générés
```bash
npx supabase gen types typescript --linked > src/lib/supabase/types.ts
```

---

## 5. TYPES MÉTIER (src/types/index.ts)

Types existants et vérifiés :
```typescript
UserRole = "patient" | "professional" | "admin"

AppointmentStatus =
  | "pending" | "confirmed" | "completed"
  | "cancelled" | "rejected" | "no-show"  // ← tiret, pas underscore

AttendanceStatus =
  | "waiting" | "present" | "absent" | "late" | "cancelled"
  // "waiting" est le statut initial — toujours présent

CreatedVia = "patient_booking" | "manual" | "walk_in"
// ← Ce champ s'appelle created_via dans la table appointments
// ← PAS appointment_type

VerificationStatus = "pending" | "verified" | "rejected"
ConsultationType = "in-person"
PracticeType = "doctor" | "dentist" | "psychologist" | "physiotherapist" | "other"
TicketStatus = "open" | "in_progress" | "resolved" | "closed"
TicketPriority = "low" | "medium" | "high" | "urgent"
NotificationChannel = "email" | "sms" | "push"    // ← "push" pas "whatsapp"
ReminderTrigger = "before" | "after" | "immediate"

// NE PAS UTILISER PaymentStatus — n'existe pas dans src/types/index.ts
```

---

## 6. SCHEMA DB — TABLES PRINCIPALES

```
Core:
  users                       ← mirror auth.users
  patients                    ← profil patient (user_id FK)
  professionals               ← profil pro (user_id FK)
  appointments                ← rendez-vous
  availability                ← créneaux disponibles
  services                    ← services des pros

Colonnes clés professionals:
  verification_status         ← VerificationStatus
  is_active                   ← boolean
  latitude, longitude         ← géocodage auto via Nominatim
  onboarding_completed        ← boolean DEFAULT false
  onboarding_step             ← int DEFAULT 1
  languages                   ← langues parlées
  avatar_url                  ← URL photo profil

Colonnes clés appointments:
  status                      ← AppointmentStatus ('no-show' avec tiret)
  attendance_status           ← AttendanceStatus ('waiting' par défaut)
  created_via                 ← CreatedVia (PAS appointment_type)
  professional_notes          ← TEXT (notes privées pro)

Communication:
  notifications · appointment_notifications
  message_templates · reminder_rules

Contenu: content_pages · faqs · documents

Admin: support_tickets · ticket_messages · system_settings

Vues: platform_stats · professional_monthly_stats · top_professionals
```

---

## 7. VARIABLES D'ENVIRONNEMENT

```bash
# Fichier de référence : .env.local.example à la racine

# Supabase (obligatoires)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# App
NEXT_PUBLIC_APP_URL=            # URL de l'application (ex: http://localhost:3000)

# OpenAI
OPENAI_API_KEY=                 # Modèle utilisé : gpt-4o-mini uniquement

# Google Calendar
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CALENDAR_ENCRYPTION_KEY=        # Chiffrement tokens OAuth (32 chars)
```

---

## 8. THÈME — DARK MODE

### Configuration Tailwind CSS v4

**Il n'y a PAS de tailwind.config.ts.** Configuration dans `globals.css` :
```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  /* ... standard shadcn token mapping */
  --color-admin-success: var(--admin-success);
  --color-admin-warning: var(--admin-warning);
  --color-admin-info: var(--admin-info);
}
```

### Tokens CSS

Les tokens utilisent **oklch** (pas HSL) avec les noms shadcn standard :
```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  /* ... */
}
.dark {
  --background: oklch(0.145 0 0);
  /* ... */
}
```

### Variantes par rôle

Les couleurs changent selon le rôle via des sélecteurs CSS sur `body` :
```css
body.role-patient { /* thème teal */ }
html.dark body.role-patient { /* dark teal */ }
body.role-professional { /* thème bleu médical */ }
html.dark body.role-professional { /* dark blue */ }
body.role-admin { /* thème corporate warm */ }
html.dark body.role-admin { /* dark corporate purple */ }
```

Le composant `RoleBodyClass` (`src/components/role-body-class.tsx`) ajoute
la classe `role-*` au `<body>` via useEffect.

### Animation de transition de thème

`src/components/ui/ThemeToggle.tsx` utilise la **View Transitions API** :
```typescript
// Circular wipe animation depuis la position du clic
const transition = document.startViewTransition(() => {
  setTheme(newTheme)
})
transition.ready.then(() => {
  document.documentElement.animate({
    clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRadius}px at ${x}px ${y}px)`],
  }, { duration: 500, pseudoElement: "::view-transition-new(root)" })
})
```
Fallback gracieux si View Transitions API non supportée ou prefers-reduced-motion.

### Composants thème

```
src/components/
  ui/ThemeToggle.tsx      ← Toggle avec View Transitions API (circular wipe)
  theme-provider.tsx      ← next-themes ThemeProvider wrapper
  theme-sync.tsx          ← Sync thème ↔ DB (useSyncTheme hook)
  role-body-class.tsx     ← Applique body.role-* selon le rôle
```

`ThemeSync` persiste le thème dans `professional_settings` ou `patient_settings`
(DB est source de vérité, localStorage est le fast path).

**Thème par défaut :** `defaultTheme="light"` sur toutes les interfaces.

---

## 9. I18N — STRUCTURE RÉELLE

Structure **mixte** — ne pas uniformiser sans vérifier :

```
src/locales/
  locale-context.tsx           ← Patient locale provider + usePatientTranslations
  landing-locale-context.tsx   ← Landing locale provider + useLandingTranslations
  patient/
    pt.ts · en.ts · fr.ts     ← fichiers .ts (type-safe)
    index.ts
    specialties.ts             ← Traduction noms spécialités
  landing/
    pt.ts · en.ts · fr.ts     ← fichiers .ts (type-safe)
    index.ts
  pt/
    admin.json                 ← fichiers .json
    professional.json
  en/
    admin.json · professional.json
  fr/
    admin.json · professional.json

src/lib/i18n/
  index.ts · types.ts · actions.ts
  locale-store.ts              ← Store global locale (subscribeLocaleChange)
  server.ts
  admin/
    AdminI18nProvider.tsx
    getAdminI18n.ts · useAdminI18n.ts · server.ts
  pro/
    ProfessionalI18nProvider.tsx
    getProfessionalI18n.ts · useProfessionalI18n.ts · server.ts · translations.ts
```

**Règle :** Langue par défaut = **PT**. `DEFAULT_LOCALE = "pt"`.
Toutes les strings passent par le provider i18n du rôle concerné.
Patient et landing = fichiers `.ts` (type-safe). Admin et pro = fichiers `.json`.

---

## 10. LIBRAIRIES INTERNES (src/lib/)

```
src/lib/
  supabase/
    client.ts              ← Browser client
    server.ts              ← Server client (SSR, cookies)
    middleware.ts           ← RBAC + session refresh + onboarding gate
    types.ts               ← Types auto-générés
  i18n/                    ← Providers traduction par rôle (voir section 9)
  ai/
    openai-client.ts       ← getOpenAIClient() — singleton OpenAI
    system-prompt.ts       ← buildSystemPrompt() pour l'IA search
    schemas.ts             ← Schemas Zod pour input/output AI
  calendar/
    config.ts              ← Config Google Calendar
    google-types.ts        ← Types Google Calendar API
    google-token.ts        ← Gestion tokens OAuth (chiffrement)
    google-sync.ts         ← Synchronisation calendriers
  utils.ts                 ← cn() (clsx + tailwind-merge)

src/stores/
  pro-notifications-store.ts  ← Store Zustand notifications pro

src/hooks/
  use-mobile.ts            ← Hook détection mobile
  use-mobile-lg.ts         ← Hook mobile lg breakpoint (useIsMobileLg)
  use-patient-mobile.ts    ← Hook mobile patient
  use-sync-theme.ts        ← Sync thème ↔ DB Supabase
```

---

## 11. NAVIGATION CONFIG

```
src/config/
  admin-nav.ts         ← Groupes: general / management / platform (i18n keys)
  patient-nav.ts       ← Items simples: dashboard / search / appointments / profile / messages / settings
  professional-nav.ts  ← Groupes: main / manage / account (translationKeys)
```

### Patient — Bottom Nav Bar (mobile `lg:hidden`)
Défini dans `src/app/(patient)/_components/patient-bottom-nav.tsx`

### Pro — Bottom Nav Bar (mobile `lg:hidden`)
Défini dans `src/app/(professional)/_components/pro-bottom-nav.tsx`
Nav groupée : main (Dashboard, Agenda, Hoje, Pacientes) / manage (Lembretes, Serviços, Estatísticas) / account (Suporte, Perfil, Configurações)

### Admin — Sidebar avec groupes
Groupes : general (Dashboard) / management (Users, Professionals, Appointments, Statistics) / platform (Content, Support, Settings)

---

## 12. COMPOSANTS PARTAGÉS (src/components/shared/)

```
kpi-card.tsx               ← KPI avec trend up/down/neutral
data-table.tsx             ← Table générique
status-badge.tsx           ← Badges par type (appointment|ticket|role|verification|priority)
page-header.tsx            ← Titre page + action
confirm-dialog.tsx         ← Confirmation (default | destructive)
responsive-dialog.tsx      ← Dialog desktop / Sheet bottom mobile auto
search-input.tsx           ← Input recherche avec sync URL (nuqs)
empty-state.tsx            ← État vide + illustration + CTA
pagination.tsx             ← Prev/Next avec sync URL
language-switcher.tsx      ← Switch PT/FR/EN (sidebar footer + headers)
auth-required-modal.tsx    ← Modal "connectez-vous pour continuer"
```

---

## 13. PATTERNS SERVER ACTIONS

```typescript
"use server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function monAction(data: ...) {
  const supabase = await createClient()

  // 1. Vérifier auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Non authentifié")

  // 2. Vérifier rôle
  if (user.user_metadata?.role !== 'professional')
    throw new Error("Accès refusé")

  // 3. Action DB avec gestion d'erreur
  const { error } = await supabase.from('table').update({...})
  if (error) throw new Error(error.message)

  // 4. Revalidation obligatoire
  revalidatePath('/pro/page')
  return { success: true }
}
```

---

## 14. CHATBOT IA — RECHERCHE PATIENT

### Implémentation existante

```
src/app/(patient)/_actions/ai-search.ts  ← Server action (PAS une API route)
src/lib/ai/
  openai-client.ts    ← Client OpenAI singleton
  system-prompt.ts    ← Prompt système avec contexte DB
  schemas.ts          ← Validation Zod input/output
```

- **Modèle :** `gpt-4o-mini` (détection langue + recherche)
- **Détection langue :** auto FR/EN/PT
- **Cache contexte :** 5 minutes TTL (spécialités, villes, quartiers)
- **Disponibilité :** Vérifie créneaux via RPC `get_next_available_slot`, `get_available_slots`

### Fallback recherche à 4 niveaux (OBLIGATOIRE)

```
Niveau 1 : Tous les filtres (specialty + city + language + insurance)
Niveau 2 : specialty + city (sans language/insurance)
Niveau 3 : specialty seule
Niveau 4 : Top pros vérifiés (ORDER BY rating DESC, LIMIT 5-10)
```

**NE JAMAIS retourner "0 résultats"** si des pros existent en DB.

### Monitoring

```
GET /api/health/search
→ { status: "ok", verified_professionals_count: N, timestamp }
```

---

## 15. CARTE — Leaflet + Google Maps Tiles

```typescript
// OBLIGATOIRE : dynamic import (SSR interdit avec Leaflet)
const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false })

// Fix icônes Leaflet (déjà fait dans MapComponent.tsx)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

// Tiles : Google Maps (pas MapTiler)
url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"

// Centre initial Portugal
PORTUGAL_CENTER = [39.3999, -8.2245]  zoom={7}

// Clustering : react-leaflet-cluster avec icônes custom par spécialité
// Max 100 markers affichés (geoProfs.slice(0, 100))
```

**Géocodage automatique :**
Server action `src/app/_actions/geocode.ts` → Nominatim API →
sauvegarde `latitude` + `longitude` dans professionals.
```
API: https://nominatim.openstreetmap.org/search
Header: User-Agent: "DocAgora/1.0 contact@docagora.com"
countrycodes: "pt"  — limité au Portugal
```

---

## 16. PATTERNS MOBILE OBLIGATOIRES

### Breakpoints
- Mobile < 640px → cible principale des nouvelles features
- Desktop > 1024px → comportement existant, ne pas modifier

### Touch targets
```css
/* Minimum absolu sur tous les éléments interactifs */
min-height: 44px; min-width: 44px;
/* Boutons primaires */
min-height: 48px; width: 100%; /* full-width sur mobile */
```

### Tables → Cards (pattern universel)
```tsx
<table className="hidden sm:table">...</table>
<div className="sm:hidden">
  {data.map(item => <MobileCard key={item.id} {...item} />)}
</div>
```

### Modals → Sheets sur mobile
```tsx
// Toujours utiliser ResponsiveDialog (src/components/shared/responsive-dialog.tsx)
// Détecte automatiquement : Dialog desktop / Sheet side="bottom" mobile
// Hook : useIsMobileLg (src/hooks/use-mobile-lg.ts)
```

### Agenda mobile
- Vue Jour uniquement < 640px (forcé, switcher `hidden sm:flex`)
- FAB : `fixed bottom-[80px] right-4` (au-dessus bottom nav 64px)

### Safe area iPhone
```css
padding-bottom: env(safe-area-inset-bottom);
```

### Layout padding avec bottom nav
```tsx
<main className="pb-16 lg:pb-0">  {/* 64px pour bottom nav */}
```

---

## 17. AGENDA — RÈGLES MÉTIER

### Statuts à masquer par défaut
```typescript
const HIDDEN_STATUSES = ['cancelled', 'rejected']
const visible = appointments.filter(
  a => !HIDDEN_STATUSES.includes(a.status)
)
```

### Conditions d'affichage des actions
```typescript
// Boutons Confirmar / Recusar
status === 'pending'

// Bouton Cancelar
status === 'pending' || status === 'confirmed'

// Attendance (Presente / Ausente / Atrasado)
status === 'confirmed' || status === 'completed'

// Attendance immuable après 24h (afficher disabled)
new Date() - new Date(appointment.scheduled_at) > 24 * 3600 * 1000
```

### Walk-ins
```typescript
// Champ DB correct
created_via: 'walk_in'  // PAS appointment_type

// Statut à la création
status: 'confirmed'
attendance_status: 'present'
```
Style visuel : `border-l-4 border-amber-400 bg-amber-50 dark:bg-amber-900/20`

---

## 18. NOTIFICATIONS TEMPS RÉEL

### Pro ← patient réserve
```typescript
// ProRealtimeNotifier — monté dans layout pro
// src/app/(professional)/_components/pro-realtime-notifier.tsx
supabase
  .channel(`pro-appointments-${professionalId}`)
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public',
    table: 'appointments',
    filter: `professional_id=eq.${professionalId}`,
  }, (payload) => { /* toast Sonner */ })
  .subscribe()
```

### Patient ← pro confirme
```typescript
// PatientRealtimeNotifier — monté dans layout patient
// src/app/(patient)/_components/patient-realtime-notifier.tsx
```

### Store notifications pro
```
src/stores/pro-notifications-store.ts  ← Zustand store
```

**Toaster (Sonner) :** monté dans le root layout de chaque interface.

---

## 19. RGPD — RÈGLES IMPÉRATIVES

### Admin — Anonymisation obligatoire des patients
```typescript
// INTERDIT dans /admin/appointments :
patient.first_name, patient.last_name, patient.email, patient.phone

// OBLIGATOIRE :
`Patient #${patient_id.slice(-5)}`  // ex: "Patient #2a847"
```

### Inscription — 4 checkboxes séparées (non pré-cochées)
1. Termos de Serviço — obligatoire
2. Política de Privacidade — obligatoire
3. Tratamento dados de saúde — obligatoire (Art. 9 RGPD)
4. Comunicações de marketing — optionnel (séparé des 3 autres)

---

## 20. ONBOARDING PROFESSIONNEL

**Déclenchement :** `professionals.onboarding_completed = false` →
redirect `/pro/onboarding` depuis middleware (layout pro vérifie aussi).

**7 étapes :** (`src/app/(professional)/pro/onboarding/_components/steps/`)
1. **Step1Profile** — photo, nom, bio, titre, langues
2. **Step2Specialty** — spécialité, expérience, types consultation
3. **Step3Services** — **min 1 service obligatoire** pour continuer
4. **Step4Availability** — **min 1 jour activé obligatoire** pour continuer
5. **Step5Address** — adresse + géocodage auto + preview carte Leaflet
6. **Step6Verification** — submit → `verification_status: 'pending'` + notif admin
7. **Step7Complete** — `onboarding_completed: true` → redirect dashboard

**Shell :** `OnboardingShell.tsx` — layout minimal sans sidebar pro.
**Actions :** `onboarding/_actions/onboarding-actions.ts`
**Reprise :** `onboarding_step` sauvegardé en DB à chaque étape.

---

## 21. GOOGLE CALENDAR INTEGRATION

```
src/app/api/integrations/
  google/start/route.ts      ← Démarre OAuth flow
  google/callback/route.ts   ← Reçoit callback OAuth
  calendars/route.ts         ← List/toggle calendriers
  connections/route.ts       ← List/revoke connexions
  sync/route.ts              ← Trigger sync manuelle

src/lib/calendar/
  config.ts                  ← Configuration OAuth scopes
  google-types.ts            ← Types API Google Calendar
  google-token.ts            ← Chiffrement/déchiffrement tokens (CALENDAR_ENCRYPTION_KEY)
  google-sync.ts             ← Logique de sync bidirectionnelle
```

---

## 22. STATISTIQUES — MÉTRIQUES PRO

### Métriques actives
- Taxa de presença · Taxa de no-show · Taxa de cancelamento
- Receita (revenus) · Walk-ins ce mois
- Tempo entre consultas (avg gap entre fin N et début N+1)
- Horas faturáveis (SUM durées confirmées/présents)
- Taxa de ocupação (réservés / disponibles × 100)

### Graphiques
- recharts pour les graphiques
- HeatmapChart.tsx pour la heatmap d'activité

---

## 23. CHECKLIST AVANT CHAQUE COMMIT

```
□ npm run build → 0 erreurs TypeScript
□ npm run lint → 0 erreurs ESLint
□ Aucun texte hardcodé FR/EN dans les composants modifiés
□ Types utilisés correspondent à src/types/index.ts
  ('no-show' avec tiret, 'waiting' inclus dans AttendanceStatus,
   'push' dans NotificationChannel, etc.)
□ created_via utilisé (pas appointment_type) pour les walk-ins
□ Aucune table sensible sans RLS vérifiée
□ Touch targets ≥ 44px sur les nouveaux éléments interactifs
□ Dark mode testé sur les nouvelles sections
□ Mobile 375px testé sur les nouvelles pages
□ Aucune régression desktop (viewport > 1024px)
□ revalidatePath() après chaque mutation DB
□ Aucun console.log de debug laissé en production
□ dynamic import ssr:false sur tout composant utilisant Leaflet
```
