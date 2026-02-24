# Statistics Dashboard Refonte - Design Document

**Date:** 2026-02-24
**Status:** Approved
**Approach:** Hybrid (RPC SQL for KPIs + direct queries for charts)

---

## 1. Context & Audit

### Current Problems
1. **"Répartition par type" chart = 100% "En cabinet"** — `consultation_type` only has `"in-person"` in schema. Chart is useless → **delete**.
2. **"Taux de présence" often empty** — Only 12/23 appointments have attendance records. 7-day range often misses them.
3. **`get_pro_statistics()` exists in DB but is never called** — page does 3+ manual queries instead.
4. **No `created_by_user_id`** on appointments — can't track who created the RDV.
5. **`late_minutes` rarely populated** — agenda UI doesn't prompt for late minutes consistently.
6. **Tabs split artificially** — "Appointments" vs "Performance" tabs fragment what should be a single dashboard.

### Database State (23 appointments)
- Statuses: confirmed(10), completed(8), pending(2), cancelled(2), no-show(1)
- Attendance: 12 records — present(10), late(1), absent(1)
- consultation_type: 100% "in-person"
- created_via: 100% "patient_booking"
- Services: 4 (3 real + 1 test), all in-person
- location: 1 value on 16/23 rows
- Indexes: good on (professional_id, appointment_date), status, etc.

### Decisions
- **No financial KPIs** (no price, no revenue)
- **No secretary role** (no new roles)
- **No online consultation** (consultation_type stays "in-person" only)
- **Add `created_by_user_id`** on appointments (migration)
- **Insights with textual CTAs** (no functional actions yet)

---

## 2. DB Migration

### 2a. Add `created_by_user_id` on appointments

```sql
ALTER TABLE appointments ADD COLUMN created_by_user_id uuid REFERENCES users(id);
CREATE INDEX idx_appointments_created_by ON appointments(created_by_user_id);

-- Backfill existing data
UPDATE appointments SET created_by_user_id = patient_user_id
WHERE created_via = 'patient_booking' AND created_by_user_id IS NULL;
```

### 2b. New RPC function `get_pro_dashboard_stats()`

Parameters: `p_professional_id uuid, p_from_date date, p_to_date date, p_service_id uuid DEFAULT NULL, p_created_via text DEFAULT NULL`

Returns JSON:
```json
{
  "total_appointments": 23,
  "completed": 8,
  "cancelled": 2,
  "no_show": 1,
  "attendance_rate": 91.7,
  "no_show_rate": 4.3,
  "cancellation_rate": 8.7,
  "avg_late_minutes": 12.0,
  "pct_late": 8.3,
  "avg_booking_lead_days": 5.2,
  "new_patients_count": 3,
  "returning_patients_count": 7,
  "new_patients_pct": 30.0,
  "distinct_patients": 10,
  "avg_per_working_day": 1.5,
  "occupancy_rate": 65.0,
  "total_with_attendance": 12,
  "total_in_range": 23
}
```

---

## 3. Page Architecture

### Data Fetching (3 parallel queries in server component)

1. **KPI RPC** → `supabase.rpc('get_pro_dashboard_stats', { ... })` → KpiCards
2. **Chart data** → `supabase.from('appointments').select(...)` with attendance + services joins → all charts
3. **Insights data** → `supabase.from('appointments').select(...)` full history for patient risk analysis

All 3 run via `Promise.all()`. Aggregation happens in server component (Node.js), client receives pre-computed objects.

### Filters (URL search params via nuqs)
- `range`: 7d | 30d | 90d | custom (date picker)
- `service`: service_id or "all"
- `channel`: created_via value or "all"
- `status`: comma-separated statuses

Filter changes → URL update → server re-render.

---

## 4. Component Structure

```
src/app/(professional)/pro/statistics/
├── page.tsx                          # Server: 3 queries, aggregation, pass to client
├── loading.tsx                       # Skeleton matching final layout
├── export/route.ts                   # CSV export (extend with new fields)
├── _components/
│   ├── StatisticsClient.tsx          # REWRITE: single-page orchestrator
│   ├── StatsFiltersBar.tsx           # NEW: global filters bar
│   ├── KpiCards.tsx                  # NEW: 6 KPI cards overview
│   ├── TrendsChart.tsx              # REWRITE: multi-series line (RDV/no-show/cancel)
│   ├── HeatmapChart.tsx             # NEW: day-of-week x hour heatmap
│   ├── ServiceBreakdownChart.tsx     # NEW: bar chart by service + no-show overlay
│   ├── ChannelChart.tsx             # NEW: donut patient vs manual
│   ├── PunctualityChart.tsx         # NEW: bar on-time/late/absent
│   ├── RetentionCard.tsx            # NEW: % patients returned at 30/60/90d
│   ├── InsightsTable.tsx            # NEW: actionable insights with CTAs
│   ├── EmptyKpiState.tsx            # NEW: smart empty state with CTA
│   ├── SmallSampleWarning.tsx       # NEW: "based on N appointments" badge
│   └── useChartColors.ts            # KEEP: existing CSS var → hex resolver
│
│   # DELETED (replaced):
│   # TypeDistributionChart.tsx → useless (1 type only)
│   # PresenceBarChart.tsx → PunctualityChart
│   # PerformanceTab.tsx → KpiCards + InsightsTable
│   # AppointmentsLineChart.tsx → TrendsChart
│   # StatsRangeToggle.tsx → StatsFiltersBar
│   # StatsChartSkeleton.tsx → loading.tsx
```

---

## 5. Page Layout

Single-page, no tabs. Top-to-bottom:

### A) Header + Filters
- Page title + description
- StatsFiltersBar: period toggle, service select, channel select, export CSV button

### B) KPI Cards (6 cards in responsive grid)
1. **RDV totaux** — count with trend indicator
2. **Taux de présence** — % (n/N) with SmallSampleWarning if N < 5
3. **Taux no-show** — % (n/N)
4. **Taux d'annulation** — % (n/N)
5. **Retard** — avg minutes + % late
6. **Nouveaux patients** — % new vs returning

### C) Charts (responsive grid)
- **TrendsChart** (full width) — multi-series line: total RDV, no-show, cancellations per day/week
- **HeatmapChart** (half) — day-of-week x hour grid showing booking density
- **ServiceBreakdownChart** (half) — horizontal bar: top services by volume + no-show overlay
- **ChannelChart** (half) — donut: patient_booking vs manual
- **PunctualityChart** (half) — stacked bar: on-time / late / absent

### D) Retention Card (full width)
- Simple metric: % patients returned at 30d / 60d / 90d with progress bars

### E) Insights Table (full width)
- Auto-generated insights with severity icon + text + recommended action CTA
- Examples:
  - "Mardi 14h-16h : 40% no-show → Activer double rappel"
  - "Patient X : 3 annulations en 30j → Demander acompte"
  - "Semaine 8 : seulement 2 RDV → Ouvrir créneaux"
  - "Service 'Bilan complet' : 0% no-show → Service à promouvoir"

### UX Empty States
- Per-section empty states with explanation + CTA
- Never show % alone — always "91.7% (11/12)"
- SmallSampleWarning badge when N < 5
- If 0 attendance: "Marquez la présence depuis l'agenda" + link to agenda

---

## 6. Chart Library

Keep **Recharts** (already installed). Components used:
- LineChart (TrendsChart)
- Custom grid/cells (HeatmapChart — rendered as grid of colored cells, not native Recharts)
- BarChart horizontal (ServiceBreakdownChart)
- PieChart donut (ChannelChart)
- BarChart vertical stacked (PunctualityChart)

All charts use `useChartColors()` hook for theme-aware colors.

---

## 7. i18n

All text in Portuguese (pt). Extend `src/locales/pt/professional.json` with new keys under `statistics.*`.
