# DOCAGORA — UI Component Catalog

> Structured reference for Figma wireframing. Components organized by layer: shared utilities, business components per role, and shadcn/ui base.

---

## 1. Shared Components (`src/components/shared/`)

These are role-agnostic, reusable across all three interfaces.

### KpiCard
- **File:** `src/components/shared/kpi-card.tsx`
- **Props:** `icon: LucideIcon`, `label: string`, `value: string | number`, `description?`, `trend?: "up" | "down" | "neutral"`, `iconVariant?: "default" | "blue" | "green" | "amber" | "red"`, `className?`
- **Variants:** 5 icon color variants (default, blue, green, amber, red) + 3 trend indicators
- **Used in:** All 3 dashboards, pro statistics, pro patients, pro services, pro reminders, admin statistics

### DataTable
- **File:** `src/components/shared/data-table.tsx`
- **Props:** `columns: ColumnDef<T>[]`, `data: T[]`, `rowKey: (row) => string`, `emptyTitle?`, `emptyDescription?`, `emptyAction?`, `onRowClick?`, `variant?: "default" | "admin"`, `rowClassName?`
- **Variants:** `default` (standard rows) | `admin` (compact, striped rows)
- **Used in:** Admin users/professionals/appointments tables, pro patients/services tables, top professionals

### StatusBadge
- **File:** `src/components/shared/status-badge.tsx`
- **Props:** `type: string`, `value: string | boolean | null`, `labels?: Record<string, string>`, `className?`
- **Types:** `appointment` (confirmed/pending/completed/cancelled/rejected/no-show), `ticket` (open/in_progress/resolved/closed), `priority` (low/medium/high/urgent), `role` (patient/professional/admin), `verification` (pending/verified/rejected), `published` (true/false)
- **Used in:** Every table and card showing status across all roles

### PageHeader
- **File:** `src/components/shared/page-header.tsx`
- **Props:** `title: string`, `description?`, `action?` (ReactNode for action button area)
- **Used in:** Every page top section

### ConfirmDialog
- **File:** `src/components/shared/confirm-dialog.tsx`
- **Props:** `open: boolean`, `onOpenChange`, `title: string`, `description: string`, `confirmLabel?`, `variant?: "default" | "destructive"`, `loading?`, `onConfirm`
- **Variants:** `default` (primary button) | `destructive` (red button)
- **Used in:** Delete confirmations (patients, services), cancel actions, reject actions

### ResponsiveDialog
- **File:** `src/components/shared/responsive-dialog.tsx`
- **Exports:** `ResponsiveDialog`, `ResponsiveDialogTrigger`, `ResponsiveDialogContent`, `ResponsiveDialogHeader`, `ResponsiveDialogTitle`, `ResponsiveDialogDescription`, `ResponsiveDialogFooter`
- **Behavior:** Renders as `Dialog` on desktop, `Sheet` (bottom drawer) on mobile. Uses `useIsMobileLg` hook.
- **Used in:** BookingModal, CreatePatientDialog, all form dialogs, AppointmentDetailDialog

### SearchInput
- **File:** `src/components/shared/search-input.tsx`
- **Props:** `placeholder?`, `paramKey?: string`, `className?`
- **Behavior:** Debounced URL query param sync via `useSearchParams`
- **Used in:** All filter bars (admin users, professionals, appointments; pro patients, services)

### EmptyState
- **File:** `src/components/shared/empty-state.tsx`
- **Props:** `icon?: LucideIcon`, `title: string`, `description?`, `action?` (ReactNode), `className?`
- **Used in:** Empty search results, empty tables, empty appointment tabs

### Pagination
- **File:** `src/components/shared/pagination.tsx`
- **Props:** `total: number`, `pageSize: number`
- **Behavior:** Previous/Next buttons synced to URL `page` param
- **Used in:** All paginated tables

### LanguageSwitcher
- **File:** `src/components/shared/language-switcher.tsx`
- **Props:** `locale: string`
- **Options:** PT, FR, EN
- **Used in:** Sidebar footers, topbars

---

## 2. Business Components by Role

### Patient — Search & Booking

#### ProfessionalCard
- **File:** `src/app/(patient)/patient/search/_components/professional-card.tsx`
- **Props:** `prof: ProfessionalResult`, `locale: string`, `t: PatientTranslations["search"]`
- **Displays:** Avatar with specialty badge, rating stars + review count, location (neighborhood/city/cabinet), consultation fee, languages, experience years, insurance accepted, bio excerpt (2-line clamp), next available slot (lazy-loaded)
- **Actions:** "View Profile" link, "Book" button (opens BookingModal)
- **Used in:** SearchContent grid, professional-grid

#### BookingModal
- **File:** `src/app/(patient)/patient/search/_components/booking-modal.tsx`
- **Props:** `open`, `onOpenChange`, `professionalId`, `professionalName`, `professionalSpecialty`
- **Steps:** Loading → Service selection (radio list) → Date/time (calendar + morning/afternoon slots) → Confirmation (summary + notes)
- **Features:** Auto-skip service step if single service, calendar disables unavailable days, time slot grouping
- **Used in:** ProfessionalCard "Book" action

#### SearchContent
- **File:** `src/app/(patient)/patient/search/_components/SearchContent.tsx`
- **Props:** `professionals: ProfessionalResult[]`, `query`, `specialtyFilter`, `cityFilter`
- **Layout:** PageHeader + SearchTabs (Classic/Map/AI) + filter form + results grid
- **Used in:** `/patient/search` page

#### SearchTabs
- **File:** `src/app/(patient)/patient/search/_components/search-tabs.tsx`
- **Props:** `classicContent`, `mapContent`, `locale`, `t`
- **Tabs:** Classic search, Map view, AI search chat
- **Used in:** SearchContent

#### MapView
- **File:** `src/app/(patient)/patient/search/_components/MapView.tsx`
- **Used in:** SearchTabs map tab

#### ProMapCard
- **File:** `src/app/(patient)/patient/search/_components/ProMapCard.tsx`
- **Used in:** MapView overlay

#### AISearchChat
- **File:** `src/app/(patient)/patient/search/_components/ai-search-chat.tsx`
- **Used in:** SearchTabs AI tab

### Patient — Appointments

#### AppointmentsClient
- **File:** `src/app/(patient)/patient/appointments/_components/AppointmentsClient.tsx`
- **Props:** `upcoming: Appointment[]`, `past: Appointment[]`, `cancelled: Appointment[]`, `ratedIds: string[]`
- **Layout:** 3 tabs (upcoming/past/cancelled) with appointment cards
- **Used in:** `/patient/appointments` page

#### CancelDialog
- **File:** `src/app/(patient)/patient/appointments/_components/cancel-dialog.tsx`
- **Used in:** AppointmentsClient — upcoming tab

#### RatingDialog
- **File:** `src/app/(patient)/patient/appointments/_components/rating-dialog.tsx`
- **Used in:** AppointmentsClient — past tab

### Patient — Profile & Settings

#### ProfileClient (Patient)
- **File:** `src/app/(patient)/patient/profile/_components/ProfileClient.tsx`
- **Used in:** `/patient/profile` page

#### EditProfileForm
- **File:** `src/app/(patient)/patient/profile/_components/edit-profile-form.tsx`
- **Used in:** ProfileClient

#### DashboardClient (Patient)
- **File:** `src/app/(patient)/patient/dashboard/_components/DashboardClient.tsx`
- **Used in:** `/patient/dashboard` page

### Patient — Layout & Navigation

#### PatientBottomNav
- **File:** `src/app/(patient)/_components/patient-bottom-nav.tsx`
- **Used in:** Patient layout (mobile only)

#### PatientLayoutHeader
- **File:** `src/app/(patient)/_components/patient-layout-header.tsx`
- **Used in:** Patient layout

---

### Professional — Agenda

#### AgendaClient
- **File:** `src/app/(professional)/pro/agenda/_components/AgendaClient.tsx`
- **Props:** `professionalId: string`, `userId: string`
- **Features:** Period filter (day/week/month), status filters, attendance tracking, auto-day-view on mobile
- **Sub-components:** AgendaControlBar, AttendanceStats, DayTimeGrid, WeekTimeGrid, MonthGrid, all modals
- **Used in:** `/pro/agenda` page

#### AgendaControlBar
- **File:** `src/app/(professional)/pro/agenda/_components/AgendaControlBar.tsx`
- **Props:** `periodFilter`, `onPeriodChange`, `statusFilters`, `onStatusChange`, `selectedDate`, `onDateChange`
- **Used in:** AgendaClient

#### AppointmentDetailDialog
- **File:** `src/app/(professional)/pro/agenda/_components/AppointmentDetailDialog.tsx`
- **Props:** `selected`, `onClose`, `onMarkAttendance`, `onStatusChange`, `isUpdating`, cancel/reject dialog controls
- **Sections:** Patient info, service details, status/attendance badges, attendance actions (present/late/absent), appointment actions (confirm/cancel/reject)
- **Used in:** Calendar views (day/week/month)

#### AttendanceStats
- **File:** `src/app/(professional)/pro/agenda/_components/AttendanceStats.tsx`
- **Displays:** Present, late, absent, no-show counts for selected period
- **Used in:** AgendaClient

#### WeekAppointmentBlock
- **File:** `src/app/(professional)/pro/agenda/_components/WeekAppointmentBlock.tsx`
- **Displays:** Compact appointment block with patient initial + time in week view
- **Used in:** WeekTimeGrid

#### MonthGrid
- **File:** `src/app/(professional)/pro/agenda/_components/MonthGrid.tsx`
- **Used in:** AgendaClient (month view)

#### NewAvailabilityModal
- **File:** `src/app/(professional)/pro/agenda/_components/NewAvailabilityModal.tsx`
- **Fields:** Day/date, start time, end time, recurrence, service association
- **Used in:** AgendaClient

#### CreateManualAppointmentDialog
- **File:** `src/app/(professional)/pro/agenda/_components/CreateManualAppointmentDialog.tsx`
- **Features:** Patient picker, service selection, date/time, notes
- **Used in:** AgendaClient, QuickActions

#### CalendarIntegrationDialog
- **File:** `src/app/(professional)/pro/agenda/_components/CalendarIntegrationDialog.tsx` (referenced)
- **Used in:** AgendaClient — Google Calendar connection

### Professional — Dashboard

#### DashboardClient (Pro)
- **File:** `src/app/(professional)/pro/dashboard/_components/DashboardClient.tsx`
- **Layout:** KPIStrip + 3-column grid (TodaySchedule / ActivityChart / UtilityWidgets) + QuickActions
- **Used in:** `/pro/dashboard` page

#### KPIStrip
- **File:** `src/app/(professional)/pro/dashboard/_components/KPIStrip.tsx`
- **Displays:** 4 KPI cards (today appointments, revenue, patients, attendance rate)
- **Used in:** DashboardClient

#### TodaySchedule
- **File:** `src/app/(professional)/pro/dashboard/_components/TodaySchedule.tsx`
- **Displays:** Chronological list of today's appointments
- **Used in:** DashboardClient

#### ActivityChart
- **File:** `src/app/(professional)/pro/dashboard/_components/ActivityChart.tsx`
- **Displays:** 7-day activity bar chart
- **Used in:** DashboardClient

#### QuickActions
- **File:** `src/app/(professional)/pro/dashboard/_components/QuickActions.tsx`
- **Actions:** New appointment, add availability, view patients
- **Used in:** DashboardClient

### Professional — Patients

#### PatientsTable
- **File:** `src/app/(professional)/pro/patients/_components/patients-table.tsx`
- **Columns:** Name, email, phone, insurance, last appointment, total appointments, actions
- **Used in:** PatientsClient

#### CreatePatientDialog
- **File:** `src/app/(professional)/pro/patients/_components/create-patient-dialog.tsx`
- **Fields:** Name, email, phone, insurance, notes
- **Used in:** PatientsClient

#### EditPatientDialog
- **File:** `src/app/(professional)/pro/patients/_components/edit-patient-dialog.tsx`
- **Used in:** PatientsTable row action

#### DeletePatientDialog
- **File:** `src/app/(professional)/pro/patients/_components/delete-patient-dialog.tsx`
- **Used in:** PatientsTable row action

### Professional — Services

#### ServicesTable
- **File:** `src/app/(professional)/pro/services/_components/services-table.tsx`
- **Columns:** Name, description, price, duration, active toggle, actions
- **Used in:** ServicesClient

### Professional — Reminders

#### RemindersClient
- **File:** `src/app/(professional)/pro/reminders/_components/RemindersClient.tsx`
- **Tabs:** Rules, Templates, History, Settings
- **Used in:** `/pro/reminders` page

#### RemindersKpiStrip
- **File:** `src/app/(professional)/pro/reminders/_components/RemindersKpiStrip.tsx`
- **Displays:** Sent, delivered, bounce rate KPIs
- **Used in:** RemindersClient

#### NewReminderDialog
- **File:** `src/app/(professional)/pro/reminders/_components/NewReminderDialog.tsx`
- **Used in:** RemindersClient

#### TemplateFormDialog
- **File:** `src/app/(professional)/pro/reminders/_components/TemplateFormDialog.tsx`
- **Used in:** RemindersClient templates tab

### Professional — Statistics

#### StatsFiltersBar
- **File:** `src/app/(professional)/pro/statistics/_components/StatsFiltersBar.tsx`
- **Filters:** Date range, specialty, service
- **Used in:** StatisticsClient

#### AnalyzeMode
- **File:** `src/app/(professional)/pro/statistics/_components/AnalyzeMode.tsx`
- **Used in:** StatisticsClient — deep analysis view

#### CompareMode
- **File:** `src/app/(professional)/pro/statistics/_components/CompareMode.tsx`
- **Used in:** StatisticsClient — comparison view

### Professional — Layout & Navigation

#### ProBottomNav
- **File:** `src/app/(professional)/_components/pro-bottom-nav.tsx`
- **Used in:** Professional layout (mobile only)

#### ProMobileHeader
- **File:** `src/app/(professional)/_components/pro-mobile-header.tsx`
- **Used in:** Professional layout (mobile only)

---

### Admin — Dashboard

#### DashboardClient (Admin)
- **File:** `src/app/(admin)/admin/dashboard/_components/DashboardClient.tsx`
- **Props:** `stats`, `topProfessionals`, `todayCount`, `pendingVerifications`, `openTickets`
- **Used in:** `/admin/dashboard` page

#### TopProfessionalsTable
- **File:** `src/app/(admin)/admin/dashboard/_components/top-professionals-table.tsx`
- **Used in:** Admin DashboardClient

### Admin — Management Tables

#### UsersTable
- **File:** `src/app/(admin)/admin/users/_components/users-table.tsx`
- **Used in:** `/admin/users` page

#### UsersFilters
- **File:** `src/app/(admin)/admin/users/_components/users-filters.tsx`
- **Used in:** `/admin/users` page

#### ProfessionalsTable
- **File:** `src/app/(admin)/admin/professionals/_components/professionals-table.tsx`
- **Used in:** `/admin/professionals` page

#### ProfessionalsFilters
- **File:** `src/app/(admin)/admin/professionals/_components/professionals-filters.tsx`
- **Used in:** `/admin/professionals` page

#### AppointmentsTable
- **File:** `src/app/(admin)/admin/appointments/_components/appointments-table.tsx`
- **Used in:** `/admin/appointments` page

#### AppointmentsFilters
- **File:** `src/app/(admin)/admin/appointments/_components/appointments-filters.tsx`
- **Used in:** `/admin/appointments` page

### Admin — Support & Content

#### SupportClient
- **File:** `src/app/(admin)/admin/support/_components/SupportClient.tsx`
- **Used in:** `/admin/support` page

#### SupportFilters
- **File:** `src/app/(admin)/admin/support/_components/support-filters.tsx`
- **Used in:** SupportClient

#### ContentTabs
- **File:** `src/app/(admin)/admin/content/_components/content-tabs.tsx`
- **Tabs:** Content pages, FAQs
- **Used in:** `/admin/content` page

### Admin — Statistics

#### StatisticsClient (Admin)
- **File:** `src/app/(admin)/admin/statistics/_components/StatisticsClient.tsx`
- **Sub-components:** KPIStrip, ActivityChart, GrowthChart, SpecialtyChart, DistributionCharts, TopProfessionals, AlertsPanel
- **Used in:** `/admin/statistics` page

### Admin — Layout & Navigation

#### AdminSidebar
- **File:** `src/app/(admin)/_components/admin-sidebar.tsx`
- **Used in:** Admin layout

#### AdminTopbar
- **File:** `src/app/(admin)/_components/admin-topbar.tsx`
- **Used in:** Admin layout

#### AdminMobileHeader
- **File:** `src/app/(admin)/_components/admin-mobile-header.tsx`
- **Used in:** Admin layout (mobile)

#### AdminMobileNav
- **File:** `src/app/(admin)/_components/admin-mobile-nav.tsx`
- **Used in:** Admin layout (mobile)

---

## 3. Shadcn/UI Base Components (`src/components/ui/`)

| # | Component | File | Key Variants / Notes |
|---|-----------|------|---------------------|
| 1 | AlertDialog | `alert-dialog.tsx` | Modal confirmation |
| 2 | Avatar | `avatar.tsx` | Image + initials fallback |
| 3 | Badge | `badge.tsx` | default, secondary, destructive, outline |
| 4 | Button | `button.tsx` | default, destructive, outline, secondary, ghost, link × default, sm, lg, icon |
| 5 | Calendar | `calendar.tsx` | Date picker with day-picker |
| 6 | Card | `card.tsx` | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| 7 | Checkbox | `checkbox.tsx` | Checked/unchecked/indeterminate |
| 8 | Command | `command.tsx` | Search/command palette |
| 9 | Dialog | `dialog.tsx` | Modal overlay |
| 10 | DropdownMenu | `dropdown-menu.tsx` | Menu with items, sub-menus |
| 11 | Form | `form.tsx` | react-hook-form integration |
| 12 | Input | `input.tsx` | Text input |
| 13 | Label | `label.tsx` | Form label |
| 14 | Popover | `popover.tsx` | Floating overlay |
| 15 | ScrollArea | `scroll-area.tsx` | Scrollable container |
| 16 | Select | `select.tsx` | Dropdown select |
| 17 | Separator | `separator.tsx` | Visual divider |
| 18 | Sheet | `sheet.tsx` | Side/bottom drawer (mobile modals) |
| 19 | Sidebar | `sidebar.tsx` | Collapsible navigation sidebar |
| 20 | Skeleton | `skeleton.tsx` | Loading placeholder |
| 21 | Sonner | `sonner.tsx` | Toast notifications |
| 22 | Switch | `switch.tsx` | Toggle switch |
| 23 | Table | `table.tsx` | Table, TableHeader, TableBody, TableRow, TableCell, TableCaption |
| 24 | Tabs | `tabs.tsx` | Tabbed interface |
| 25 | Textarea | `textarea.tsx` | Multi-line input |
| 26 | Tooltip | `tooltip.tsx` | Hover tooltip |

---

## 4. Utility & Theme Components (`src/components/`)

| Component | File | Purpose |
|-----------|------|---------|
| RoleBodyClass | `role-body-class.tsx` | Adds role-specific CSS class to body |
| ThemeProvider | `theme-provider.tsx` | Dark/light theme context |
| ProThemeToggle | `pro-theme-toggle.tsx` | Theme toggle for professionals |
| ProThemeSync | `pro-theme-sync.tsx` | Syncs professional color theme |

---

## 5. Custom Hooks

| Hook | File | Purpose |
|------|------|---------|
| useIsMobileLg | `src/hooks/use-mobile-lg.ts` | Detects mobile breakpoint (lg) |
| usePatientMobile | `src/hooks/use-patient-mobile.ts` | Patient-specific mobile detection |
| useAgendaData | `src/app/(professional)/pro/agenda/_hooks/useAgendaData.ts` | Agenda state management (appointments, availability, filters, CRUD) |

---

## Component Count Summary

| Category | Count |
|----------|-------|
| Shared components | 10 |
| Shadcn/UI base | 26 |
| Theme/utility | 4 |
| Patient business | ~18 |
| Professional business | ~55 |
| Admin business | ~25 |
| Custom hooks | 3 |
| **Total** | **~141** |
