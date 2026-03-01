# Attendance Tracking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable professionals to mark patient attendance (present/late/absent) from the agenda, using the existing `appointment_attendance` table and RLS policies.

**Architecture:** Server action upserts into `appointment_attendance` (already has RLS). `AgendaClient` query joins attendance data. `AppointmentBlock` gains a dropdown menu for marking + a color-coded badge. `AttendanceStats`/`AttendanceRate` switch from approximation to real data.

**Tech Stack:** Next.js 16 App Router, Supabase (existing `appointment_attendance` table with RLS), TypeScript, shadcn/ui DropdownMenu, Sonner toast.

---

## Pre-Implementation: What Already Exists (No Changes Needed)

- **DB table:** `appointment_attendance` with columns: `id`, `appointment_id`, `professional_id`, `professional_user_id`, `status`, `late_minutes`, `marked_at`, `marked_by`, `created_at`, `updated_at`
- **RLS policies:** `pro_insert` (INSERT where `professional_user_id = auth.uid()`), `pro_or_admin_update` (UPDATE where `professional_user_id = auth.uid() OR is_admin()`), `pro_or_admin_select`, `pro_or_admin_delete` — all for `authenticated` role
- **TypeScript type:** `AttendanceStatus` in `src/types/index.ts` — `"waiting" | "present" | "absent" | "late" | "cancelled"`
- **Statistics page:** Already reads from `appointment_attendance(status)` via join
- **shadcn/ui DropdownMenu:** Already installed at `src/components/ui/dropdown-menu.tsx`

---

### Task 1: Add i18n keys for attendance actions

**Files:**
- Modify: `src/locales/pt/professional.json` (agenda section, ~line 55-136)
- Modify: `src/locales/fr/professional.json` (agenda section, ~line 55-136)

**Step 1: Add PT attendance keys**

In `src/locales/pt/professional.json`, add to the `"agenda"` object (after `"noCalendarConnected"` at line 136, before the closing `}`):

```json
"attendance": {
  "markPresent": "Marcar presente",
  "markLate": "Marcar atrasado",
  "markAbsent": "Marcar ausente",
  "resetWaiting": "Repor aguardando",
  "markAttendance": "Marcar presença",
  "updated": "Presença atualizada",
  "error": "Erro ao atualizar presença",
  "statusWaiting": "Aguardando",
  "statusPresent": "Presente",
  "statusLate": "Atrasado",
  "statusAbsent": "Ausente",
  "late": "Atrasados"
}
```

**Step 2: Add FR attendance keys**

In `src/locales/fr/professional.json`, add to the `"agenda"` object (same position):

```json
"attendance": {
  "markPresent": "Marquer présent",
  "markLate": "Marquer en retard",
  "markAbsent": "Marquer absent",
  "resetWaiting": "Remettre en attente",
  "markAttendance": "Marquer la présence",
  "updated": "Présence mise à jour",
  "error": "Erreur lors de la mise à jour",
  "statusWaiting": "En attente",
  "statusPresent": "Présent",
  "statusLate": "En retard",
  "statusAbsent": "Absent",
  "late": "En retard"
}
```

**Step 3: Commit**

```bash
git add src/locales/pt/professional.json src/locales/fr/professional.json
git commit -m "feat(attendance): add i18n keys for attendance tracking actions"
```

---

### Task 2: Create the server action

**Files:**
- Create: `src/app/(professional)/_actions/attendance.ts`

**Step 1: Create the actions directory and file**

Create `src/app/(professional)/_actions/attendance.ts`:

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import type { AttendanceStatus } from "@/types";

type MarkAttendanceResult =
  | { success: true; data: { id: string; status: string; marked_at: string } }
  | { success: false; error: string };

export async function markAttendance(
  appointmentId: string,
  status: AttendanceStatus
): Promise<MarkAttendanceResult> {
  const supabase = await createClient();

  // Verify session
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Get user role
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData) return { success: false, error: "User not found" };

  const isAdmin = userData.role === "admin";
  const isProfessional = userData.role === "professional";

  if (!isAdmin && !isProfessional) {
    return { success: false, error: "Unauthorized role" };
  }

  // Get appointment and verify ownership
  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, professional_id, professional_user_id")
    .eq("id", appointmentId)
    .single();

  if (!appointment) return { success: false, error: "Appointment not found" };

  if (!isAdmin && appointment.professional_user_id !== user.id) {
    return { success: false, error: "Not your appointment" };
  }

  const now = new Date().toISOString();

  // Upsert attendance record (1-to-1 with appointment)
  const { data, error } = await supabase
    .from("appointment_attendance")
    .upsert(
      {
        appointment_id: appointmentId,
        professional_id: appointment.professional_id,
        professional_user_id: appointment.professional_user_id,
        status,
        marked_at: now,
        marked_by: user.id,
        updated_at: now,
      },
      { onConflict: "appointment_id" }
    )
    .select("id, status, marked_at")
    .single();

  if (error) return { success: false, error: error.message };

  return { success: true, data };
}
```

**Step 2: Commit**

```bash
git add src/app/(professional)/_actions/attendance.ts
git commit -m "feat(attendance): create markAttendance server action with role verification"
```

---

### Task 3: Update Appointment type and query in AgendaClient

**Files:**
- Modify: `src/app/(professional)/pro/agenda/_components/AgendaClient.tsx`

**Step 1: Update the Appointment type** (lines 20-32)

Replace the current `Appointment` type with:

```typescript
export type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  status: string;
  consultation_type: string;
  notes: string | null;
  title: string | null;
  created_via: string | null;
  patients: { first_name: string | null; last_name: string | null } | null;
  services: { name: string } | null;
  appointment_attendance:
    | { id: string; status: string; marked_at: string | null }[]
    | null;
};
```

**Step 2: Update the Supabase query** (lines 79-85)

Change the `.select()` call to include the join:

```typescript
        .select(
          "id, appointment_date, appointment_time, duration_minutes, status, consultation_type, notes, title, created_via, patients(first_name, last_name), services(name), appointment_attendance(id, status, marked_at)"
        )
```

**Step 3: Add attendance handler callback and pass userId prop down**

After the `const [externalEventsKey, setExternalEventsKey] = useState(0);` line (line 70), add:

```typescript
  const handleAttendanceChange = useCallback(
    (appointmentId: string, newStatus: string) => {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId
            ? {
                ...apt,
                appointment_attendance: [
                  {
                    id: apt.appointment_attendance?.[0]?.id ?? "optimistic",
                    status: newStatus,
                    marked_at: new Date().toISOString(),
                  },
                ],
              }
            : apt
        )
      );
    },
    []
  );
```

**Step 4: Update stats computation** (lines 207-214)

Replace the `stats` object with one that uses real attendance data:

```typescript
  const stats = useMemo(() => {
    const total = todayAppointments.length;
    let present = 0;
    let late = 0;
    let absent = 0;
    let waiting = 0;

    for (const apt of todayAppointments) {
      const att = apt.appointment_attendance;
      if (att && att.length > 0) {
        const s = att[0].status;
        if (s === "present") present++;
        else if (s === "late") late++;
        else if (s === "absent") absent++;
        else waiting++;
      } else {
        waiting++;
      }
    }

    return { total, present, late, absent, waiting };
  }, [todayAppointments]);
```

Add `useMemo` to the import from React at line 3 if not already present. (It's already imported.)

**Step 5: Pass onAttendanceChange and userId to DayTimeGrid and WeekTimeGrid**

Update the `<DayTimeGrid>` JSX (around line 255):

```tsx
        <DayTimeGrid
          appointments={appointments}
          externalEvents={externalEvents}
          loading={loading}
          selectedDate={selectedDate}
          userId={userId}
          onAttendanceChange={handleAttendanceChange}
          onCreateAppointment={(startTime, endTime) => {
            setCreateStartTime(startTime);
            setCreateEndTime(endTime);
            setCreateDialogOpen(true);
          }}
        />
```

Update the `<WeekTimeGrid>` JSX (around line 269):

```tsx
        <WeekTimeGrid
          appointments={appointments}
          externalEvents={externalEvents}
          loading={loading}
          selectedDate={selectedDate}
          userId={userId}
          onAttendanceChange={handleAttendanceChange}
        />
```

**Step 6: Commit**

```bash
git add src/app/(professional)/pro/agenda/_components/AgendaClient.tsx
git commit -m "feat(attendance): update Appointment type, query join, and stats computation"
```

---

### Task 4: Update AttendanceStats to use real data

**Files:**
- Modify: `src/app/(professional)/pro/agenda/_components/AttendanceStats.tsx`

**Step 1: Replace the full component**

Replace the props interface and stat cards to use the new data shape:

```typescript
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CalendarCheck, Clock, UserCheck, UserMinus, UserX } from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro";

interface AttendanceStatsProps {
  stats: {
    total: number;
    present: number;
    late: number;
    absent: number;
    waiting: number;
  };
}

export function AttendanceStats({ stats }: AttendanceStatsProps) {
  const { t } = useProfessionalI18n();

  const statCards = [
    {
      key: "total" as const,
      label: t.agenda.totalRDV,
      icon: CalendarCheck,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      key: "present" as const,
      label: t.agenda.present,
      icon: UserCheck,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      key: "late" as const,
      label: t.agenda.attendance.late,
      icon: UserMinus,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      key: "absent" as const,
      label: t.agenda.absent,
      icon: UserX,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      key: "waiting" as const,
      label: t.agenda.pendingLabel,
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">
        {t.agenda.attendanceOfDay}
      </h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key}>
              <CardContent className="flex items-center gap-3 pt-6">
                <div className={`rounded-lg p-2 ${card.bg}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats[card.key]}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(professional)/pro/agenda/_components/AttendanceStats.tsx
git commit -m "feat(attendance): update AttendanceStats to use real attendance data with 5 categories"
```

---

### Task 5: Update AttendanceRate to use real data

**Files:**
- Modify: `src/app/(professional)/pro/agenda/_components/AttendanceRate.tsx`

**Step 1: Update the component to use new stats shape**

```typescript
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useProfessionalI18n } from "@/lib/i18n/pro";

interface AttendanceRateProps {
  stats: {
    total: number;
    present: number;
    late: number;
    absent: number;
    waiting: number;
  };
}

export function AttendanceRate({ stats }: AttendanceRateProps) {
  const { t } = useProfessionalI18n();

  const checked = stats.present + stats.late + stats.absent;
  const rate = checked > 0 ? Math.round(((stats.present + stats.late) / checked) * 100) : 0;

  const a = t.agenda;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">{a.attendanceRate}</p>
          <p className="text-sm font-bold">{rate}%</p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-300"
            style={{ width: `${rate}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {stats.present + stats.late} {stats.present + stats.late !== 1 ? a.presentPlural : a.presentSingular} {a.inWord}{" "}
          {checked} {checked !== 1 ? a.pastRDVPlural : a.pastRDVSingular}
          {stats.waiting > 0 && ` (${stats.waiting} ${stats.waiting !== 1 ? a.pendingPlural : a.pendingSingular})`}
        </p>
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(professional)/pro/agenda/_components/AttendanceRate.tsx
git commit -m "feat(attendance): update AttendanceRate to compute from real attendance data"
```

---

### Task 6: Add attendance dropdown to AppointmentBlock

**Files:**
- Modify: `src/app/(professional)/pro/agenda/_components/AppointmentBlock.tsx`

**Step 1: Replace the full component with attendance dropdown support**

```typescript
"use client";

import { useState } from "react";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCheck, UserMinus, UserX, Clock } from "lucide-react";
import { toast } from "sonner";
import { markAttendance } from "@/app/(professional)/_actions/attendance";
import type { Appointment } from "./AgendaClient";
import type { AttendanceStatus } from "@/types";

const statusColors: Record<string, string> = {
  confirmed: "bg-blue-100 border-blue-400 text-blue-800",
  pending: "bg-orange-100 border-orange-400 text-orange-800",
  cancelled: "bg-red-100 border-red-400 text-red-800",
  "no-show": "bg-red-100 border-red-400 text-red-800",
  completed: "bg-gray-100 border-gray-400 text-gray-800",
};

const attendanceBadgeColors: Record<string, string> = {
  waiting: "bg-gray-500",
  present: "bg-green-500",
  late: "bg-amber-500",
  absent: "bg-red-500",
};

const HOUR_HEIGHT = 80;
const START_HOUR = 7;

interface AppointmentBlockProps {
  appointment: Appointment;
  onClick: (appointment: Appointment) => void;
  onAttendanceChange?: (appointmentId: string, status: string) => void;
}

export function AppointmentBlock({
  appointment,
  onClick,
  onAttendanceChange,
}: AppointmentBlockProps) {
  const { t } = useProfessionalI18n();
  const [isUpdating, setIsUpdating] = useState(false);

  const statusLabel: Record<string, string> = {
    confirmed: t.common.status.confirmed,
    pending: t.common.status.pending,
    completed: t.common.status.completed,
    cancelled: t.common.status.cancelled,
    "no-show": t.common.status.noShow,
  };

  const [hours, minutes] = appointment.appointment_time.split(":").map(Number);
  const topOffset = (hours - START_HOUR + minutes / 60) * HOUR_HEIGHT;
  const height = (appointment.duration_minutes / 60) * HOUR_HEIGHT;

  const patient = appointment.patients;
  const service = appointment.services;
  const colors = statusColors[appointment.status] ?? statusColors.completed;
  const isManual = appointment.created_via === "manual";

  const displayName = patient?.first_name
    ? `${patient.first_name} ${patient.last_name}`
    : appointment.title || t.agenda.manualAppointment;

  // Get current attendance status
  const attendanceRecord = appointment.appointment_attendance?.[0];
  const currentAttendance = attendanceRecord?.status ?? "waiting";

  const canMarkAttendance =
    appointment.status !== "cancelled" && appointment.status !== "no-show";

  async function handleMarkAttendance(
    e: React.MouseEvent,
    newStatus: AttendanceStatus
  ) {
    e.stopPropagation();
    if (isUpdating || newStatus === currentAttendance) return;

    // Optimistic update
    const previousStatus = currentAttendance;
    onAttendanceChange?.(appointment.id, newStatus);
    setIsUpdating(true);

    const result = await markAttendance(appointment.id, newStatus);

    if (!result.success) {
      // Revert on failure
      onAttendanceChange?.(appointment.id, previousStatus);
      toast.error(t.agenda.attendance.error);
    } else {
      toast.success(t.agenda.attendance.updated);
    }

    setIsUpdating(false);
  }

  const attendanceActions = [
    {
      status: "present" as AttendanceStatus,
      label: t.agenda.attendance.markPresent,
      icon: UserCheck,
      color: "text-green-600",
    },
    {
      status: "late" as AttendanceStatus,
      label: t.agenda.attendance.markLate,
      icon: UserMinus,
      color: "text-amber-600",
    },
    {
      status: "absent" as AttendanceStatus,
      label: t.agenda.attendance.markAbsent,
      icon: UserX,
      color: "text-red-600",
    },
    {
      status: "waiting" as AttendanceStatus,
      label: t.agenda.attendance.resetWaiting,
      icon: Clock,
      color: "text-gray-600",
    },
  ];

  return (
    <div
      className="absolute left-16 right-2 group"
      style={{ top: `${topOffset}px`, height: `${Math.max(height, 30)}px` }}
    >
      <button
        type="button"
        className={`h-full w-full overflow-hidden rounded-md px-3 py-1 text-left transition-opacity hover:opacity-80 ${colors} ${
          isManual && !patient?.first_name
            ? "border-l-4 border-dashed"
            : "border-l-4"
        }`}
        onClick={() => onClick(appointment)}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5">
          {canMarkAttendance && (
            <span
              className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
                attendanceBadgeColors[currentAttendance] ?? "bg-gray-500"
              }`}
              title={t.agenda.attendance[`status${currentAttendance.charAt(0).toUpperCase() + currentAttendance.slice(1)}` as keyof typeof t.agenda.attendance] as string}
            />
          )}
          <p className="truncate text-sm font-medium">{displayName}</p>
        </div>
        {height >= 50 && (
          <p className="truncate text-xs opacity-75">
            {service?.name ?? appointment.consultation_type} &middot;{" "}
            {appointment.duration_minutes} {t.common.min} &middot;{" "}
            {statusLabel[appointment.status] ?? appointment.status}
          </p>
        )}
      </button>

      {/* Attendance dropdown trigger */}
      {canMarkAttendance && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="absolute -right-1 top-0.5 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-background shadow-sm border opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              title={t.agenda.attendance.markAttendance}
            >
              <span
                className={`h-3 w-3 rounded-full ${
                  attendanceBadgeColors[currentAttendance] ?? "bg-gray-500"
                }`}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {attendanceActions
              .filter((a) => a.status !== currentAttendance)
              .map((action) => {
                const Icon = action.icon;
                return (
                  <DropdownMenuItem
                    key={action.status}
                    onClick={(e) => handleMarkAttendance(e, action.status)}
                    disabled={isUpdating}
                    className="gap-2"
                  >
                    <Icon className={`h-4 w-4 ${action.color}`} />
                    {action.label}
                  </DropdownMenuItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export { HOUR_HEIGHT, START_HOUR };
```

**Step 2: Commit**

```bash
git add src/app/(professional)/pro/agenda/_components/AppointmentBlock.tsx
git commit -m "feat(attendance): add attendance badge and dropdown menu to AppointmentBlock"
```

---

### Task 7: Wire attendance into DayTimeGrid

**Files:**
- Modify: `src/app/(professional)/pro/agenda/_components/DayTimeGrid.tsx`

**Step 1: Update DayTimeGridProps interface** (lines 50-56)

Add `userId` and `onAttendanceChange` to the props:

```typescript
interface DayTimeGridProps {
  appointments: Appointment[];
  externalEvents: ExternalEvent[];
  loading: boolean;
  selectedDate: string;
  userId: string;
  onAttendanceChange: (appointmentId: string, status: string) => void;
  onCreateAppointment: (startTime: string, endTime: string) => void;
}
```

**Step 2: Destructure new props** (lines 58-64)

```typescript
export function DayTimeGrid({
  appointments,
  externalEvents,
  loading,
  selectedDate,
  userId,
  onAttendanceChange,
  onCreateAppointment,
}: DayTimeGridProps) {
```

**Step 3: Pass onAttendanceChange to AppointmentBlock** (lines 196-202)

Update the `appointments.map` section:

```tsx
            {appointments.map((apt) => (
              <AppointmentBlock
                key={apt.id}
                appointment={apt}
                onClick={setSelected}
                onAttendanceChange={onAttendanceChange}
              />
            ))}
```

**Step 4: Commit**

```bash
git add src/app/(professional)/pro/agenda/_components/DayTimeGrid.tsx
git commit -m "feat(attendance): wire attendance handler into DayTimeGrid"
```

---

### Task 8: Wire attendance into WeekTimeGrid

**Files:**
- Modify: `src/app/(professional)/pro/agenda/_components/WeekTimeGrid.tsx`

**Step 1: Add imports** (top of file)

Add the `markAttendance` import and attendance-related imports:

```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCheck, UserMinus, UserX, Clock } from "lucide-react";
import { toast } from "sonner";
import { markAttendance } from "@/app/(professional)/_actions/attendance";
import type { AttendanceStatus } from "@/types";
```

**Step 2: Update WeekTimeGridProps** (lines 60-65)

```typescript
interface WeekTimeGridProps {
  appointments: Appointment[];
  externalEvents: ExternalEvent[];
  loading: boolean;
  selectedDate: string;
  userId: string;
  onAttendanceChange: (appointmentId: string, status: string) => void;
}
```

**Step 3: Destructure new props** (lines 67-72)

```typescript
export function WeekTimeGrid({
  appointments,
  externalEvents,
  loading,
  selectedDate,
  userId,
  onAttendanceChange,
}: WeekTimeGridProps) {
```

**Step 4: Add attendance badge colors and handler inside the component**

After the `statusLabel` definition (~line 85), add:

```typescript
  const attendanceBadgeColors: Record<string, string> = {
    waiting: "bg-gray-500",
    present: "bg-green-500",
    late: "bg-amber-500",
    absent: "bg-red-500",
  };

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleMarkAttendance(
    e: React.MouseEvent,
    appointmentId: string,
    newStatus: AttendanceStatus,
    previousStatus: string
  ) {
    e.stopPropagation();
    if (updatingId) return;

    onAttendanceChange(appointmentId, newStatus);
    setUpdatingId(appointmentId);

    const result = await markAttendance(appointmentId, newStatus);

    if (!result.success) {
      onAttendanceChange(appointmentId, previousStatus);
      toast.error(t.agenda.attendance.error);
    } else {
      toast.success(t.agenda.attendance.updated);
    }

    setUpdatingId(null);
  }
```

**Step 5: Update appointment rendering in the week grid** (lines 195-236)

Replace the appointment button rendering inside the `dayApts.map` with:

```tsx
                    {dayApts.map((apt) => {
                      const [h, m] = apt.appointment_time
                        .split(":")
                        .map(Number);
                      const topOffset =
                        (h - START_HOUR + m / 60) * HOUR_HEIGHT;
                      const height =
                        (apt.duration_minutes / 60) * HOUR_HEIGHT;
                      const colors =
                        statusColors[apt.status] ?? statusColors.completed;
                      const isManual = apt.created_via === "manual";
                      const patient = apt.patients;
                      const displayName = patient?.first_name
                        ? `${patient.first_name} ${patient.last_name}`
                        : apt.title || t.agenda.manualAppointment;

                      const attendanceRecord = apt.appointment_attendance?.[0];
                      const currentAttendance = attendanceRecord?.status ?? "waiting";
                      const canMark = apt.status !== "cancelled" && apt.status !== "no-show";

                      return (
                        <div
                          key={apt.id}
                          className="absolute left-0.5 right-0.5 group/apt"
                          style={{
                            top: `${topOffset}px`,
                            height: `${Math.max(height, 24)}px`,
                            zIndex: 10,
                          }}
                        >
                          <button
                            type="button"
                            className={`h-full w-full overflow-hidden rounded px-1 py-0.5 text-left transition-opacity hover:opacity-80 ${colors} ${
                              isManual && !patient?.first_name
                                ? "border-l-2 border-dashed"
                                : "border-l-2"
                            }`}
                            onClick={() => setSelected(apt)}
                          >
                            <div className="flex items-center gap-1">
                              {canMark && (
                                <span
                                  className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                                    attendanceBadgeColors[currentAttendance] ?? "bg-gray-500"
                                  }`}
                                />
                              )}
                              <p className="truncate text-[11px] font-medium leading-tight">
                                {apt.appointment_time.slice(0, 5)}
                              </p>
                            </div>
                            {height >= 36 && (
                              <p className="truncate text-[10px] leading-tight opacity-80">
                                {displayName}
                              </p>
                            )}
                          </button>

                          {canMark && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="absolute -right-0.5 top-0 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-background shadow-sm border opacity-0 group-hover/apt:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                  title={t.agenda.attendance.markAttendance}
                                >
                                  <span
                                    className={`h-2 w-2 rounded-full ${
                                      attendanceBadgeColors[currentAttendance] ?? "bg-gray-500"
                                    }`}
                                  />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {(
                                  [
                                    { status: "present" as AttendanceStatus, label: t.agenda.attendance.markPresent, icon: UserCheck, color: "text-green-600" },
                                    { status: "late" as AttendanceStatus, label: t.agenda.attendance.markLate, icon: UserMinus, color: "text-amber-600" },
                                    { status: "absent" as AttendanceStatus, label: t.agenda.attendance.markAbsent, icon: UserX, color: "text-red-600" },
                                    { status: "waiting" as AttendanceStatus, label: t.agenda.attendance.resetWaiting, icon: Clock, color: "text-gray-600" },
                                  ] as const
                                )
                                  .filter((a) => a.status !== currentAttendance)
                                  .map((action) => {
                                    const Icon = action.icon;
                                    return (
                                      <DropdownMenuItem
                                        key={action.status}
                                        onClick={(e) =>
                                          handleMarkAttendance(e, apt.id, action.status, currentAttendance)
                                        }
                                        disabled={updatingId === apt.id}
                                        className="gap-2"
                                      >
                                        <Icon className={`h-4 w-4 ${action.color}`} />
                                        {action.label}
                                      </DropdownMenuItem>
                                    );
                                  })}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      );
                    })}
```

**Step 6: Commit**

```bash
git add src/app/(professional)/pro/agenda/_components/WeekTimeGrid.tsx
git commit -m "feat(attendance): wire attendance into WeekTimeGrid with inline dropdown"
```

---

### Task 9: Verify build and manual test

**Step 1: Run build**

```bash
npm run build
```

Expected: No TypeScript errors, no build failures.

**Step 2: Fix any type errors if present**

If the build fails, read the error output and fix accordingly. Common issues:
- Missing import for `useMemo` (already imported in AgendaClient)
- `attendance` key not found on i18n type (requires JSON changes from Task 1)

**Step 3: Manual test checklist**

Open the dev server (`npm run dev`) and test as a professional user:

1. **Day view**: Hover an appointment → small colored dot appears at top-right
2. **Click the dot** → Dropdown shows: Mark Present, Mark Late, Mark Absent
3. **Mark as Present** → Badge turns green, toast shows success
4. **Mark as Late** → Badge turns amber
5. **Mark as Absent** → Badge turns red
6. **Reset to Waiting** → Badge turns gray
7. **Refresh page** → Status persists (fetched from DB)
8. **AttendanceStats cards** → Show real counts (Present, Late, Absent, Waiting)
9. **AttendanceRate bar** → Computes `(present + late) / (present + late + absent)`
10. **Week view** → Same badges and dropdowns work
11. **Statistics page** → `/pro/statistics` still works, presence chart uses real data
12. **As patient** → Cannot see attendance actions (different route group)
13. **As other professional** → RLS blocks updating another pro's appointments

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(attendance): complete attendance tracking in professional agenda"
```

---

## Summary

| Task | What | Files |
|---|---|---|
| 1 | i18n keys | `locales/pt/professional.json`, `locales/fr/professional.json` |
| 2 | Server action | `_actions/attendance.ts` (new) |
| 3 | Appointment type + query + stats | `AgendaClient.tsx` |
| 4 | AttendanceStats component | `AttendanceStats.tsx` |
| 5 | AttendanceRate component | `AttendanceRate.tsx` |
| 6 | Attendance UI on blocks | `AppointmentBlock.tsx` |
| 7 | Wire into DayTimeGrid | `DayTimeGrid.tsx` |
| 8 | Wire into WeekTimeGrid | `WeekTimeGrid.tsx` |
| 9 | Build verify + manual test | — |

**No DB migration needed.** Table, RLS policies, and TypeScript types already exist.
