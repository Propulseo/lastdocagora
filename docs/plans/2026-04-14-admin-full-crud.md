# Admin Full CRUD Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Give admin full CRUD access across the entire platform — RLS policies, server actions, and UI components for managing users, appointments, professionals, support tickets, and reviews.

**Architecture:** Split into 6 phases: DB layer (RLS + migration), server actions (new file `admin-crud-actions.ts`), i18n (PT/FR/EN), UI components per admin page, global search bar, and verification. Each phase is independent enough for parallel execution where possible. All new UI uses existing patterns: `ResponsiveDialog`, `ConfirmDialog`, `DataTable`, `StatusBadge`.

**Tech Stack:** Next.js 16 App Router, Supabase SSR + MCP, TypeScript strict, shadcn/ui, Tailwind v4, i18n JSON files (PT/FR/EN)

---

## Phase 1: Database Layer

### Task 1.1: Apply RLS `admin_full_access` Policies

**Context:** Each table needs a DROP IF EXISTS + CREATE POLICY. Use MCP Supabase `execute_sql` tool.

**Tables (18):** `users`, `professionals`, `patients`, `appointments`, `services`, `availability`, `notifications`, `support_tickets`, `ticket_messages`, `reminder_rules`, `consultation_notes`, `reviews`, `review_requests`, `insurance_providers`, `professional_insurances`, `anonymous_chat_sessions`, `payments`, `appointment_attendance`

**SQL pattern per table:**
```sql
DROP POLICY IF EXISTS "admin_full_access" ON {table};
CREATE POLICY "admin_full_access" ON {table}
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));
```

**Step 1:** For each table, run `SELECT policyname FROM pg_policies WHERE tablename = '{table}'` to check existing policies.

**Step 2:** Execute the DROP + CREATE for each table. Can batch multiple tables in one SQL statement.

**Step 3:** Verify with `SELECT tablename, policyname FROM pg_policies WHERE policyname = 'admin_full_access' ORDER BY tablename` — expect 18 rows.

### Task 1.2: Add `suspended` to verification_status

**Files:**
- Migration SQL via MCP Supabase

**Step 1:** Check if `verification_status` is a text column or enum:
```sql
SELECT data_type, udt_name FROM information_schema.columns
WHERE table_name = 'professionals' AND column_name = 'verification_status';
```

**Step 2a (if text column):** No migration needed — just use the value `'suspended'` in code.

**Step 2b (if enum):** Add enum value:
```sql
ALTER TYPE verification_status ADD VALUE IF NOT EXISTS 'suspended';
```

**Step 3:** Update `src/types/index.ts` — add `"suspended"` to `VerificationStatus`:
```typescript
export type VerificationStatus = "pending" | "verified" | "rejected" | "suspended"
```

**Step 4:** Update `src/locales/*/admin/statuses.json` — add `suspended` key to verification object in all 3 locales.

---

## Phase 2: Server Actions

### Task 2.1: Create `admin-crud-actions.ts`

**Files:**
- Create: `src/app/(admin)/_actions/admin-crud-actions.ts`

Keep existing `admin-actions.ts` intact. New file imports same `getAdminClient()` and `getServiceRoleClient()` patterns.

**Actions to implement:**

#### `updateUserAdmin(userId, data)`
- Updates `users` table: `first_name`, `last_name`, `email`, `phone`, `language`
- If role=professional: also updates `professionals` table: `specialty`, `registration_number`, `consultation_fee`, `bio`, `languages_spoken`, `address`, `city`, `postal_code`
- If role=patient: also updates `patients` table: `insurance_provider`, `phone`, `address`, `city`
- `revalidatePath("/admin/users")`

#### `banUser(userId)`
- Uses `getServiceRoleClient()`
- `supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: '876600h' })`
- Also updates `users.status = 'suspended'`
- Guard: cannot ban self
- `revalidatePath("/admin/users")`

#### `unbanUser(userId)`
- Uses `getServiceRoleClient()`
- `supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: 'none' })`
- Updates `users.status = 'active'`
- `revalidatePath("/admin/users")`

#### `updateAppointmentStatusAdmin(appointmentId, status)`
- Updates `appointments.status` to any valid AppointmentStatus
- No time constraints (admin override)
- `revalidatePath("/admin/appointments")`

#### `updateAttendanceAdmin(appointmentId, attendanceStatus)`
- Upserts `appointment_attendance` — if exists UPDATE, else INSERT
- No 24h restriction
- `revalidatePath("/admin/appointments")`

#### `updateAppointmentDateTimeAdmin(appointmentId, date, time, forceConflict)`
- Updates `appointment_date` and `appointment_time`
- If `!forceConflict`: check for overlapping appointments on same professional
- `revalidatePath("/admin/appointments")`

#### `deleteAppointmentAdmin(appointmentId)`
- Deletes related: `appointment_attendance`, `appointment_notifications`, `consultation_notes`, `review_requests`, `reviews`, `payments` WHERE appointment_id
- Then deletes the appointment
- Uses service role client
- `revalidatePath("/admin/appointments")`

#### `createAppointmentAdmin(data)`
- Takes: `professionalId`, `patientId`, `serviceId`, `date`, `time`, `durationMinutes`, `notes`
- Inserts into `appointments` with `status: 'confirmed'`, `created_via: 'manual'`
- `revalidatePath("/admin/appointments")`

#### `updateProfessionalAdmin(professionalId, data)`
- Updates all editable professional fields
- `revalidatePath("/admin/professionals")`

#### `suspendProfessional(professionalId)`
- Updates `verification_status = 'suspended'`
- `revalidatePath("/admin/professionals")`

#### `unsuspendProfessional(professionalId)`
- Updates `verification_status = 'verified'`
- `revalidatePath("/admin/professionals")`

#### `deleteAvailabilityAdmin(availabilityId)`
- Deletes single availability slot
- `revalidatePath("/admin/professionals")`

#### `clearAvailabilityAdmin(professionalId)`
- Deletes all availability for a professional
- `revalidatePath("/admin/professionals")`

#### `updateServiceAdmin(serviceId, data)`
- Updates `duration_minutes` and `price` on `services`
- `revalidatePath("/admin/professionals")`

#### `assignTicketToSelf(ticketId)`
- Gets current admin user ID
- Updates `support_tickets`: `status = 'in_progress'`, adds `assigned_to` (if column exists, else skip)
- `revalidatePath("/admin/support")`

#### `deleteTicket(ticketId)`
- Deletes all `ticket_messages` for this ticket
- Then deletes the `support_tickets` row
- Uses service role client
- `revalidatePath("/admin/support")`

#### `deleteReview(reviewId)`
- Deletes `review_requests` where appointment matches (if exists)
- Deletes the review
- Recalculates professional rating via `get_professional_rating_stats` or manual recalc
- `revalidatePath("/admin/reviews")`

#### `updateReviewStatus(reviewId, status)`
- Updates `reviews.status` + `moderated_at` + `moderated_by`
- Works for any transition: pending→approved, approved→rejected, etc.
- `revalidatePath("/admin/reviews")`

#### `getAdminSearchResults(query)`
- Searches `users` by `first_name`, `last_name`, `email`, `phone` using ilike
- Returns top 10 results with id, name, email, role, status
- Not a mutation — no revalidation needed

**Step 1:** Create the file with all actions.
**Step 2:** Run `npm run build` to verify TypeScript.

---

## Phase 3: i18n

### Task 3.1: Add Translation Keys

**Files to modify (9 files):**
- `src/locales/pt/admin/users.json`
- `src/locales/fr/admin/users.json`
- `src/locales/en/admin/users.json`
- Same 3 for `appointments.json`, `professionals.json`, `support.json`, `reviews.json`, `common.json`, `statuses.json`

**New keys per section:**

#### users.json additions:
```json
{
  "edit": "Edit",
  "editUser": "Edit user",
  "editUserDescription": "Modify user information",
  "firstName": "First name",
  "lastName": "Last name",
  "email": "Email",
  "phone": "Phone",
  "language": "Language",
  "userUpdated": "User updated successfully",
  "ban": "Deactivate account",
  "unban": "Reactivate account",
  "banConfirmTitle": "Deactivate this account?",
  "banConfirmDescription": "This user will no longer be able to log in.",
  "unbanned": "Account reactivated",
  "banned": "Account deactivated",
  "deleteStep2Title": "Type the user's full name to confirm",
  "deleteStep2Placeholder": "Full name...",
  "deleteStep2Mismatch": "Name does not match",
  "specialty": "Specialty",
  "registrationNumber": "Registration number",
  "consultationFee": "Consultation fee",
  "bio": "Bio",
  "languagesSpoken": "Languages spoken",
  "address": "Address",
  "city": "City",
  "postalCode": "Postal code",
  "insurance": "Insurance",
  "adminNotes": "Admin notes"
}
```

#### appointments.json additions:
```json
{
  "changeStatus": "Change status",
  "changeAttendance": "Change attendance",
  "editDateTime": "Edit date & time",
  "deleteAppointment": "Delete appointment",
  "deleteConfirmTitle": "Delete this appointment?",
  "deleteConfirmDesc": "This appointment and all related data will be permanently deleted.",
  "appointmentDeleted": "Appointment deleted",
  "appointmentUpdated": "Appointment updated",
  "createAppointment": "Create appointment",
  "selectPatient": "Select patient",
  "selectProfessional": "Select professional",
  "selectService": "Select service",
  "date": "Date",
  "time": "Time",
  "duration": "Duration (min)",
  "notes": "Notes",
  "appointmentCreated": "Appointment created",
  "forceConflict": "Force despite scheduling conflict",
  "conflictWarning": "This time slot conflicts with an existing appointment"
}
```

#### professionals.json additions:
```json
{
  "editProfessional": "Edit professional",
  "suspend": "Suspend",
  "unsuspend": "Unsuspend",
  "suspended": "Professional suspended",
  "unsuspended": "Professional unsuspended",
  "suspendConfirmTitle": "Suspend this professional?",
  "suspendConfirmDescription": "This professional will be marked as suspended and won't appear in search results.",
  "viewAvailability": "Availability",
  "viewServices": "Services",
  "noAvailability": "No availability configured",
  "noServices": "No services configured",
  "deleteAvailability": "Delete slot",
  "clearAllAvailability": "Clear all availability",
  "clearConfirmTitle": "Clear all availability?",
  "clearConfirmDescription": "All availability slots for this professional will be deleted.",
  "availabilityDeleted": "Availability deleted",
  "allAvailabilityCleared": "All availability cleared",
  "editService": "Edit service",
  "serviceUpdated": "Service updated",
  "professionalUpdated": "Professional updated"
}
```

#### support.json additions:
```json
{
  "assignToSelf": "Take over",
  "assigned": "Ticket assigned to you",
  "deleteTicket": "Delete ticket",
  "deleteConfirmTitle": "Delete this ticket?",
  "deleteConfirmDesc": "This ticket and all its messages will be permanently deleted.",
  "ticketDeleted": "Ticket deleted"
}
```

#### reviews.json additions:
```json
{
  "deleteReview": "Delete review",
  "deleteConfirmTitle": "Delete this review?",
  "deleteConfirmDesc": "This review will be permanently deleted (GDPR compliance).",
  "reviewDeleted": "Review deleted",
  "retract": "Retract approval",
  "retracted": "Review approval retracted",
  "fullPatientName": "Patient (admin view)"
}
```

#### statuses.json additions:
```json
{
  "verification": {
    "suspended": "Suspended"
  }
}
```

#### common.json additions:
```json
{
  "globalSearch": "Search users by name, email, or phone...",
  "globalSearchResults": "Search results",
  "noSearchResults": "No users found",
  "viewProfile": "View profile",
  "close": "Close",
  "edit": "Edit",
  "delete": "Delete",
  "saving": "Saving..."
}
```

**Step 1:** Update PT files (source of truth) with Portuguese translations.
**Step 2:** Update FR files with French translations.
**Step 3:** Update EN files with English translations.
**Step 4:** Run `npm run build` to verify i18n type safety.

---

## Phase 4: UI Components

### Task 4.1: User Edit Modal

**Files:**
- Create: `src/app/(admin)/admin/users/_components/user-edit-modal.tsx`
- Modify: `src/app/(admin)/admin/users/_components/users-table.tsx` — add "Edit" action
- Modify: `src/app/(admin)/admin/users/page.tsx` — fetch additional user data for edit

**Implementation:**
- `ResponsiveDialog` with form fields
- Role-aware: show patient-specific or professional-specific fields
- Uses `updateUserAdmin` server action
- Fields: firstName, lastName, email, phone, language + role-specific fields
- Save button with loading state via `useTransition`

### Task 4.2: User Delete Double Confirmation

**Files:**
- Create: `src/app/(admin)/admin/users/_components/user-delete-dialog.tsx`
- Modify: `src/app/(admin)/admin/users/_components/users-table.tsx` — replace simple delete confirm

**Implementation:**
- Step 1: Standard confirmation dialog "Delete this user?"
- Step 2: Input field where admin must type user's full name
- Compare input vs `${firstName} ${lastName}` (case-insensitive)
- Only enable "Delete" button when names match
- Uses existing `deleteUser` action

### Task 4.3: User Ban/Unban

**Files:**
- Modify: `src/app/(admin)/admin/users/_components/users-table.tsx` — replace status toggle with ban/unban

**Implementation:**
- Replace current `updateUserStatus` calls with `banUser`/`unbanUser`
- Add confirmation dialog for ban action
- Unban action with simple confirmation

### Task 4.4: Appointment Status & Attendance Dropdowns

**Files:**
- Modify: `src/app/(admin)/admin/appointments/_components/appointments-table.tsx`

**Implementation:**
- Add inline `Select` for status with all AppointmentStatus values
- Add inline `Select` for attendance with all AttendanceStatus values
- Each triggers server action on change
- Toast success/error

### Task 4.5: Appointment Edit DateTime Modal

**Files:**
- Create: `src/app/(admin)/admin/appointments/_components/appointment-edit-modal.tsx`
- Modify: `src/app/(admin)/admin/appointments/_components/appointments-table.tsx` — add "Edit" action

**Implementation:**
- `ResponsiveDialog` with date input + time input
- Checkbox "Force despite conflict"
- Uses `updateAppointmentDateTimeAdmin` action

### Task 4.6: Appointment Delete Action

**Files:**
- Modify: `src/app/(admin)/admin/appointments/_components/appointments-table.tsx` — add "Delete" in dropdown

**Implementation:**
- Simple `ConfirmDialog` (single confirmation)
- Uses `deleteAppointmentAdmin` action

### Task 4.7: Appointment Create Modal

**Files:**
- Create: `src/app/(admin)/admin/appointments/_components/appointment-create-modal.tsx`
- Modify: `src/app/(admin)/admin/appointments/page.tsx` — add "Create" button in header, fetch patients/professionals/services lists

**Implementation:**
- `ResponsiveDialog` with:
  - Searchable select for patient (search by name/email)
  - Searchable select for professional (search by name)
  - Select for service (filtered by selected professional)
  - Date + time inputs
  - Duration input
  - Notes textarea
- Uses `createAppointmentAdmin` action
- Button in `AdminPageHeader` action slot

### Task 4.8: Professional Edit & Suspend

**Files:**
- Create: `src/app/(admin)/admin/professionals/_components/professional-edit-modal.tsx`
- Modify: `src/app/(admin)/admin/professionals/_components/professionals-table.tsx` — add edit/suspend actions

**Implementation:**
- Edit modal with all professional fields: specialty, registration_number, consultation_fee, bio, languages, address, city, postal_code
- Suspend/unsuspend button with confirmation
- Uses `updateProfessionalAdmin`, `suspendProfessional`, `unsuspendProfessional` actions

### Task 4.9: Professional Availability & Services Panels

**Files:**
- Create: `src/app/(admin)/admin/professionals/_components/professional-detail-modal.tsx`
- Modify: `src/app/(admin)/admin/professionals/_components/professionals-table.tsx` — add "View details" action

**Implementation:**
- `ResponsiveDialog` with tabs: "Availability" | "Services"
- **Availability tab:**
  - List all slots: day_of_week + start_time/end_time + is_recurring badge
  - Delete button per slot (with confirmation)
  - "Clear all" button (with confirmation)
- **Services tab:**
  - List all services: name, duration, price
  - Inline edit: click to edit duration/price, save button
- Fetch data client-side on modal open
- Uses `deleteAvailabilityAdmin`, `clearAvailabilityAdmin`, `updateServiceAdmin` actions

### Task 4.10: Support Ticket Enhancements

**Files:**
- Modify: `src/app/(admin)/admin/support/_components/ticket-row.tsx` — add self-assign, delete
- Modify: `src/app/(admin)/admin/support/_components/SupportClient.tsx` — if needed

**Implementation:**
- Add "Take over" button — calls `assignTicketToSelf`, shows toast
- Add "Delete" option in actions — `ConfirmDialog` + `deleteTicket` action
- Status select already exists — verify it allows all transitions for admin

### Task 4.11: Review Enhancements

**Files:**
- Modify: `src/app/(admin)/admin/reviews/_components/ReviewsClient.tsx`
- Modify: `src/app/(admin)/admin/reviews/page.tsx` — pass full patient names for anonymous reviews

**Implementation:**
- Add "Delete" button on each review — `ConfirmDialog` + `deleteReview` action
- Add "Retract" button on approved reviews — changes status to rejected
- Show real patient name for anonymous reviews (admin only — fetch from patients→users join)
- Uses `updateReviewStatus`, `deleteReview` actions

---

## Phase 5: Global Search Bar

### Task 5.1: Global Search Component

**Files:**
- Create: `src/app/(admin)/_components/admin-global-search.tsx`
- Modify: `src/app/(admin)/_components/admin-page-header.tsx` — integrate search

**Implementation:**
- Command palette style: input with results dropdown
- Debounced search (300ms) calling `getAdminSearchResults` action
- Each result shows: avatar, name, email, role badge, status badge
- Quick action buttons: "Edit" (navigates to user page with edit param), "View"
- Keyboard: Escape to close, Enter to select first result
- Appears on all admin pages via `AdminPageHeader`

---

## Phase 6: Verification

### Task 6.1: Verify RLS Policies

**Step 1:** Run via MCP Supabase:
```sql
SELECT tablename, policyname FROM pg_policies
WHERE policyname = 'admin_full_access'
ORDER BY tablename;
```
**Expected:** 18 rows.

### Task 6.2: Verify Build

**Step 1:** `npm run build` — must pass with 0 errors.
**Step 2:** `npm run lint` — must pass.

### Task 6.3: Security Audit

Verify every new server action:
- Starts with `getAdminClient()` check
- Returns `{ success: false, error: "Nao autorizado" }` if not admin
- No server action accepts arbitrary SQL or unvalidated input

---

## Execution Order & Dependencies

```
Phase 1 (DB) ──────────────────────┐
                                    ├─→ Phase 4 (UI) ──→ Phase 6 (Verify)
Phase 2 (Server Actions) ──────────┤
                                    │
Phase 3 (i18n) ────────────────────┘

Phase 5 (Global Search) → independent, can run in parallel with Phase 4
```

**Parallelizable:** Phase 1 + Phase 3 can run in parallel. Phase 2 depends on Phase 1 (needs RLS). Phase 4 depends on Phase 2 + 3. Phase 5 is independent.

**Estimated file count:** ~8 new files, ~15 modified files.
