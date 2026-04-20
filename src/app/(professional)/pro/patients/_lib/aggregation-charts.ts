import type { AcquisitionPoint, InsuranceSlice, FrequencyBucket } from "./types";
import type { PatientMapEntry } from "./aggregation-map";

// ---------------------------------------------------------------------------
// Acquisition trends (monthly)
// ---------------------------------------------------------------------------

export function buildAcquisitionTrends(
  patientMap: Map<string, PatientMapEntry>,
): AcquisitionPoint[] {
  // Group patients by the month of their first appointment with this pro
  const monthMap = new Map<string, number>();

  for (const entry of patientMap.values()) {
    const firstAppt = entry.first_appointment_with_pro;
    if (!firstAppt) continue;
    const month = firstAppt.slice(0, 7); // YYYY-MM
    monthMap.set(month, (monthMap.get(month) ?? 0) + 1);
  }

  // Sort by month
  const sorted = Array.from(monthMap.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  let cumulative = 0;
  return sorted.map(([date, newPatients]) => {
    cumulative += newPatients;
    return { date, newPatients, cumulative };
  });
}

// ---------------------------------------------------------------------------
// Insurance breakdown
// ---------------------------------------------------------------------------

export function buildInsuranceBreakdown(
  patientMap: Map<string, PatientMapEntry>,
  insuranceLabels: Record<string, string>,
): InsuranceSlice[] {
  const countMap = new Map<string, number>();

  for (const entry of patientMap.values()) {
    const provider = entry.insurance_provider || "none";
    countMap.set(provider, (countMap.get(provider) ?? 0) + 1);
  }

  return Array.from(countMap.entries())
    .map(([provider, count]) => ({
      provider,
      label: insuranceLabels[provider] ?? provider,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Frequency distribution
// ---------------------------------------------------------------------------

export function buildFrequencyDistribution(
  patientMap: Map<string, PatientMapEntry>,
): FrequencyBucket[] {
  const buckets: Record<string, number> = {
    "1": 0,
    "2-3": 0,
    "4-5": 0,
    "6-10": 0,
    "10+": 0,
  };

  for (const entry of patientMap.values()) {
    const n = entry.total_appointments;
    if (n <= 0) continue;
    if (n === 1) buckets["1"]++;
    else if (n <= 3) buckets["2-3"]++;
    else if (n <= 5) buckets["4-5"]++;
    else if (n <= 10) buckets["6-10"]++;
    else buckets["10+"]++;
  }

  return Object.entries(buckets).map(([bucket, count]) => ({
    bucket,
    count,
  }));
}
