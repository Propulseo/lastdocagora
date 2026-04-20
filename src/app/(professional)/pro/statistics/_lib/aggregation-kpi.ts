import type { AppointmentRow, AvailabilityRow } from "./aggregation-types";

// ---------------------------------------------------------------------------
// Operational KPI functions
// ---------------------------------------------------------------------------

// Avg gap between consecutive appointments on the same day
export function computeAvgGapMinutes(rows: AppointmentRow[]): number {
  // Group appointments by date
  const byDate = new Map<string, AppointmentRow[]>();
  for (const r of rows) {
    if (r.status === "cancelled" || r.status === "rejected") continue;
    const list = byDate.get(r.appointment_date) ?? [];
    list.push(r);
    byDate.set(r.appointment_date, list);
  }

  let totalGap = 0;
  let gapCount = 0;

  for (const [, dayRows] of byDate) {
    if (dayRows.length < 2) continue;
    // Sort by time
    dayRows.sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
    for (let i = 1; i < dayRows.length; i++) {
      const prev = dayRows[i - 1];
      const curr = dayRows[i];
      const [ph, pm] = prev.appointment_time.split(":").map(Number);
      const prevEnd = ph * 60 + pm + (prev.duration_minutes || 30);
      const [ch, cm] = curr.appointment_time.split(":").map(Number);
      const currStart = ch * 60 + cm;
      const gap = currStart - prevEnd;
      if (gap > 0) {
        totalGap += gap;
        gapCount++;
      }
    }
  }

  return gapCount > 0 ? Math.round(totalGap / gapCount) : 0;
}

// Total billable hours (confirmed/present appointments only)
export function computeBillableHours(rows: AppointmentRow[]): number {
  let totalMinutes = 0;
  for (const r of rows) {
    if (r.status === "cancelled" || r.status === "rejected" || r.status === "no-show" || r.status === "no_show") continue;
    const att = r.appointment_attendance;
    const attStatus = Array.isArray(att) && att.length > 0 ? att[0].status : null;
    // Count if attendance is present or late, or if no attendance recorded yet (confirmed)
    if (attStatus === "present" || attStatus === "late" || !attStatus) {
      totalMinutes += r.duration_minutes || 30;
    }
  }
  return Math.round((totalMinutes / 60) * 10) / 10; // one decimal
}

// Occupancy rate = booked minutes / available minutes
export function computeOccupancyRate(
  rows: AppointmentRow[],
  availabilitySlots: AvailabilityRow[],
  from: string,
  to: string
): number {
  // Calculate booked minutes
  let bookedMinutes = 0;
  for (const r of rows) {
    if (r.status === "cancelled" || r.status === "rejected") continue;
    bookedMinutes += r.duration_minutes || 30;
  }

  // Calculate available minutes from availability slots across the date range
  let availableMinutes = 0;
  const startDate = new Date(from + "T00:00:00");
  const endDate = new Date(to + "T00:00:00");

  for (const slot of availabilitySlots) {
    const [sh, sm] = slot.start_time.split(":").map(Number);
    const [eh, em] = slot.end_time.split(":").map(Number);
    const slotMinutes = (eh * 60 + em) - (sh * 60 + sm);
    if (slotMinutes <= 0) continue;

    if (slot.is_recurring) {
      // Count how many times this day_of_week occurs in the range
      const current = new Date(startDate);
      while (current <= endDate) {
        if (current.getDay() === slot.day_of_week) {
          availableMinutes += slotMinutes;
        }
        current.setDate(current.getDate() + 1);
      }
    } else if (slot.specific_date) {
      const slotDate = new Date(slot.specific_date + "T00:00:00");
      if (slotDate >= startDate && slotDate <= endDate) {
        availableMinutes += slotMinutes;
      }
    }
  }

  if (availableMinutes === 0) return 0;
  return Math.min(Math.round((bookedMinutes / availableMinutes) * 100), 100);
}
