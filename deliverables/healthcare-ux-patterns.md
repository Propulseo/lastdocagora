# DOCAGORA — Healthcare UX Patterns & Business Annotations

> Healthcare-specific UX guidance for Figma wireframing. Covers RGPD compliance, consent flows, accessibility, critical interaction patterns, and missing MVP features to wireframe.

---

## 1. GDPR / RGPD Compliance (Portugal-Specific)

Portugal follows the EU GDPR (locally known as **RGPD** — Regulamento Geral sobre a Protecao de Dados), plus national law **Lei n. 58/2019**. Healthcare data is classified as **special category data** (Article 9 GDPR) requiring explicit consent and heightened protection.

### Registration Consent (PAT-02: Register)

**Required consent checkboxes (cannot be pre-checked):**

1. **Terms of Service** — "Li e aceito os Termos de Servico" (mandatory)
2. **Privacy Policy** — "Li e aceito a Politica de Privacidade" (mandatory)
3. **Health Data Processing** — "Autorizo o tratamento dos meus dados de saude para agendamento de consultas" (mandatory, must cite legal basis: explicit consent per Art. 9(2)(a) GDPR)
4. **Marketing Communications** — "Desejo receber comunicacoes de marketing" (optional, must be separate from other consents)

**Wireframe annotations:**
- Each checkbox must be independent (no "accept all" bundle for mandatory + optional)
- Links to full policy documents must be accessible from the checkbox labels
- Store consent timestamp and version for audit trail
- "Health Data Processing" checkbox must include a brief explanation of what data is collected and why

### Booking Consent (PAT-05: Booking Modal — Step 3)

**Required at confirmation step:**
- Consent to share appointment details with the selected professional
- Acknowledgment of cancellation policy
- If notes are added: consent for the professional to access the notes

**Wireframe annotation:**
- Small text above "Confirm" button: "Ao confirmar, autoriza a partilha dos seus dados com o profissional selecionado para efeitos de consulta."

### Data Portability & Deletion

**Patient Settings (PAT-Settings) should include:**
- "Download my data" button (RGPD Art. 20 — data portability)
- "Delete my account" button with double-confirmation (RGPD Art. 17 — right to erasure)
- Both require identity re-verification (password re-entry)

**Wireframe annotation for settings page:**
- Section labeled "Os Meus Dados" (My Data)
- Warning text for deletion: "Esta acao e irreversivel. Todos os seus dados serao permanentemente eliminados."

---

## 2. Consent Flow Patterns

### Cookie Consent Banner
**Trigger:** First visit (any page)
**Pattern:** Bottom bar or floating dialog
**Required buttons:**
- "Aceitar todos" (Accept all)
- "Rejeitar nao essenciais" (Reject non-essential)
- "Personalizar" (Customize) — opens granular cookie settings
**Categories:** Essential (always on), Analytics, Marketing

**Wireframe annotation:** Must appear before any tracking fires. Not currently implemented — wireframe as a new component.

### Notification Consent (Patient Settings)

**Current implementation** (`/patient/settings`):
- Email notifications toggle
- SMS notifications toggle
- Appointment reminders toggle
- Marketing communications toggle

**Wireframe annotations:**
- Each toggle must have a description explaining what the patient will receive
- Changes must be saved explicitly (not auto-save) with confirmation toast
- SMS consent requires phone number verification first
- Marketing toggle must be independent per RGPD

### Professional Data Access Consent

When a professional views patient records, the system should log access events.

**Wireframe annotation for pro/patients:**
- Footer note: "O acesso aos dados do paciente e registado para fins de auditoria."
- Patient-side: "Who accessed my data" log in settings (future feature)

---

## 3. Accessibility Requirements (WCAG 2.1 AA)

### Minimum Requirements for All Screens

| Requirement | Standard | Implementation Notes |
|-------------|----------|---------------------|
| Color contrast | 4.5:1 text, 3:1 large text | Verify all StatusBadge colors against backgrounds |
| Focus indicators | Visible on all interactive elements | shadcn/ui provides ring styles — verify custom components |
| Keyboard navigation | Full tab order for all actions | Test BookingModal steps, AgendaClient calendar views |
| Screen reader labels | All icons and images | Lucide icons need `aria-label`, avatars need alt text |
| Touch targets | Minimum 44x44px | Critical for mobile: time slots in BookingModal, calendar days |
| Error identification | Errors in text, not just color | Form validation must include text messages, not just red borders |
| Page titles | Unique, descriptive | Each page must set `<title>` via Next.js metadata |

### Healthcare-Specific Accessibility

| Pattern | Reason | Implementation |
|---------|--------|----------------|
| High-contrast time slots | Patients may have impaired vision | Ensure booking time slots have clear borders + text, not just color fill |
| Readable appointment cards | Elderly patients are primary users | Minimum 16px body text on appointment cards, clear date/time formatting |
| Status announced to screen readers | Confirmation must be perceivable | Use `aria-live="polite"` for booking confirmation, attendance marking |
| Form auto-complete | Reduce input for repeat patients | Enable `autocomplete` attributes on address, phone, insurance fields |
| Skip navigation | Long sidebar navigation | Add "Skip to content" link before sidebar |

### Color Palette Accessibility Notes for Figma

**Status colors must pass AA contrast on white backgrounds:**
- Confirmed/Present (green): use `#16a34a` on white (7.1:1) — OK
- Pending (yellow): use `#ca8a04` on white (4.6:1) — borderline, add icon
- Cancelled/Absent (red): use `#dc2626` on white (4.5:1) — OK
- No-show (gray): use `#6b7280` on white (4.6:1) — borderline, add icon
- Late (amber): use `#d97706` on white (3.7:1) — **FAILS** for small text, use darker shade or add text label

**Recommendation:** Never rely on color alone for status. Always pair with text label or icon.

---

## 4. Critical Interaction Patterns

### 4.1 Appointment Confirmation

**Flow:** Patient books → Appointment created as "pending" → Professional confirms or rejects

**Wireframe annotations (BookingModal Step 3):**
- Show clear "pending" status after booking: "A sua consulta foi agendada e aguarda confirmacao do profissional."
- If auto-confirm is enabled (pro setting): show "confirmed" immediately
- Email/SMS notification sent to professional (visual indicator not needed in UI)

**Wireframe annotations (AppointmentDetailDialog):**
- "Confirm" button must be prominent (primary variant) for pending appointments
- Show time elapsed since booking: "Pendente ha 2 horas"
- Expired pending threshold warning (e.g., >24h without response)

### 4.2 Cancellation Policy

**Patient cancellation (CancelDialog):**
- Reason field (required for analytics, optional display to pro)
- Cancellation window warning: "Cancelamentos com menos de 24h podem ter penalizacao."
- Double confirmation for same-day cancellations
- Visual countdown if within cancellation window

**Professional cancellation (CancelAppointmentDialog):**
- Reason field (required)
- "Notify patient" checkbox (default: checked)
- Option to suggest alternative time (future feature — wireframe placeholder)

**Wireframe annotation:**
- Cancellation policy text must be visible BEFORE the user commits to cancelling
- Different messaging for within vs. outside cancellation window

### 4.3 Attendance Marking

**Flow:** Appointment time arrives → Professional marks attendance

**States:** `waiting` → `present` | `late` | `absent`

**Wireframe annotations (AppointmentDetailDialog):**
- Attendance buttons only appear for confirmed/completed appointments
- "Late" option should prompt: "Quantos minutos de atraso?" (with `late_minutes` field)
- "Absent" triggers no-show tracking (affects patient analytics)
- Attendance marking is timestamped (`marked_at`) for audit
- Cannot change attendance after 24h (business rule — show disabled state)

### 4.4 Professional Verification

**Flow:** Professional registers → Status "pending" → Admin reviews → "verified" or "rejected"

**Wireframe annotations (ADM-03: Professional Management):**
- Pending professionals highlighted with yellow badge
- Verification action: "Verificar" (approve) green button, "Rejeitar" (reject) red button
- Reject requires reason field
- Verified professionals get a verified badge visible to patients
- Unverified professionals hidden from patient search results

### 4.5 Rating & Review

**Flow:** Appointment completed → Patient can rate (1-5 stars + optional comment)

**Wireframe annotations (RatingDialog):**
- Star rating (1-5) with half-star or integer only
- Optional text review field
- "Already rated" state hides the rate button
- Rating appears on professional's profile and search card
- Professional cannot delete or modify ratings (transparency)

---

## 5. Business Annotations for Wireframes

Include these annotations directly on Figma wireframes to guide stakeholders and developers.

### Global Annotations

| Annotation | Applies To | Note |
|------------|-----------|------|
| `[RGPD]` | Any form collecting personal data | Mark fields that store personal/health data |
| `[CONSENT]` | Registration, booking confirmation | Must have explicit consent UI |
| `[A11Y]` | Status badges, time selectors | Verify color contrast + screen reader support |
| `[MOBILE]` | All patient screens | Mobile-first design required |
| `[DESKTOP]` | All admin screens | Desktop-first, responsive secondary |
| `[i18n]` | All text strings | All UI text must support PT/FR/EN |
| `[AUDIT]` | Attendance marking, cancellations | Actions are logged with timestamp and user |
| `[REALTIME]` | Notifications, support tickets | Consider real-time updates (future) |

### Role-Specific Annotations

**Patient wireframes:**
- `[BOOKING-FLOW]` — Mark the complete booking journey: Search → Card → Modal (3 steps) → Confirmation
- `[EMPTY-STATE]` — Every list/table needs an empty state design (no appointments, no results)
- `[LOADING]` — Skeleton states for search results, availability slots
- `[OFFLINE]` — Consider offline state messaging for mobile

**Professional wireframes:**
- `[KPI-STRIP]` — Consistent KPI card strip pattern across all management pages
- `[ATTENDANCE]` — Attendance tracking UI appears on agenda views and detail dialogs
- `[CALENDAR-SYNC]` — Google Calendar integration touchpoint in agenda
- `[AUTO-CONFIRM]` — Behavior differs if pro has auto-confirm setting enabled

**Admin wireframes:**
- `[VERIFICATION]` — Professional verification workflow touchpoints
- `[FILTERS]` — Consistent filter bar pattern across all management tables
- `[BULK-ACTIONS]` — Consider multi-select for bulk operations (future)
- `[EXPORT]` — Data export buttons on tables (future feature)

---

## 6. Missing MVP Features to Wireframe

These features don't exist in the codebase yet but should be wireframed for MVP completeness.

### 6.1 Payment Placeholder

**Current state:** `payments` table exists in DB but no UI implementation.

**Wireframe needed:**
- **Booking Modal — Payment Step**: After confirmation, show payment status area
  - For MVP: "Pagamento presencial" (payment at office) message
  - Future: Online payment integration placeholder
- **Patient Appointments**: Payment status badge on appointment cards (paid/pending/refunded)
- **Professional Dashboard**: Revenue KPI already exists — ensure it connects to payment data

**Annotations:**
- `[PAYMENT-PLACEHOLDER]` — Mark as future online payment integration
- Show "Pagamento no consultorio" default text in booking confirmation

### 6.2 Notification Sending

**Current state:** `notifications`, `appointment_notifications` tables exist. Patient can view notifications. No sending mechanism in UI.

**Wireframe needed:**
- **System notification templates**: Admin should configure notification templates (appointment confirmation, reminder, cancellation)
- **Notification center**: Patient bottom nav badge with unread count
- **Push notification consent**: Mobile prompt for push notifications
- **Professional notification preferences**: Which events trigger notifications to the pro

**Annotations:**
- `[NOTIFICATION-BADGE]` — Unread count on Messages nav item
- `[PUSH-CONSENT]` — Mobile push notification permission prompt

### 6.3 Cookie Consent Banner

**Current state:** Not implemented.

**Wireframe needed:**
- Bottom bar component on first visit
- Three options: Accept all, Reject non-essential, Customize
- Must appear before any analytics tracking

### 6.4 Professional Onboarding Wizard

**Current state:** Not implemented. Professional registers and lands on empty dashboard.

**Wireframe needed:**
- Step 1: Complete profile (photo, bio, specialty, languages, address)
- Step 2: Add services (at least one)
- Step 3: Set availability (at least one slot)
- Step 4: Submit for verification
- Progress bar showing completion percentage
- Skip option with "incomplete profile" warning

**Annotations:**
- `[ONBOARDING]` — First-time professional experience
- Profile completeness indicator on pro dashboard until 100%

### 6.5 Email Verification

**Current state:** Supabase handles auth but no explicit email verification flow in UI.

**Wireframe needed:**
- Post-registration: "Verifique o seu email" screen with illustration
- Resend verification link button
- Auto-redirect after verification

### 6.6 Password Recovery

**Current state:** Not visible in codebase UI.

**Wireframe needed:**
- "Esqueceu a password?" link on login page
- Email input form → confirmation message
- Password reset form (new password + confirm)

### 6.7 Data Export (Patient)

**Current state:** Not implemented (RGPD requirement).

**Wireframe needed:**
- Button in patient settings: "Descarregar os meus dados"
- Format: JSON or PDF
- Processing state: "A preparar o seu ficheiro..."
- Download link via email or in-app

---

## 7. Responsive Breakpoints

The codebase uses these breakpoints (Tailwind CSS defaults):

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | Minor layout adjustments |
| `md` | 768px | Tablet — 2-column grids |
| `lg` | 1024px | Desktop — sidebar visible, 3-column grids |
| `xl` | 1280px | Wide desktop — expanded layouts |

**Key responsive behaviors to wireframe:**

| Component | Mobile (<1024px) | Desktop (>=1024px) |
|-----------|-------------------|---------------------|
| Navigation | Bottom nav + hamburger header | Sidebar (collapsible) |
| Dialogs | Full-screen Sheet (bottom) | Centered Dialog |
| Search results | 1-column cards | 3-column grid |
| Agenda | Day view only (auto) | Day/Week/Month toggle |
| Tables | Horizontal scroll or card view | Full table |
| KPI strip | 2x2 grid | 4-column row |

---

## 8. Design Token Reference

From the codebase (`tailwind.config` + `globals.css`):

| Token | Usage |
|-------|-------|
| `--background` / `--foreground` | Page background, primary text |
| `--primary` / `--primary-foreground` | CTA buttons, active states |
| `--destructive` | Delete, cancel, reject actions |
| `--muted` / `--muted-foreground` | Secondary text, disabled states |
| `--accent` | Hover states, subtle highlights |
| `--card` | Card backgrounds |
| `--border` | Borders, dividers |
| `--ring` | Focus indicators |
| `--sidebar-*` | Sidebar-specific tokens (background, foreground, accent) |

**Theme support:** Light + Dark mode via `ThemeProvider` (next-themes). Professional interface has custom theme toggle. All wireframes should indicate which elements change between themes.
