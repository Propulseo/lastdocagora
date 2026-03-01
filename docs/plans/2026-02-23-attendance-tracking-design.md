# Attendance Tracking — Design Document

**Date:** 2026-02-23
**Status:** Approved

## Goal

Enable professionals to mark patient attendance (present, late, absent) directly from the agenda. Feed real attendance data into statistics and charts. Respect Supabase RLS.

## Existing Infrastructure

The `appointment_attendance` table already exists with the correct schema:

| Column | Type | Purpose |
|---|---|---|
| `id` | uuid | PK |
| `appointment_id` | uuid | FK → appointments (1-to-1) |
| `professional_id` | uuid | FK → professionals |
| `professional_user_id` | uuid | FK → users |
| `status` | text | `waiting` / `present` / `late` / `absent` / `cancelled` |
| `late_minutes` | int | Minutes late (nullable, v2) |
| `marked_at` | timestamptz | When marked |
| `marked_by` | uuid | Who marked |
| `created_at` / `updated_at` | timestamptz | Timestamps |

The `AttendanceStatus` type exists in `src/types/index.ts`.
The `calculate_attendance_rate()` RPC exists in the DB.
The statistics page already reads from `appointment_attendance`.

## What's Missing

1. **Server action** to write to `appointment_attendance`
2. **Attendance UI** on appointment blocks in the agenda
3. **Agenda query** doesn't join `appointment_attendance`
4. **AttendanceStats/AttendanceRate** components approximate from `appointments.status` instead of using real data

## Architecture

```
AgendaClient.tsx
  ├─ Query: appointments + appointment_attendance (joined)
  ├─ Appointment type gains .attendance field
  └─ Passes data to DayTimeGrid / WeekTimeGrid
       └─ AppointmentBlock.tsx
            ├─ Renders attendance badge (color-coded)
            └─ DropdownMenu to mark attendance
                 └─ Calls markAttendance() server action (optimistic)

AttendanceStats.tsx / AttendanceRate.tsx
  └─ Read from real appointment_attendance data (no more approximation)

Server Action: markAttendance(appointmentId, status)
  └─ Upserts appointment_attendance
  └─ Sets marked_at, marked_by
  └─ Verifies role + ownership via Supabase RLS
```

## UI Behavior

- Inline dropdown on `AppointmentBlock` (2-click flow)
- Badge always visible on the block
- Optimistic update: UI changes immediately, reverts on failure with toast error

### Status → Badge Mapping

| Status | Color | Label (PT) |
|---|---|---|
| `waiting` | gray | Aguardando |
| `present` | green | Presente |
| `late` | amber | Atrasado |
| `absent` | red | Ausente |

## Files Changed

| File | Change |
|---|---|
| `AgendaClient.tsx` | Join `appointment_attendance`, update Appointment type |
| `AppointmentBlock.tsx` | Add badge + dropdown |
| `AttendanceStats.tsx` | Use real data |
| `AttendanceRate.tsx` | Use real data |
| `DayTimeGrid.tsx` | Pass handler to blocks |
| `WeekTimeGrid.tsx` | Pass handler to blocks |
| **New** `src/app/(professional)/_actions/attendance.ts` | Server action |

## RLS

Verify `appointment_attendance` has:
- Professional: INSERT/UPDATE where `professional_user_id = auth.uid()`
- Patient: no INSERT/UPDATE
- Admin: full access

Add policies via migration if missing.

## Excluded (YAGNI)

- `late_minutes` UI (schema ready, implement in v2)
- Bulk marking
- Month view attendance
- `cancelled` status toggle (existing flow handles this)
