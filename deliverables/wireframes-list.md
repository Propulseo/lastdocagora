# DOCAGORA — Wireframe List for Figma

> ~20 prioritized screens for MVP wireframing. Each entry includes role, device priority, key annotations, and component references from the codebase.

---

## Priority Legend

| Tag | Meaning |
|-----|---------|
| **P0** | MVP — Must wireframe before development |
| **P1** | Important — Wireframe after P0 complete |
| **Device** | `mobile-first` = design mobile first, `desktop-first` = design desktop first |

---

## Patient Screens (7)

### 1. PAT-01: Login
- **Route:** `/login`
- **Priority:** P0
- **Device:** mobile-first
- **Layout:** Centered card on light background, no sidebar
- **Key Annotations:**
  - Email + password fields with validation errors
  - "Criar conta" (register) link below form
  - Supabase auth — show loading state on submit
  - Error toast for invalid credentials
  - Language switcher (PT/FR/EN) in corner
- **Component Refs:**
  - `src/app/(auth)/login/page.tsx` — LoginPage
  - `src/components/ui/form.tsx` — Form wrapper
  - `src/components/ui/input.tsx` — Input fields
  - `src/components/ui/button.tsx` — Submit button
  - `src/components/shared/language-switcher.tsx` — Locale toggle

### 2. PAT-02: Register
- **Route:** `/register`
- **Priority:** P0
- **Device:** mobile-first
- **Layout:** Centered card, same as login
- **Key Annotations:**
  - Name, email, password, confirm password fields
  - **Role selector**: patient vs professional (radio/toggle)
  - Professional fields appear conditionally (specialty, license number)
  - Terms acceptance checkbox (RGPD consent — see healthcare-ux-patterns.md)
  - Password strength indicator
- **Component Refs:**
  - `src/app/(auth)/register/page.tsx` — RegisterPage
  - `src/components/ui/form.tsx`, `input.tsx`, `button.tsx`, `checkbox.tsx`

### 3. PAT-03: Search Professionals
- **Route:** `/patient/search`
- **Priority:** P0
- **Device:** mobile-first
- **Layout:** Full-width with sidebar (desktop), bottom nav (mobile)
- **Key Annotations:**
  - **3 search tabs**: Classic grid | Map view | AI chat
  - Filter bar: name/query input, specialty dropdown, city text field
  - Results count label
  - Responsive grid: 1 col (mobile) → 2 col (tablet) → 3 col (desktop)
  - Each result is a ProfessionalCard (see PAT-04)
  - Empty state with illustration when no results
  - AI tab: chat interface with message bubbles
- **Component Refs:**
  - `src/app/(patient)/patient/search/_components/SearchContent.tsx`
  - `src/app/(patient)/patient/search/_components/search-tabs.tsx`
  - `src/app/(patient)/patient/search/_components/professional-card.tsx`
  - `src/app/(patient)/patient/search/_components/MapView.tsx`
  - `src/app/(patient)/patient/search/_components/ai-search-chat.tsx`
  - `src/components/shared/search-input.tsx`
  - `src/components/shared/empty-state.tsx`

### 4. PAT-04: Professional Detail
- **Route:** `/patient/search/[id]`
- **Priority:** P0
- **Device:** mobile-first
- **Layout:** Single-column scrollable page
- **Key Annotations:**
  - Professional header: avatar, name, specialty badge, rating stars, location
  - Bio section (expandable)
  - Services list with prices and durations
  - Reviews section with pagination
  - Availability calendar preview
  - Sticky "Book" CTA button (mobile) / sidebar CTA (desktop)
  - BookingForm embedded or modal trigger
- **Component Refs:**
  - `src/app/(patient)/patient/search/[id]/page.tsx`
  - `src/app/(patient)/patient/search/[id]/booking-form.tsx`
  - `src/app/(patient)/patient/search/_components/professional-card.tsx` (reuses display patterns)

### 5. PAT-05: Booking Modal (3-step wizard)
- **Route:** Modal overlay on `/patient/search` or `/patient/search/[id]`
- **Priority:** P0
- **Device:** mobile-first (Sheet on mobile, Dialog on desktop)
- **Layout:** ResponsiveDialog — full-screen sheet on mobile, centered dialog on desktop
- **Key Annotations:**
  - **Step 1 — Service Selection**: Radio list of services with price + duration. Auto-skipped if single service.
  - **Step 2 — Date & Time**: Calendar component (disabled past dates, grayed unavailable days). Time slots grouped into "Manha" (morning) and "Tarde" (afternoon) pills.
  - **Step 3 — Confirmation**: Summary card (professional, service, date, time, price). Optional notes textarea. Confirm button with loading state.
  - Step indicator at top (1/3, 2/3, 3/3)
  - Back button on each step
  - Success toast after booking
- **Component Refs:**
  - `src/app/(patient)/patient/search/_components/booking-modal.tsx` — BookingModal (4 internal steps incl. loading)
  - `src/components/shared/responsive-dialog.tsx` — ResponsiveDialog
  - `src/components/ui/calendar.tsx` — Calendar picker

### 6. PAT-06: My Appointments
- **Route:** `/patient/appointments`
- **Priority:** P0
- **Device:** mobile-first
- **Layout:** Tabbed view with appointment cards
- **Key Annotations:**
  - **3 tabs**: Proximas (upcoming), Passadas (past), Canceladas (cancelled)
  - Each appointment card: professional name, specialty, date/time, status badge, service name
  - Upcoming: "Cancel" button opens CancelDialog
  - Past: "Rate" button opens RatingDialog (hidden if already rated)
  - Empty states per tab with appropriate messaging
  - Status badges color-coded: confirmed=green, pending=yellow, cancelled=red, completed=blue
- **Component Refs:**
  - `src/app/(patient)/patient/appointments/_components/AppointmentsClient.tsx`
  - `src/app/(patient)/patient/appointments/_components/cancel-dialog.tsx`
  - `src/app/(patient)/patient/appointments/_components/rating-dialog.tsx`
  - `src/components/shared/status-badge.tsx`

### 7. PAT-07: Patient Dashboard
- **Route:** `/patient/dashboard`
- **Priority:** P0
- **Device:** mobile-first
- **Layout:** Single column with cards
- **Key Annotations:**
  - Welcome greeting with patient name
  - Next appointment highlight card (or empty state CTA to search)
  - Recent appointments list (5 max)
  - Quick action: "Pesquisar Profissional" button
- **Component Refs:**
  - `src/app/(patient)/patient/dashboard/_components/DashboardClient.tsx`

---

## Professional Screens (8)

### 8. PRO-01: Professional Dashboard
- **Route:** `/pro/dashboard`
- **Priority:** P0
- **Device:** desktop-first
- **Layout:** KPI strip + 3-column grid below
- **Key Annotations:**
  - **KPI Strip** (4 cards): Today's appointments, revenue, total patients, attendance rate. Each with trend arrow (up/down/neutral).
  - **Left column (35%)**: TodaySchedule — chronological list of today's appointments with time, patient, service, status
  - **Center column (40%)**: ActivityChart — 7-day bar chart of appointment counts
  - **Right column (25%)**: UtilityWidgets — quick stats, reminders
  - **Bottom**: QuickActions — "New Appointment", "Add Availability", "View Patients" buttons
  - Staggered animation on load (annotate timing)
- **Component Refs:**
  - `src/app/(professional)/pro/dashboard/_components/DashboardClient.tsx`
  - `src/app/(professional)/pro/dashboard/_components/KPIStrip.tsx`
  - `src/app/(professional)/pro/dashboard/_components/TodaySchedule.tsx`
  - `src/app/(professional)/pro/dashboard/_components/ActivityChart.tsx`
  - `src/app/(professional)/pro/dashboard/_components/QuickActions.tsx`
  - `src/components/shared/kpi-card.tsx`

### 9. PRO-02: Agenda — Day View
- **Route:** `/pro/agenda` (period=day)
- **Priority:** P0
- **Device:** mobile-first (auto-selects day view on mobile)
- **Layout:** Control bar + time grid
- **Key Annotations:**
  - **ControlBar**: Period toggle (day/week/month), date picker, status filter chips
  - **AttendanceStats**: Present/late/absent/no-show counts for visible period
  - **Time grid**: Hourly rows (8:00–20:00), appointments as colored blocks
  - Appointment blocks show: patient name, service, status color, time
  - Click block → AppointmentDetailDialog
  - Availability slots shown as green background blocks
  - FAB button: "+" to create manual appointment or availability
- **Component Refs:**
  - `src/app/(professional)/pro/agenda/_components/AgendaClient.tsx`
  - `src/app/(professional)/pro/agenda/_components/AgendaControlBar.tsx`
  - `src/app/(professional)/pro/agenda/_components/AttendanceStats.tsx`
  - `src/app/(professional)/pro/agenda/_components/DayTimeGrid.tsx` (referenced in code)
  - `src/app/(professional)/pro/agenda/_components/AppointmentBlock.tsx` (referenced in code)

### 10. PRO-03: Agenda — Week View
- **Route:** `/pro/agenda` (period=week)
- **Priority:** P0
- **Device:** desktop-first
- **Layout:** 7-column grid with time axis
- **Key Annotations:**
  - Column per day (Mon–Sun) with date headers
  - Shared time axis on left (8:00–20:00)
  - Appointment blocks positioned by time, colored by status
  - WeekAppointmentBlock: compact view with patient initial + time
  - Availability blocks as background overlays
  - Click any block → AppointmentDetailDialog
  - Today column highlighted
- **Component Refs:**
  - `src/app/(professional)/pro/agenda/_components/WeekTimeGrid.tsx` (referenced in code)
  - `src/app/(professional)/pro/agenda/_components/WeekAppointmentBlock.tsx`

### 11. PRO-04: Agenda — Month View
- **Route:** `/pro/agenda` (period=month)
- **Priority:** P1
- **Device:** desktop-first
- **Layout:** Calendar grid with day cells
- **Key Annotations:**
  - Standard month calendar grid
  - Each day cell shows appointment count and color dots
  - Click day → MonthDayDetailDialog with full day's appointments
  - Today highlighted, past dates dimmed
  - Attendance rate badge per day (if appointments exist)
- **Component Refs:**
  - `src/app/(professional)/pro/agenda/_components/MonthGrid.tsx`
  - `src/app/(professional)/pro/agenda/_components/MonthDayCell.tsx` (referenced in code)
  - `src/app/(professional)/pro/agenda/_components/MonthDayDetailDialog.tsx` (referenced in code)

### 12. PRO-05: Appointment Detail Dialog
- **Route:** Modal overlay on `/pro/agenda`
- **Priority:** P0
- **Device:** mobile-first (Sheet on mobile, Dialog on desktop)
- **Layout:** ResponsiveDialog with sections
- **Key Annotations:**
  - **Header**: Patient name, appointment date/time
  - **Info section**: Service name, duration, price, consultation type, notes
  - **Status section**: Current status badge, current attendance badge
  - **Attendance actions** (conditional — only for confirmed/completed):
    - "Present" (green), "Late" (amber), "Absent" (red) buttons
  - **Appointment actions** (conditional):
    - "Confirm" (if pending), "Cancel" (if pending/confirmed), "Reject" (if pending)
  - Cancel/Reject open sub-dialogs with reason field + "Notify patient" checkbox
- **Component Refs:**
  - `src/app/(professional)/pro/agenda/_components/AppointmentDetailDialog.tsx`
  - `src/app/(professional)/pro/agenda/_components/CancelAppointmentDialog.tsx` (referenced in code)
  - `src/app/(professional)/pro/agenda/_components/RejectAppointmentDialog.tsx` (referenced in code)

### 13. PRO-06: Patients List
- **Route:** `/pro/patients`
- **Priority:** P0
- **Device:** desktop-first
- **Layout:** KPI cards + filters + table
- **Key Annotations:**
  - **KPI cards**: Total patients, active (last 90d), new this month, acquisition trend
  - **Filters**: Search by name, insurance filter
  - **Table columns**: Name, email, phone, insurance, last appointment, total appointments
  - Row click → patient drawer (side panel with full details)
  - Action buttons: Edit, Delete (with confirmation)
  - "New Patient" button → CreatePatientDialog
  - Charts below table: acquisition trend, insurance distribution, appointment frequency
- **Component Refs:**
  - `src/app/(professional)/pro/patients/_components/PatientsClient.tsx` (referenced in code)
  - `src/app/(professional)/pro/patients/_components/patients-table.tsx`
  - `src/app/(professional)/pro/patients/_components/create-patient-dialog.tsx`
  - `src/app/(professional)/pro/patients/_components/patient-drawer.tsx` (referenced in code)
  - `src/components/shared/data-table.tsx`

### 14. PRO-07: Services Management
- **Route:** `/pro/services`
- **Priority:** P0
- **Device:** desktop-first
- **Layout:** KPI cards + filters + table
- **Key Annotations:**
  - **KPI cards**: Total services, active services, avg price, total revenue
  - **Filters**: Search, active/inactive toggle
  - **Table columns**: Name, description, price, duration, active toggle, actions
  - "New Service" → CreateServiceDialog (name, description, price, duration)
  - Edit/Delete actions per row
  - Charts: Revenue per service, appointment volume per service
- **Component Refs:**
  - `src/app/(professional)/pro/services/_components/ServicesClient.tsx` (referenced in code)
  - `src/app/(professional)/pro/services/_components/services-table.tsx`
  - `src/components/shared/data-table.tsx`

### 15. PRO-08: New Availability Modal
- **Route:** Modal overlay on `/pro/agenda`
- **Priority:** P0
- **Device:** mobile-first
- **Layout:** Form dialog
- **Key Annotations:**
  - Day of week selector (or specific date)
  - Start time and end time pickers
  - Recurrence options (one-time, weekly, custom)
  - Service association (optional)
  - Conflict detection warning
  - Preview of resulting slots
- **Component Refs:**
  - `src/app/(professional)/pro/agenda/_components/NewAvailabilityModal.tsx`

---

## Admin Screens (5)

### 16. ADM-01: Admin Dashboard
- **Route:** `/admin/dashboard`
- **Priority:** P0
- **Device:** desktop-first
- **Layout:** KPI strip + content grid
- **Key Annotations:**
  - **4 KPI cards**: Total patients, verified professionals, appointments this month, open support tickets
  - **Additional metrics**: Today's appointment count, pending verifications count
  - **Top Professionals table**: Name, specialty, rating, appointment count, revenue
  - Color-coded KPI icons (blue, green, amber, red)
- **Component Refs:**
  - `src/app/(admin)/admin/dashboard/_components/DashboardClient.tsx`
  - `src/app/(admin)/admin/dashboard/_components/top-professionals-table.tsx`
  - `src/components/shared/kpi-card.tsx`

### 17. ADM-02: User Management
- **Route:** `/admin/users`
- **Priority:** P0
- **Device:** desktop-first
- **Layout:** Filters + paginated table
- **Key Annotations:**
  - **Filters**: Search by name/email, role dropdown (all/patient/professional/admin), status filter
  - **Table columns**: Name, email, role badge, status, verification, created date, actions
  - Role badges color-coded: patient=blue, professional=green, admin=purple
  - Verification badges: pending=yellow, verified=green, rejected=red
  - Pagination controls at bottom
- **Component Refs:**
  - `src/app/(admin)/admin/users/_components/users-table.tsx`
  - `src/app/(admin)/admin/users/_components/users-filters.tsx`
  - `src/components/shared/data-table.tsx`
  - `src/components/shared/status-badge.tsx`
  - `src/components/shared/pagination.tsx`

### 18. ADM-03: Professional Management
- **Route:** `/admin/professionals`
- **Priority:** P0
- **Device:** desktop-first
- **Layout:** Filters + paginated table
- **Key Annotations:**
  - **Filters**: Search, specialty dropdown, city, verification status
  - **Table columns**: Name, specialty, city, rating (stars), verification status, appointment count, actions
  - Verification status management: approve/reject buttons for pending
  - Click row for detail view
- **Component Refs:**
  - `src/app/(admin)/admin/professionals/_components/professionals-table.tsx`
  - `src/app/(admin)/admin/professionals/_components/professionals-filters.tsx`
  - `src/components/shared/data-table.tsx`
  - `src/components/shared/status-badge.tsx`

### 19. ADM-04: Appointments Overview
- **Route:** `/admin/appointments`
- **Priority:** P0
- **Device:** desktop-first
- **Layout:** Filters + paginated table
- **Key Annotations:**
  - **Filters**: Date range picker, status dropdown, professional search, patient search
  - **Table columns**: Date/time, patient name, professional name, service, status badge, payment status, actions
  - Status badges: confirmed=green, pending=yellow, completed=blue, cancelled=red, no-show=gray
  - Advanced joins for participant data display
  - Export option (future)
- **Component Refs:**
  - `src/app/(admin)/admin/appointments/_components/appointments-table.tsx`
  - `src/app/(admin)/admin/appointments/_components/appointments-filters.tsx`
  - `src/components/shared/data-table.tsx`
  - `src/components/shared/status-badge.tsx`

### 20. ADM-05: Support Tickets
- **Route:** `/admin/support`
- **Priority:** P1
- **Device:** desktop-first
- **Layout:** Filters + ticket list
- **Key Annotations:**
  - **Filters**: Status (open/in_progress/resolved/closed), priority (low/medium/high/urgent), date range
  - **Ticket rows**: Subject, requester, status badge, priority badge, created date, last message preview
  - Priority color-coding: low=gray, medium=blue, high=amber, urgent=red
  - Click ticket → conversation thread view
  - Reply/close actions
- **Component Refs:**
  - `src/app/(admin)/admin/support/_components/SupportClient.tsx`
  - `src/app/(admin)/admin/support/_components/support-filters.tsx`
  - `src/components/shared/status-badge.tsx`

---

## Screen Summary

| # | ID | Screen | Role | Priority | Device |
|---|-----|--------|------|----------|--------|
| 1 | PAT-01 | Login | Public | P0 | mobile-first |
| 2 | PAT-02 | Register | Public | P0 | mobile-first |
| 3 | PAT-03 | Search Professionals | Patient | P0 | mobile-first |
| 4 | PAT-04 | Professional Detail | Patient | P0 | mobile-first |
| 5 | PAT-05 | Booking Modal (3-step) | Patient | P0 | mobile-first |
| 6 | PAT-06 | My Appointments | Patient | P0 | mobile-first |
| 7 | PAT-07 | Patient Dashboard | Patient | P0 | mobile-first |
| 8 | PRO-01 | Professional Dashboard | Professional | P0 | desktop-first |
| 9 | PRO-02 | Agenda — Day View | Professional | P0 | mobile-first |
| 10 | PRO-03 | Agenda — Week View | Professional | P0 | desktop-first |
| 11 | PRO-04 | Agenda — Month View | Professional | P1 | desktop-first |
| 12 | PRO-05 | Appointment Detail Dialog | Professional | P0 | mobile-first |
| 13 | PRO-06 | Patients List | Professional | P0 | desktop-first |
| 14 | PRO-07 | Services Management | Professional | P0 | desktop-first |
| 15 | PRO-08 | New Availability Modal | Professional | P0 | mobile-first |
| 16 | ADM-01 | Admin Dashboard | Admin | P0 | desktop-first |
| 17 | ADM-02 | User Management | Admin | P0 | desktop-first |
| 18 | ADM-03 | Professional Management | Admin | P0 | desktop-first |
| 19 | ADM-04 | Appointments Overview | Admin | P0 | desktop-first |
| 20 | ADM-05 | Support Tickets | Admin | P1 | desktop-first |

**Total: 20 screens** (17 P0 + 3 P1)
