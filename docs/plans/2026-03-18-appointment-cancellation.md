# Appointment Cancellation from Professional Agenda

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add full appointment cancellation flow with confirmation dialog, reason tracking, and patient notification flag from the professional agenda modal.

**Architecture:** Enhance existing `updateAppointmentStatus` pattern with a dedicated `cancelAppointment` server action. New `CancelAppointmentDialog` component provides confirmation UX with reason + notify. Remove consultation_type UI (in-person only platform).

**Tech Stack:** Next.js 16 App Router, TypeScript, shadcn/ui (AlertDialog, Select, Checkbox, Textarea, Label), Supabase, Sonner toasts

---

### Task 1: Database Migration — Add missing columns

**Files:**
- Migration via Supabase MCP `apply_migration`

**Step 1: Apply migration**

```sql
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS cancellation_notify_patient boolean DEFAULT false;
```

**Step 2: Update TypeScript types**

- Modify: `src/lib/supabase/types.ts`
- Add `cancelled_by: string | null` and `cancellation_notify_patient: boolean | null` to Row, Insert, Update of `appointments`
- Add relationship entry for `cancelled_by` → `users(id)`

**Step 3: Commit**

```
feat(db): add cancelled_by and cancellation_notify_patient columns
```

---

### Task 2: Add i18n keys for cancellation dialog

**Files:**
- Modify: `src/locales/fr/professional.json`
- Modify: `src/locales/en/professional.json`
- Modify: `src/locales/pt/professional.json`

**Step 1: Add `agenda.cancellation` section to all 3 locales**

French keys:
```json
"cancellation": {
  "title": "Annuler la consultation",
  "description": "Cette action est irréversible. La consultation sera marquée comme annulée.",
  "reason": "Motif d'annulation",
  "reasonPlaceholder": "Sélectionnez un motif",
  "reasons": {
    "professional_unavailable": "Indisponibilité du professionnel",
    "patient_request": "Demande du patient",
    "duplicate": "Doublon / erreur de planification",
    "other": "Autre"
  },
  "otherReason": "Précisez le motif",
  "otherReasonPlaceholder": "Motif de l'annulation...",
  "notifyPatient": "Notifier le patient",
  "confirm": "Confirmer l'annulation",
  "cancelled": "Consultation annulée",
  "error": "Erreur lors de l'annulation"
}
```

English and Portuguese equivalents.

**Step 2: Commit**

```
feat(i18n): add cancellation dialog translations (fr, en, pt)
```

---

### Task 3: Create `cancelAppointment` server action

**Files:**
- Modify: `src/app/(professional)/_actions/attendance.ts`

**Step 1: Add `cancelAppointment` function**

Signature:
```typescript
export async function cancelAppointment(
  appointmentId: string,
  reason: string,
  notifyPatient: boolean,
): Promise<{ success: true; status: string } | { success: false; error: string }>
```

Logic:
1. Verify session via `supabase.auth.getUser()`
2. Get user role from `users` table
3. Reject if not admin or professional
4. Fetch appointment, verify `professional_user_id === user.id` (or admin)
5. Validate state: only cancel from `pending` or `confirmed`
6. Update: `status='cancelled'`, `cancelled_at=now()`, `cancelled_by=user.id`, `cancellation_reason=reason`, `cancellation_notify_patient=notifyPatient`, `updated_at=now()`
7. Return success

**Step 2: Commit**

```
feat: add cancelAppointment server action with reason and notify flag
```

---

### Task 4: Create `CancelAppointmentDialog` component

**Files:**
- Create: `src/app/(professional)/pro/agenda/_components/CancelAppointmentDialog.tsx`

**Step 1: Build the component**

Props:
```typescript
interface CancelAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, notifyPatient: boolean) => void;
  isUpdating: boolean;
}
```

UI structure:
- `AlertDialog` from shadcn/ui
- `AlertDialogHeader` with title + destructive description
- `Select` for reason (4 options from i18n)
- Conditional `Textarea` when reason === "other"
- `Checkbox` + `Label` for "Notify patient"
- `AlertDialogFooter` with Cancel + destructive Confirm button
- Confirm disabled until reason is selected
- Reset state on close

Uses: `useProfessionalI18n()` for all labels

**Step 2: Commit**

```
feat: add CancelAppointmentDialog confirmation component
```

---

### Task 5: Update `useAttendanceAction` hook

**Files:**
- Modify: `src/app/(professional)/pro/agenda/_hooks/useAttendanceAction.ts`

**Step 1: Add cancel dialog state + handler**

Add state:
```typescript
const [showCancelDialog, setShowCancelDialog] = useState(false);
```

Add handler:
```typescript
async function handleCancelAppointment(reason: string, notifyPatient: boolean) {
  // optimistic update → call cancelAppointment() → rollback on error
}
```

Return `showCancelDialog`, `setShowCancelDialog`, `handleCancelAppointment` from hook.

**Step 2: Commit**

```
feat: add cancellation flow to useAttendanceAction hook
```

---

### Task 6: Update `AppointmentDetailDialog` — wire cancel + remove type

**Files:**
- Modify: `src/app/(professional)/pro/agenda/_components/AppointmentDetailDialog.tsx`

**Step 1: Update props**

Add to interface:
```typescript
showCancelDialog: boolean;
onShowCancelDialog: (show: boolean) => void;
onCancelAppointment: (reason: string, notifyPatient: boolean) => void;
```

**Step 2: Remove consultation_type row**

Remove the grid cell that displays `selected.consultation_type` (lines 130-133).

**Step 3: Replace cancel button behavior**

Change cancel button `onClick` from `onStatusChange("cancelled")` to `onShowCancelDialog(true)`.

**Step 4: Add CancelAppointmentDialog**

Render `<CancelAppointmentDialog>` inside the component, controlled by `showCancelDialog`.

**Step 5: Commit**

```
feat: wire cancellation dialog into appointment detail modal, remove type display
```

---

### Task 7: Update `MonthDayDetailDialog` — remove type

**Files:**
- Modify: `src/app/(professional)/pro/agenda/_components/MonthDayDetailDialog.tsx`

**Step 1: Remove consultation_type grid cell** (lines 87-90)

**Step 2: Commit**

```
fix: remove consultation type from month detail dialog (in-person only)
```

---

### Task 8: Wire props through DayTimeGrid and WeekTimeGrid

**Files:**
- Modify: `src/app/(professional)/pro/agenda/_components/DayTimeGrid.tsx`
- Modify: `src/app/(professional)/pro/agenda/_components/WeekTimeGrid.tsx`

**Step 1: Pass new props from `useAttendanceAction` to `AppointmentDetailDialog`**

The hook now returns `showCancelDialog`, `setShowCancelDialog`, `handleCancelAppointment` — pass them through.

**Step 2: Commit**

```
feat: pass cancellation props through day and week grid views
```

---

### Task 9: Update Supabase types + verify build

**Step 1: Regenerate types or manually update `src/lib/supabase/types.ts`**

**Step 2: Run `npm run build` to verify no type errors**

**Step 3: Commit**

```
chore: update Supabase types for cancellation columns
```

---

## Test Checklist (Manual)

- [ ] Cancel own appointment → status becomes `cancelled`, reason saved
- [ ] Cancelled slot becomes free in agenda view
- [ ] Cancelled appointment no longer blocks scheduling
- [ ] Unauthorized professional cannot cancel another pro's appointment
- [ ] Notification flag persisted when checked
- [ ] "In-Person" / type text removed from both day/week and month modals
- [ ] Cancel dialog prevents confirm without selecting reason
- [ ] "Autre" reason shows textarea
- [ ] Dialog resets state on close
