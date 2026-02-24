# Statistics Dashboard Refonte - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the broken/vanity statistics page with a real KPI dashboard that helps professionals reduce no-shows, optimize scheduling, and track patient retention.

**Architecture:** Hybrid approach — SQL RPC function (`get_pro_dashboard_stats`) for aggregated KPIs + 2 direct Supabase queries for chart data and insights. Server component does aggregation, client receives pre-computed objects. Recharts for visualization.

**Tech Stack:** Next.js 16 App Router, Supabase RPC, Recharts, Tailwind CSS, shadcn/ui, Portuguese i18n

**Design doc:** `docs/plans/2026-02-24-statistics-dashboard-refonte-design.md`

---

## Task 1: DB Migration — `created_by_user_id` column

**Files:**
- Apply via Supabase MCP: `apply_migration`

**Step 1: Apply migration**

Apply this migration via Supabase MCP `apply_migration` with name `add_created_by_user_id_to_appointments`:

```sql
-- Add created_by_user_id to track who created the appointment
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_appointments_created_by ON appointments(created_by_user_id);

-- Backfill: patient bookings → patient_user_id
UPDATE appointments
SET created_by_user_id = patient_user_id
WHERE created_via = 'patient_booking'
  AND created_by_user_id IS NULL
  AND patient_user_id IS NOT NULL;

-- Backfill: manual appointments → professional_user_id (created by the pro)
UPDATE appointments
SET created_by_user_id = professional_user_id
WHERE created_via = 'manual'
  AND created_by_user_id IS NULL
  AND professional_user_id IS NOT NULL;
```

**Step 2: Verify migration**

Run via Supabase MCP `execute_sql`:
```sql
SELECT created_by_user_id IS NOT NULL as has_value, COUNT(*)
FROM appointments GROUP BY 1;
```

Expected: all rows should have `has_value = true`.

**Step 3: Commit** (no file change — migration is remote)

No local commit needed for this step.

---

## Task 2: DB Migration — `get_pro_dashboard_stats()` RPC function

**Files:**
- Apply via Supabase MCP: `apply_migration`

**Step 1: Create the RPC function**

Apply migration via Supabase MCP `apply_migration` with name `create_get_pro_dashboard_stats`:

```sql
CREATE OR REPLACE FUNCTION public.get_pro_dashboard_stats(
  p_professional_id uuid,
  p_from_date date DEFAULT (CURRENT_DATE - INTERVAL '30 days')::date,
  p_to_date date DEFAULT CURRENT_DATE,
  p_service_id uuid DEFAULT NULL,
  p_created_via text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  v_total integer;
  v_completed integer;
  v_cancelled integer;
  v_no_show integer;
  v_pending integer;
  v_confirmed integer;
  -- attendance
  v_att_present integer;
  v_att_late integer;
  v_att_absent integer;
  v_att_total integer;
  v_avg_late_min numeric;
  -- patients
  v_distinct_patients integer;
  v_new_patients integer;
  v_returning_patients integer;
  -- booking lead
  v_avg_lead_days numeric;
  -- occupancy
  v_working_days integer;
BEGIN
  -- Count appointments in period with optional filters
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE a.status = 'completed'),
    COUNT(*) FILTER (WHERE a.status = 'cancelled'),
    COUNT(*) FILTER (WHERE a.status = 'no-show'),
    COUNT(*) FILTER (WHERE a.status = 'pending'),
    COUNT(*) FILTER (WHERE a.status = 'confirmed'),
    COUNT(DISTINCT a.patient_id)
  INTO v_total, v_completed, v_cancelled, v_no_show, v_pending, v_confirmed, v_distinct_patients
  FROM appointments a
  WHERE a.professional_id = p_professional_id
    AND a.appointment_date BETWEEN p_from_date AND p_to_date
    AND (p_service_id IS NULL OR a.service_id = p_service_id)
    AND (p_created_via IS NULL OR a.created_via = p_created_via);

  -- Attendance stats (from appointment_attendance joined to filtered appointments)
  SELECT
    COUNT(*) FILTER (WHERE aa.status = 'present'),
    COUNT(*) FILTER (WHERE aa.status = 'late'),
    COUNT(*) FILTER (WHERE aa.status = 'absent'),
    COUNT(*) FILTER (WHERE aa.status IN ('present', 'late', 'absent')),
    COALESCE(AVG(aa.late_minutes) FILTER (WHERE aa.late_minutes > 0), 0)
  INTO v_att_present, v_att_late, v_att_absent, v_att_total, v_avg_late_min
  FROM appointment_attendance aa
  JOIN appointments a ON aa.appointment_id = a.id
  WHERE a.professional_id = p_professional_id
    AND a.appointment_date BETWEEN p_from_date AND p_to_date
    AND (p_service_id IS NULL OR a.service_id = p_service_id)
    AND (p_created_via IS NULL OR a.created_via = p_created_via);

  -- New patients: first appointment with this pro falls within period
  SELECT COUNT(*) INTO v_new_patients
  FROM (
    SELECT patient_id, MIN(appointment_date) AS first_date
    FROM appointments
    WHERE professional_id = p_professional_id
      AND patient_id IS NOT NULL
    GROUP BY patient_id
    HAVING MIN(appointment_date) BETWEEN p_from_date AND p_to_date
  ) sub;

  -- Returning patients: had appointment before the period
  v_returning_patients := v_distinct_patients - v_new_patients;
  IF v_returning_patients < 0 THEN v_returning_patients := 0; END IF;

  -- Average booking lead time (days between created_at and appointment_date)
  SELECT COALESCE(
    AVG(a.appointment_date::date - a.created_at::date), 0
  ) INTO v_avg_lead_days
  FROM appointments a
  WHERE a.professional_id = p_professional_id
    AND a.appointment_date BETWEEN p_from_date AND p_to_date
    AND a.created_at IS NOT NULL
    AND (p_service_id IS NULL OR a.service_id = p_service_id)
    AND (p_created_via IS NULL OR a.created_via = p_created_via);

  -- Working days in period (exclude weekends)
  SELECT COUNT(*)::integer INTO v_working_days
  FROM generate_series(p_from_date, p_to_date, '1 day'::interval) d
  WHERE EXTRACT(DOW FROM d) NOT IN (0, 6);
  IF v_working_days = 0 THEN v_working_days := 1; END IF;

  result := jsonb_build_object(
    'total_appointments', v_total,
    'completed', v_completed,
    'cancelled', v_cancelled,
    'no_show', v_no_show,
    'pending', v_pending,
    'confirmed', v_confirmed,
    'attendance_present', v_att_present,
    'attendance_late', v_att_late,
    'attendance_absent', v_att_absent,
    'attendance_total', v_att_total,
    'attendance_rate', CASE WHEN v_att_total > 0
      THEN ROUND(((v_att_present + v_att_late)::numeric / v_att_total) * 100, 1)
      ELSE 0 END,
    'no_show_rate', CASE WHEN v_total > 0
      THEN ROUND((v_no_show::numeric / v_total) * 100, 1)
      ELSE 0 END,
    'cancellation_rate', CASE WHEN v_total > 0
      THEN ROUND((v_cancelled::numeric / v_total) * 100, 1)
      ELSE 0 END,
    'avg_late_minutes', ROUND(v_avg_late_min, 1),
    'pct_late', CASE WHEN v_att_total > 0
      THEN ROUND((v_att_late::numeric / v_att_total) * 100, 1)
      ELSE 0 END,
    'avg_booking_lead_days', ROUND(v_avg_lead_days, 1),
    'new_patients_count', v_new_patients,
    'returning_patients_count', v_returning_patients,
    'new_patients_pct', CASE WHEN v_distinct_patients > 0
      THEN ROUND((v_new_patients::numeric / v_distinct_patients) * 100, 1)
      ELSE 0 END,
    'distinct_patients', v_distinct_patients,
    'avg_per_working_day', ROUND(v_total::numeric / v_working_days, 1),
    'total_with_attendance', v_att_total,
    'total_in_range', v_total
  );

  RETURN result;
END;
$function$;
```

**Step 2: Test the function**

Run via Supabase MCP `execute_sql`:
```sql
SELECT get_pro_dashboard_stats(
  (SELECT id FROM professionals LIMIT 1),
  '2025-12-01'::date,
  '2026-03-31'::date
);
```

Expected: JSON object with all KPI fields populated.

---

## Task 3: Regenerate Supabase TypeScript types

**Files:**
- Modify: `src/lib/supabase/types.ts`

**Step 1: Generate types**

Use Supabase MCP `generate_typescript_types` for the project. Copy the output to `src/lib/supabase/types.ts`.

**Step 2: Verify `created_by_user_id` appears**

Confirm the `appointments` table Row type now includes `created_by_user_id: string | null`.

**Step 3: Commit**

```bash
git add src/lib/supabase/types.ts
git commit -m "chore: regenerate supabase types after dashboard stats migration"
```

---

## Task 4: i18n — Add all new statistics translation keys

**Files:**
- Modify: `src/locales/pt/professional.json` (lines 404-458, the `statistics` object)
- Modify: `src/locales/fr/professional.json` (lines 404-458, the `statistics` object)

**Step 1: Replace the `statistics` key in both locale files**

In `src/locales/pt/professional.json`, replace the entire `"statistics": { ... }` block (lines 404-458) with:

```json
"statistics": {
  "title": "Estatísticas",
  "description": "Painel de indicadores da sua atividade profissional",
  "export": "Exportar CSV",
  "range": {
    "7d": "7 dias",
    "30d": "30 dias",
    "90d": "90 dias",
    "custom": "Personalizado"
  },
  "filters": {
    "service": "Serviço",
    "allServices": "Todos os serviços",
    "channel": "Canal",
    "allChannels": "Todos",
    "channelPatient": "Paciente",
    "channelManual": "Manual",
    "status": "Estado",
    "allStatuses": "Todos os estados",
    "statusCompleted": "Concluído",
    "statusUpcoming": "Agendado",
    "statusCancelled": "Cancelado",
    "statusNoShow": "Não compareceu"
  },
  "kpi": {
    "totalAppointments": "Total Consultas",
    "attendanceRate": "Taxa de Presença",
    "noShowRate": "Taxa Não Compareceu",
    "cancellationRate": "Taxa de Cancelamento",
    "lateness": "Atraso",
    "avgMinutes": "{{value}} min em média",
    "pctLate": "{{value}}% atrasados",
    "newPatients": "Novos Pacientes",
    "newVsReturning": "{{new}} novos · {{returning}} recorrentes",
    "sampleWarning": "Baseado em {{count}} consultas — dados limitados",
    "noAttendanceData": "Sem dados de presença",
    "markAttendanceCta": "Marque a presença na agenda para alimentar esta estatística.",
    "goToAgenda": "Ir para agenda"
  },
  "trends": {
    "title": "Tendências",
    "description": "Evolução diária das consultas, não comparecimentos e cancelamentos",
    "appointments": "Consultas",
    "noShow": "Não compareceu",
    "cancelled": "Canceladas"
  },
  "heatmap": {
    "title": "Carga da agenda",
    "description": "Distribuição das consultas por dia e hora",
    "appointments": "consultas"
  },
  "services": {
    "title": "Desempenho por serviço",
    "description": "Volume e não comparecimentos por serviço",
    "total": "Total",
    "noShow": "Não compareceu"
  },
  "channel": {
    "title": "Canal de marcação",
    "description": "Quem cria os rendez-vous",
    "patientBooking": "Paciente",
    "manual": "Manual (pro)"
  },
  "punctuality": {
    "title": "Pontualidade",
    "description": "Distribuição presença / atraso / ausência",
    "onTime": "Pontual",
    "late": "Atrasado",
    "absent": "Ausente"
  },
  "retention": {
    "title": "Retenção de pacientes",
    "description": "Percentagem de pacientes que regressaram",
    "days30": "30 dias",
    "days60": "60 dias",
    "days90": "90 dias",
    "returned": "regressaram",
    "noData": "Dados insuficientes para calcular a retenção."
  },
  "insights": {
    "title": "Insights e recomendações",
    "description": "Sugestões automáticas baseadas nos seus dados",
    "noShowSlot": "{{slot}} : {{rate}}% não compareceu",
    "noShowSlotAction": "Ativar lembrete duplo para este horário",
    "riskyPatient": "{{name}} : {{count}} ausências/cancelamentos",
    "riskyPatientAction": "Considerar acompanhamento ou acompte",
    "quietWeek": "Semana {{week}} : apenas {{count}} consultas",
    "quietWeekAction": "Abrir horários adicionais ou promover agenda",
    "bestService": "\"{{name}}\" : {{rate}}% taxa presença",
    "bestServiceAction": "Serviço a promover — excelente adesão",
    "worstService": "\"{{name}}\" : {{rate}}% não compareceu",
    "worstServiceAction": "Ativar lembrete específico para este serviço",
    "noInsights": "Sem insights disponíveis para o período atual."
  },
  "emptyState": {
    "title": "Sem dados",
    "description": "Nenhuma consulta encontrada para o período selecionado.",
    "tryLongerPeriod": "Experimente selecionar um período mais longo."
  },
  "chart": {
    "appointments": "Consultas",
    "date": "Data",
    "count": "Quantidade"
  }
}
```

In `src/locales/fr/professional.json`, replace the entire `"statistics": { ... }` block with the equivalent French translations:

```json
"statistics": {
  "title": "Statistiques",
  "description": "Tableau de bord de votre activité professionnelle",
  "export": "Exporter CSV",
  "range": {
    "7d": "7 jours",
    "30d": "30 jours",
    "90d": "90 jours",
    "custom": "Personnalisé"
  },
  "filters": {
    "service": "Service",
    "allServices": "Tous les services",
    "channel": "Canal",
    "allChannels": "Tous",
    "channelPatient": "Patient",
    "channelManual": "Manuel",
    "status": "Statut",
    "allStatuses": "Tous les statuts",
    "statusCompleted": "Terminé",
    "statusUpcoming": "À venir",
    "statusCancelled": "Annulé",
    "statusNoShow": "Absent"
  },
  "kpi": {
    "totalAppointments": "Total Consultations",
    "attendanceRate": "Taux de Présence",
    "noShowRate": "Taux d'Absence",
    "cancellationRate": "Taux d'Annulation",
    "lateness": "Retard",
    "avgMinutes": "{{value}} min en moyenne",
    "pctLate": "{{value}}% en retard",
    "newPatients": "Nouveaux Patients",
    "newVsReturning": "{{new}} nouveaux · {{returning}} fidèles",
    "sampleWarning": "Basé sur {{count}} consultations — données limitées",
    "noAttendanceData": "Pas de données de présence",
    "markAttendanceCta": "Marquez la présence depuis l'agenda pour alimenter cette statistique.",
    "goToAgenda": "Aller à l'agenda"
  },
  "trends": {
    "title": "Tendances",
    "description": "Évolution quotidienne des consultations, absences et annulations",
    "appointments": "Consultations",
    "noShow": "Absent",
    "cancelled": "Annulées"
  },
  "heatmap": {
    "title": "Charge de l'agenda",
    "description": "Distribution des consultations par jour et heure",
    "appointments": "consultations"
  },
  "services": {
    "title": "Performance par service",
    "description": "Volume et absences par service",
    "total": "Total",
    "noShow": "Absent"
  },
  "channel": {
    "title": "Canal de réservation",
    "description": "Qui crée les rendez-vous",
    "patientBooking": "Patient",
    "manual": "Manuel (pro)"
  },
  "punctuality": {
    "title": "Ponctualité",
    "description": "Distribution présent / en retard / absent",
    "onTime": "À l'heure",
    "late": "En retard",
    "absent": "Absent"
  },
  "retention": {
    "title": "Rétention patients",
    "description": "Pourcentage de patients revenus",
    "days30": "30 jours",
    "days60": "60 jours",
    "days90": "90 jours",
    "returned": "revenus",
    "noData": "Données insuffisantes pour calculer la rétention."
  },
  "insights": {
    "title": "Insights et recommandations",
    "description": "Suggestions automatiques basées sur vos données",
    "noShowSlot": "{{slot}} : {{rate}}% absent",
    "noShowSlotAction": "Activer rappel double pour ce créneau",
    "riskyPatient": "{{name}} : {{count}} absences/annulations",
    "riskyPatientAction": "Envisager acompte ou rappel personnalisé",
    "quietWeek": "Semaine {{week}} : seulement {{count}} consultations",
    "quietWeekAction": "Ouvrir créneaux supplémentaires ou promouvoir agenda",
    "bestService": "\"{{name}}\" : {{rate}}% taux présence",
    "bestServiceAction": "Service à promouvoir — excellente adhésion",
    "worstService": "\"{{name}}\" : {{rate}}% absent",
    "worstServiceAction": "Activer rappel spécifique pour ce service",
    "noInsights": "Aucun insight disponible pour la période actuelle."
  },
  "emptyState": {
    "title": "Aucune donnée",
    "description": "Aucun rendez-vous trouvé pour la période sélectionnée.",
    "tryLongerPeriod": "Essayez de sélectionner une période plus longue."
  },
  "chart": {
    "appointments": "Consultations",
    "date": "Date",
    "count": "Quantité"
  }
}
```

**Step 2: Commit**

```bash
git add src/locales/pt/professional.json src/locales/fr/professional.json
git commit -m "feat(i18n): add statistics dashboard translation keys for pt and fr"
```

---

## Task 5: Create utility components — SmallSampleWarning + EmptyKpiState

**Files:**
- Create: `src/app/(professional)/pro/statistics/_components/SmallSampleWarning.tsx`
- Create: `src/app/(professional)/pro/statistics/_components/EmptyKpiState.tsx`

**Step 1: Create SmallSampleWarning**

```tsx
// src/app/(professional)/pro/statistics/_components/SmallSampleWarning.tsx
"use client";

import { AlertTriangle } from "lucide-react";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";

interface SmallSampleWarningProps {
  count: number;
  threshold?: number;
}

export function SmallSampleWarning({ count, threshold = 5 }: SmallSampleWarningProps) {
  const { t } = useProfessionalI18n();

  if (count >= threshold) return null;

  return (
    <div className="flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-1 text-xs text-amber-500">
      <AlertTriangle className="size-3" />
      <span>{t.statistics.kpi.sampleWarning.replace("{{count}}", String(count))}</span>
    </div>
  );
}
```

**Step 2: Create EmptyKpiState**

```tsx
// src/app/(professional)/pro/statistics/_components/EmptyKpiState.tsx
"use client";

import Link from "next/link";
import { type LucideIcon, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyKpiStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function EmptyKpiState({
  icon: Icon = BarChart3,
  title,
  description,
  ctaLabel,
  ctaHref,
}: EmptyKpiStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>
      {ctaLabel && ctaHref && (
        <Button asChild variant="outline" size="sm" className="mt-3">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      )}
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/(professional)/pro/statistics/_components/SmallSampleWarning.tsx src/app/(professional)/pro/statistics/_components/EmptyKpiState.tsx
git commit -m "feat(stats): add SmallSampleWarning and EmptyKpiState utility components"
```

---

## Task 6: Create StatsFiltersBar

**Files:**
- Create: `src/app/(professional)/pro/statistics/_components/StatsFiltersBar.tsx`

**Step 1: Create the filters bar component**

This component renders period toggle + service select + channel select + export button.
It reads current searchParams and uses `router.push` to update URL on filter change.

```tsx
// src/app/(professional)/pro/statistics/_components/StatsFiltersBar.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";

const RANGES = ["7d", "30d", "90d"] as const;
type StatsRange = (typeof RANGES)[number];

interface ServiceOption {
  id: string;
  name: string;
}

interface StatsFiltersBarProps {
  services: ServiceOption[];
  currentRange: string;
  currentService: string;
  currentChannel: string;
}

export function StatsFiltersBar({
  services,
  currentRange,
  currentService,
  currentChannel,
}: StatsFiltersBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useProfessionalI18n();

  const rangeLabels: Record<StatsRange, string> = {
    "7d": t.statistics.range["7d"],
    "30d": t.statistics.range["30d"],
    "90d": t.statistics.range["90d"],
  };

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all" || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handleExport = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (!params.has("range")) params.set("range", "30d");
    window.open(`/pro/statistics/export?${params.toString()}`, "_blank");
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Period toggle */}
      <div className="inline-flex items-center rounded-lg bg-muted p-0.5">
        {RANGES.map((range) => (
          <button
            key={range}
            onClick={() => updateParam("range", range)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              currentRange === range
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {rangeLabels[range]}
          </button>
        ))}
      </div>

      {/* Service filter */}
      {services.length > 0 && (
        <Select
          value={currentService || "all"}
          onValueChange={(v) => updateParam("service", v)}
        >
          <SelectTrigger className="h-9 w-auto min-w-[140px]">
            <SelectValue placeholder={t.statistics.filters.allServices} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.statistics.filters.allServices}</SelectItem>
            {services.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Channel filter */}
      <Select
        value={currentChannel || "all"}
        onValueChange={(v) => updateParam("channel", v)}
      >
        <SelectTrigger className="h-9 w-auto min-w-[120px]">
          <SelectValue placeholder={t.statistics.filters.allChannels} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.statistics.filters.allChannels}</SelectItem>
          <SelectItem value="patient_booking">
            {t.statistics.filters.channelPatient}
          </SelectItem>
          <SelectItem value="manual">
            {t.statistics.filters.channelManual}
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Export */}
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="size-4" />
        {t.statistics.export}
      </Button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(professional)/pro/statistics/_components/StatsFiltersBar.tsx
git commit -m "feat(stats): add StatsFiltersBar with period, service, and channel filters"
```

---

## Task 7: Create KpiCards component

**Files:**
- Create: `src/app/(professional)/pro/statistics/_components/KpiCards.tsx`

**Step 1: Create KpiCards**

This component renders the 6 KPI metric cards. It receives pre-computed data from the server component.

```tsx
// src/app/(professional)/pro/statistics/_components/KpiCards.tsx
"use client";

import Link from "next/link";
import {
  CalendarCheck,
  UserCheck,
  UserX,
  XCircle,
  Clock,
  UserPlus,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { SmallSampleWarning } from "./SmallSampleWarning";

export interface KpiData {
  totalAppointments: number;
  attendanceRate: number;
  attendanceTotal: number;
  noShowRate: number;
  noShowCount: number;
  cancellationRate: number;
  cancelledCount: number;
  avgLateMinutes: number;
  pctLate: number;
  newPatientsPct: number;
  newPatientsCount: number;
  returningPatientsCount: number;
  totalInRange: number;
  totalWithAttendance: number;
}

export function KpiCards({ data }: { data: KpiData }) {
  const { t } = useProfessionalI18n();

  const hasAttendance = data.totalWithAttendance > 0;

  const cards = [
    {
      label: t.statistics.kpi.totalAppointments,
      value: String(data.totalAppointments),
      icon: CalendarCheck,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: t.statistics.kpi.attendanceRate,
      value: hasAttendance
        ? `${data.attendanceRate}%`
        : "—",
      sub: hasAttendance
        ? `(${data.attendanceTotal - (data.noShowCount)}/${data.attendanceTotal})`
        : undefined,
      icon: UserCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      needsAttendance: !hasAttendance,
      sampleCount: data.totalWithAttendance,
    },
    {
      label: t.statistics.kpi.noShowRate,
      value: `${data.noShowRate}%`,
      sub: `(${data.noShowCount}/${data.totalAppointments})`,
      icon: UserX,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      label: t.statistics.kpi.cancellationRate,
      value: `${data.cancellationRate}%`,
      sub: `(${data.cancelledCount}/${data.totalAppointments})`,
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      label: t.statistics.kpi.lateness,
      value: hasAttendance
        ? `${data.avgLateMinutes} min`
        : "—",
      sub: hasAttendance
        ? t.statistics.kpi.pctLate.replace("{{value}}", String(data.pctLate))
        : undefined,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      needsAttendance: !hasAttendance,
      sampleCount: data.totalWithAttendance,
    },
    {
      label: t.statistics.kpi.newPatients,
      value: `${data.newPatientsPct}%`,
      sub: t.statistics.kpi.newVsReturning
        .replace("{{new}}", String(data.newPatientsCount))
        .replace("{{returning}}", String(data.returningPatientsCount)),
      icon: UserPlus,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {card.label}
              </span>
              <div className={`rounded-lg p-1.5 ${card.bg}`}>
                <card.icon className={`size-4 ${card.color}`} />
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight">
                {card.value}
              </span>
              {card.sub && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {card.sub}
                </span>
              )}
            </div>
            {card.needsAttendance && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarDays className="size-3" />
                <span>{t.statistics.kpi.noAttendanceData}</span>
              </div>
            )}
            {!card.needsAttendance && card.sampleCount !== undefined && (
              <SmallSampleWarning count={card.sampleCount} />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(professional)/pro/statistics/_components/KpiCards.tsx
git commit -m "feat(stats): add KpiCards component with 6 operational metrics"
```

---

## Task 8: Create TrendsChart (replaces AppointmentsLineChart)

**Files:**
- Create: `src/app/(professional)/pro/statistics/_components/TrendsChart.tsx`

**Step 1: Create TrendsChart**

Multi-series line chart showing daily RDV count, no-show count, and cancellation count.

```tsx
// src/app/(professional)/pro/statistics/_components/TrendsChart.tsx
"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { EmptyKpiState } from "./EmptyKpiState";
import { TrendingUp } from "lucide-react";
import { useChartColors } from "./useChartColors";

export interface TrendPoint {
  date: string;
  total: number;
  noShow: number;
  cancelled: number;
}

export function TrendsChart({ data }: { data: TrendPoint[] }) {
  const { t, locale } = useProfessionalI18n();
  const colors = useChartColors();

  const hasData = data.some((d) => d.total > 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString(locale === "pt" ? "pt-PT" : "fr-FR", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.statistics.trends.title}</CardTitle>
        <CardDescription>{t.statistics.trends.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyKpiState
            icon={TrendingUp}
            title={t.statistics.emptyState.title}
            description={t.statistics.emptyState.description}
          />
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colors.border}
                  strokeOpacity={0.4}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12, fill: "currentColor" }}
                  stroke="currentColor"
                  opacity={0.5}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "currentColor" }}
                  stroke="currentColor"
                  opacity={0.5}
                  width={30}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
                        <p className="text-xs font-medium text-muted-foreground">
                          {formatDate(label)}
                        </p>
                        {payload.map((item) => (
                          <p key={item.dataKey} className="text-sm" style={{ color: item.color }}>
                            {item.name}: {item.value}
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  name={t.statistics.trends.appointments}
                  stroke={colors.primary}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="noShow"
                  name={t.statistics.trends.noShow}
                  stroke={colors.chart5}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="cancelled"
                  name={t.statistics.trends.cancelled}
                  stroke={colors.destructive}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(professional)/pro/statistics/_components/TrendsChart.tsx
git commit -m "feat(stats): add TrendsChart with multi-series line (total/noShow/cancelled)"
```

---

## Task 9: Create HeatmapChart

**Files:**
- Create: `src/app/(professional)/pro/statistics/_components/HeatmapChart.tsx`

**Step 1: Create HeatmapChart**

Custom grid (not Recharts) showing appointment density by day-of-week x hour slot.

```tsx
// src/app/(professional)/pro/statistics/_components/HeatmapChart.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { EmptyKpiState } from "./EmptyKpiState";
import { CalendarDays } from "lucide-react";
import { useChartColors } from "./useChartColors";

// day 0=Sun..6=Sat, hour 8..19
export interface HeatmapCell {
  day: number;
  hour: number;
  count: number;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8h to 19h
const DAYS = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sat, Sun

export function HeatmapChart({ data }: { data: HeatmapCell[] }) {
  const { t } = useProfessionalI18n();
  const colors = useChartColors();

  const hasData = data.some((d) => d.count > 0);

  const dayLabels = t.agenda.days; // ["Domingo","Segunda","Terça",...]

  // Build lookup map
  const cellMap = new Map<string, number>();
  let maxCount = 0;
  for (const cell of data) {
    const key = `${cell.day}-${cell.hour}`;
    cellMap.set(key, (cellMap.get(key) ?? 0) + cell.count);
    const val = cellMap.get(key)!;
    if (val > maxCount) maxCount = val;
  }

  const getOpacity = (count: number) => {
    if (maxCount === 0) return 0;
    return Math.max(0.1, count / maxCount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.statistics.heatmap.title}</CardTitle>
        <CardDescription>{t.statistics.heatmap.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyKpiState
            icon={CalendarDays}
            title={t.statistics.emptyState.title}
            description={t.statistics.emptyState.description}
          />
        ) : (
          <div className="overflow-x-auto">
            <div className="grid min-w-[500px]" style={{ gridTemplateColumns: `80px repeat(${HOURS.length}, 1fr)` }}>
              {/* Header row: hours */}
              <div />
              {HOURS.map((h) => (
                <div key={h} className="py-1 text-center text-xs text-muted-foreground">
                  {h}h
                </div>
              ))}

              {/* Data rows */}
              {DAYS.map((day) => (
                <>
                  <div key={`label-${day}`} className="flex items-center pr-2 text-xs text-muted-foreground">
                    {dayLabels[day]?.slice(0, 3)}
                  </div>
                  {HOURS.map((hour) => {
                    const count = cellMap.get(`${day}-${hour}`) ?? 0;
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className="group relative m-0.5 flex items-center justify-center rounded"
                        style={{
                          backgroundColor: count > 0 ? colors.primary : undefined,
                          opacity: count > 0 ? getOpacity(count) : undefined,
                          minHeight: "28px",
                        }}
                        title={`${count} ${t.statistics.heatmap.appointments}`}
                      >
                        {count > 0 && (
                          <span className="text-[10px] font-medium text-primary-foreground">
                            {count}
                          </span>
                        )}
                        <div className="bg-muted/20 absolute inset-0 rounded" style={{ display: count === 0 ? "block" : "none" }} />
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(professional)/pro/statistics/_components/HeatmapChart.tsx
git commit -m "feat(stats): add HeatmapChart showing appointment density by day/hour"
```

---

## Task 10: Create ServiceBreakdownChart

**Files:**
- Create: `src/app/(professional)/pro/statistics/_components/ServiceBreakdownChart.tsx`

**Step 1: Create ServiceBreakdownChart**

Horizontal bar chart showing top services by volume with no-show overlay.

```tsx
// src/app/(professional)/pro/statistics/_components/ServiceBreakdownChart.tsx
"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { EmptyKpiState } from "./EmptyKpiState";
import { Stethoscope } from "lucide-react";
import { useChartColors } from "./useChartColors";

export interface ServiceStat {
  name: string;
  total: number;
  noShow: number;
}

export function ServiceBreakdownChart({ data }: { data: ServiceStat[] }) {
  const { t } = useProfessionalI18n();
  const colors = useChartColors();

  const hasData = data.length > 0 && data.some((d) => d.total > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.statistics.services.title}</CardTitle>
        <CardDescription>{t.statistics.services.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyKpiState
            icon={Stethoscope}
            title={t.statistics.emptyState.title}
            description={t.statistics.emptyState.description}
          />
        ) : (
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={colors.border}
                  strokeOpacity={0.4}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: "currentColor" }}
                  stroke="currentColor"
                  opacity={0.5}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "currentColor" }}
                  stroke="currentColor"
                  opacity={0.5}
                  width={120}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0]?.payload as ServiceStat;
                    return (
                      <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.statistics.services.total}: {item.total}
                        </p>
                        <p className="text-xs text-orange-500">
                          {t.statistics.services.noShow}: {item.noShow}
                        </p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Bar
                  dataKey="total"
                  name={t.statistics.services.total}
                  fill={colors.primary}
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="noShow"
                  name={t.statistics.services.noShow}
                  fill={colors.chart5}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(professional)/pro/statistics/_components/ServiceBreakdownChart.tsx
git commit -m "feat(stats): add ServiceBreakdownChart with volume and no-show per service"
```

---

## Task 11: Create ChannelChart + PunctualityChart

**Files:**
- Create: `src/app/(professional)/pro/statistics/_components/ChannelChart.tsx`
- Create: `src/app/(professional)/pro/statistics/_components/PunctualityChart.tsx`

**Step 1: Create ChannelChart**

Donut chart showing patient_booking vs manual appointment creation.

```tsx
// src/app/(professional)/pro/statistics/_components/ChannelChart.tsx
"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { EmptyKpiState } from "./EmptyKpiState";
import { Users } from "lucide-react";
import { useChartColors } from "./useChartColors";

export interface ChannelStat {
  channel: string;
  label: string;
  count: number;
}

export function ChannelChart({ data }: { data: ChannelStat[] }) {
  const { t } = useProfessionalI18n();
  const colors = useChartColors();

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const hasData = total > 0;

  const pieColors = [colors.chart2, colors.chart4];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.statistics.channel.title}</CardTitle>
        <CardDescription>{t.statistics.channel.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyKpiState
            icon={Users}
            title={t.statistics.emptyState.title}
            description={t.statistics.emptyState.description}
          />
        ) : (
          <div className="flex items-center gap-6">
            <div className="h-[180px] w-[180px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    strokeWidth={2}
                    stroke={colors.background}
                  >
                    {data.map((_, index) => (
                      <Cell key={index} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0];
                      const pct = total > 0 ? Math.round(((item.value as number) / total) * 100) : 0;
                      return (
                        <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
                          <p className="text-sm font-semibold">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.value} ({pct}%)
                          </p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-3">
              {data.map((item, index) => {
                const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div key={item.channel} className="flex items-center gap-2">
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: pieColors[index % pieColors.length] }}
                    />
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-semibold">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Create PunctualityChart**

Vertical stacked bar chart showing on-time / late / absent distribution.

```tsx
// src/app/(professional)/pro/statistics/_components/PunctualityChart.tsx
"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { EmptyKpiState } from "./EmptyKpiState";
import { Clock } from "lucide-react";
import { useChartColors } from "./useChartColors";
import { SmallSampleWarning } from "./SmallSampleWarning";

export interface PunctualityData {
  onTime: number;
  late: number;
  absent: number;
}

export function PunctualityChart({ data }: { data: PunctualityData }) {
  const { t } = useProfessionalI18n();
  const colors = useChartColors();

  const total = data.onTime + data.late + data.absent;
  const hasData = total > 0;

  const barData = [
    { name: t.statistics.punctuality.onTime, value: data.onTime },
    { name: t.statistics.punctuality.late, value: data.late },
    { name: t.statistics.punctuality.absent, value: data.absent },
  ];
  const barColors = [colors.chart2, colors.chart3, colors.destructive];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t.statistics.punctuality.title}</CardTitle>
            <CardDescription>{t.statistics.punctuality.description}</CardDescription>
          </div>
          <SmallSampleWarning count={total} />
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyKpiState
            icon={Clock}
            title={t.statistics.kpi.noAttendanceData}
            description={t.statistics.kpi.markAttendanceCta}
            ctaLabel={t.statistics.kpi.goToAgenda}
            ctaHref="/pro/agenda"
          />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              {barData.map((item, i) => {
                const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full" style={{ backgroundColor: barColors[i] }} />
                    <span className="text-xs text-muted-foreground">{item.name}</span>
                    <span className="text-xs font-semibold">{pct}%</span>
                  </div>
                );
              })}
            </div>
            <div className="h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={colors.border}
                    strokeOpacity={0.4}
                    horizontal={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "currentColor" }}
                    stroke="currentColor"
                    opacity={0.5}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "currentColor" }}
                    stroke="currentColor"
                    opacity={0.5}
                    width={30}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const item = payload[0];
                      const pct = total > 0 ? Math.round(((item.value as number) / total) * 100) : 0;
                      return (
                        <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
                          <p className="text-sm font-semibold">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.value} ({pct}%)
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((_, index) => (
                      <Cell key={index} fill={barColors[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/(professional)/pro/statistics/_components/ChannelChart.tsx src/app/(professional)/pro/statistics/_components/PunctualityChart.tsx
git commit -m "feat(stats): add ChannelChart (donut) and PunctualityChart (bar)"
```

---

## Task 12: Create RetentionCard

**Files:**
- Create: `src/app/(professional)/pro/statistics/_components/RetentionCard.tsx`

**Step 1: Create RetentionCard**

Shows % of patients who returned within 30/60/90 days with progress bars.

```tsx
// src/app/(professional)/pro/statistics/_components/RetentionCard.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { useChartColors } from "./useChartColors";

export interface RetentionData {
  days30: number; // percentage
  days60: number;
  days90: number;
  totalPatients: number;
}

export function RetentionCard({ data }: { data: RetentionData }) {
  const { t } = useProfessionalI18n();
  const colors = useChartColors();

  const hasData = data.totalPatients >= 2;

  const bars = [
    { label: t.statistics.retention.days30, value: data.days30 },
    { label: t.statistics.retention.days60, value: data.days60 },
    { label: t.statistics.retention.days90, value: data.days90 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.statistics.retention.title}</CardTitle>
        <CardDescription>{t.statistics.retention.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t.statistics.retention.noData}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {bars.map((bar) => (
              <div key={bar.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{bar.label}</span>
                  <span className="text-sm font-bold">{bar.value}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${bar.value}%`,
                      backgroundColor: colors.primary,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.statistics.retention.returned}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(professional)/pro/statistics/_components/RetentionCard.tsx
git commit -m "feat(stats): add RetentionCard showing patient return rates at 30/60/90d"
```

---

## Task 13: Create InsightsTable

**Files:**
- Create: `src/app/(professional)/pro/statistics/_components/InsightsTable.tsx`

**Step 1: Create InsightsTable**

Auto-generated insights with severity icon + text + recommended action CTA.

```tsx
// src/app/(professional)/pro/statistics/_components/InsightsTable.tsx
"use client";

import {
  AlertTriangle,
  TrendingDown,
  Award,
  CalendarX,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";

export interface Insight {
  type: "warning" | "danger" | "success" | "info";
  message: string;
  action: string;
}

const typeConfig: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
  danger: { icon: TrendingDown, color: "text-red-500", bg: "bg-red-500/10" },
  success: { icon: Award, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  info: { icon: CalendarX, color: "text-blue-500", bg: "bg-blue-500/10" },
};

export function InsightsTable({ insights }: { insights: Insight[] }) {
  const { t } = useProfessionalI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.statistics.insights.title}</CardTitle>
        <CardDescription>{t.statistics.insights.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t.statistics.insights.noInsights}
          </p>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, i) => {
              const config = typeConfig[insight.type] ?? typeConfig.info;
              const Icon = config.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-border/60 p-3"
                >
                  <div className={`rounded-lg p-2 ${config.bg}`}>
                    <Icon className={`size-4 ${config.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{insight.message}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      → {insight.action}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(professional)/pro/statistics/_components/InsightsTable.tsx
git commit -m "feat(stats): add InsightsTable with actionable recommendations"
```

---

## Task 14: Rewrite StatisticsClient orchestrator

**Files:**
- Rewrite: `src/app/(professional)/pro/statistics/_components/StatisticsClient.tsx`

**Step 1: Rewrite StatisticsClient**

This is the main client component that receives all pre-computed data from the server component and renders the full dashboard layout. No tabs — single page, top to bottom.

```tsx
// src/app/(professional)/pro/statistics/_components/StatisticsClient.tsx
"use client";

import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { useProfessionalI18n } from "@/lib/i18n/pro/useProfessionalI18n";
import { StatsFiltersBar } from "./StatsFiltersBar";
import { KpiCards, type KpiData } from "./KpiCards";
import { TrendsChart, type TrendPoint } from "./TrendsChart";
import { HeatmapChart, type HeatmapCell } from "./HeatmapChart";
import { ServiceBreakdownChart, type ServiceStat } from "./ServiceBreakdownChart";
import { ChannelChart, type ChannelStat } from "./ChannelChart";
import { PunctualityChart, type PunctualityData } from "./PunctualityChart";
import { RetentionCard, type RetentionData } from "./RetentionCard";
import { InsightsTable, type Insight } from "./InsightsTable";

interface ServiceOption {
  id: string;
  name: string;
}

export interface DashboardData {
  kpi: KpiData;
  trends: TrendPoint[];
  heatmap: HeatmapCell[];
  serviceBreakdown: ServiceStat[];
  channels: ChannelStat[];
  punctuality: PunctualityData;
  retention: RetentionData;
  insights: Insight[];
  filters: {
    range: string;
    service: string;
    channel: string;
    services: ServiceOption[];
  };
}

export function StatisticsClient({ data }: { data: DashboardData }) {
  const { t } = useProfessionalI18n();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.statistics.title}
        description={t.statistics.description}
        action={
          <Suspense>
            <StatsFiltersBar
              services={data.filters.services}
              currentRange={data.filters.range}
              currentService={data.filters.service}
              currentChannel={data.filters.channel}
            />
          </Suspense>
        }
      />

      {/* A) KPI Cards */}
      <KpiCards data={data.kpi} />

      {/* B) Trends - full width */}
      <TrendsChart data={data.trends} />

      {/* C) Charts grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <HeatmapChart data={data.heatmap} />
        <ServiceBreakdownChart data={data.serviceBreakdown} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChannelChart data={data.channels} />
        <PunctualityChart data={data.punctuality} />
      </div>

      {/* D) Retention */}
      <RetentionCard data={data.retention} />

      {/* E) Insights */}
      <InsightsTable insights={data.insights} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(professional)/pro/statistics/_components/StatisticsClient.tsx
git commit -m "feat(stats): rewrite StatisticsClient as single-page dashboard orchestrator"
```

---

## Task 15: Rewrite page.tsx — Server Component with 3 parallel queries + aggregation

**Files:**
- Rewrite: `src/app/(professional)/pro/statistics/page.tsx`

**Step 1: Rewrite page.tsx**

This is the most complex file. The server component does 3 parallel queries, aggregates the data into the DashboardData shape, and passes it to StatisticsClient.

The full code is long — write it with these sections:
1. Helper functions: `getDateRange(range)` (updated with 30d), `generateDateSeries(from, to)`
2. Parse searchParams: range, service, channel
3. Auth + professional lookup
4. Parallel queries: (a) RPC `get_pro_dashboard_stats`, (b) chart data query, (c) insights history query, (d) services list
5. Aggregation functions:
   - `buildTrends(rows, allDates)` → group by date, count total/noShow/cancelled per day
   - `buildHeatmap(rows)` → extract day-of-week + hour from appointment_time, count per cell
   - `buildServiceBreakdown(rows)` → group by service name, count total + noShow (from status='no-show')
   - `buildChannels(rows, t)` → group by created_via, map to labels
   - `buildPunctuality(rows)` → from attendance: present=onTime, late, absent
   - `buildRetention(historyRows)` → for each patient with completed/confirmed appt, check if they have another within 30/60/90 days
   - `buildInsights(serviceBreakdown, heatmap, historyRows, t)` → generate insight objects

Key implementation details:
- `appointment_date` is a string like "2026-02-24" — use it as-is for date grouping
- `appointment_time` is a string like "09:30" — parse hour as `parseInt(time.split(":")[0])`
- `appointment_attendance` is returned as an array (one-to-one but Supabase returns array) — use `att[0]?.status`
- Services join: `services` comes as `{ name: string }` object (not array) when it's a many-to-one

The RPC returns a JSON object — access fields like `kpiResult.data.total_appointments`.

For insights generation:
- **No-show slots**: from heatmap data, find cells with > 2 appointments where no-show rate > 25%
- **Risky patients**: from history, find patients with 2+ no-show/cancelled
- **Quiet weeks**: from trends, find weeks with avg < 1 appointment/day
- **Best/worst service**: from service breakdown, find highest/lowest attendance rates

**Step 2: Verify it compiles**

Run: `npx tsc --noEmit src/app/\(professional\)/pro/statistics/page.tsx` or just `npm run build` (in a later task).

**Step 3: Commit**

```bash
git add src/app/(professional)/pro/statistics/page.tsx
git commit -m "feat(stats): rewrite server component with 3 parallel queries and full aggregation"
```

---

## Task 16: Update loading.tsx skeleton

**Files:**
- Rewrite: `src/app/(professional)/pro/statistics/loading.tsx`
- Rewrite: `src/app/(professional)/pro/statistics/_components/StatsChartSkeleton.tsx`

**Step 1: Rewrite StatsChartSkeleton to match new layout**

```tsx
// src/app/(professional)/pro/statistics/_components/StatsChartSkeleton.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={{ height }} />
      </CardContent>
    </Card>
  );
}

export function StatsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-1 h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trends chart */}
      <StatsChartSkeleton height={300} />

      {/* Charts grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <StatsChartSkeleton height={250} />
        <StatsChartSkeleton height={250} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <StatsChartSkeleton height={200} />
        <StatsChartSkeleton height={200} />
      </div>

      {/* Retention */}
      <StatsChartSkeleton height={100} />

      {/* Insights */}
      <StatsChartSkeleton height={200} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(professional)/pro/statistics/loading.tsx src/app/(professional)/pro/statistics/_components/StatsChartSkeleton.tsx
git commit -m "feat(stats): update loading skeleton to match new dashboard layout"
```

---

## Task 17: Update CSV export route

**Files:**
- Modify: `src/app/(professional)/pro/statistics/export/route.ts`

**Step 1: Update export to support new filters**

Update the export route to:
- Accept `range` values including `30d` (in addition to existing `7d`, `3m`, `1y`)
- Accept optional `service` and `channel` query params
- Add `created_via` and `attendance` status columns to CSV

The `getDateRange` function needs a `"30d"` case:
```typescript
case "30d": {
  from = new Date(now);
  from.setDate(from.getDate() - 29);
  break;
}
```

And filter the query with optional service_id and created_via.

**Step 2: Commit**

```bash
git add src/app/(professional)/pro/statistics/export/route.ts
git commit -m "feat(stats): extend CSV export with 30d range and service/channel filters"
```

---

## Task 18: Delete old unused components

**Files:**
- Delete: `src/app/(professional)/pro/statistics/_components/TypeDistributionChart.tsx`
- Delete: `src/app/(professional)/pro/statistics/_components/PresenceBarChart.tsx`
- Delete: `src/app/(professional)/pro/statistics/_components/PerformanceTab.tsx`
- Delete: `src/app/(professional)/pro/statistics/_components/AppointmentsLineChart.tsx`
- Delete: `src/app/(professional)/pro/statistics/_components/StatsRangeToggle.tsx`

**Step 1: Delete files**

```bash
rm src/app/\(professional\)/pro/statistics/_components/TypeDistributionChart.tsx
rm src/app/\(professional\)/pro/statistics/_components/PresenceBarChart.tsx
rm src/app/\(professional\)/pro/statistics/_components/PerformanceTab.tsx
rm src/app/\(professional\)/pro/statistics/_components/AppointmentsLineChart.tsx
rm src/app/\(professional\)/pro/statistics/_components/StatsRangeToggle.tsx
```

**Step 2: Verify no remaining imports**

Search for any lingering imports of deleted components:
```bash
grep -r "TypeDistributionChart\|PresenceBarChart\|PerformanceTab\|AppointmentsLineChart\|StatsRangeToggle" src/
```

Expected: no results (all imports were in StatisticsClient which was rewritten).

**Step 3: Commit**

```bash
git add -u src/app/(professional)/pro/statistics/_components/
git commit -m "chore(stats): remove old statistics components replaced by new dashboard"
```

---

## Task 19: Build verification

**Step 1: Run build**

```bash
npm run build
```

Expected: successful build with no TypeScript or compilation errors.

**Step 2: Fix any issues**

If build fails, fix type errors, missing imports, or JSX issues. Common issues:
- Recharts type warnings (can be ignored if chart renders)
- Missing i18n keys (check both pt and fr JSON files)
- Fragment key warnings in HeatmapChart (ensure proper key props)

**Step 3: Run dev and visual verification**

```bash
npm run dev
```

Navigate to `/pro/statistics` and verify:
- All 6 KPI cards render with real data
- TrendsChart shows multi-series lines
- HeatmapChart grid renders with colored cells
- ServiceBreakdown shows bars
- ChannelChart donut renders
- PunctualityChart shows attendance distribution
- RetentionCard shows progress bars
- InsightsTable shows generated recommendations
- Filters (period, service, channel) update the page
- Empty states show correctly when filtering to no data
- SmallSampleWarning appears when N < 5

**Step 4: Final commit**

```bash
git add .
git commit -m "feat(stats): complete statistics dashboard refonte with KPI, charts, and insights"
```
