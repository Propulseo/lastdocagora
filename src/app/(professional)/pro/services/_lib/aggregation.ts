import type {
  ServiceDashboardRow,
  ServicesKpi,
  RevenuePerServiceSlice,
  AppointmentVolumeSlice,
  RawServiceAppointment,
} from "./types";

// ---------------------------------------------------------------------------
// Raw DB service row
// ---------------------------------------------------------------------------

interface RawServiceRow {
  id: string;
  name: string;
  name_pt?: string | null;
  name_fr?: string | null;
  name_en?: string | null;
  description: string | null;
  description_pt?: string | null;
  description_fr?: string | null;
  description_en?: string | null;
  duration_minutes: number;
  consultation_type: string;
  is_active: boolean | null;
  price: number;
}

// ---------------------------------------------------------------------------
// Build enriched service rows from services + appointments
// ---------------------------------------------------------------------------

export function buildServiceRows(
  services: RawServiceRow[],
  appointments: RawServiceAppointment[],
): ServiceDashboardRow[] {
  // Count appointments and revenue per service
  const statsMap = new Map<string, { count: number; revenue: number }>();
  for (const apt of appointments) {
    if (!apt.service_id || apt.status === "cancelled") continue;
    const entry = statsMap.get(apt.service_id) ?? { count: 0, revenue: 0 };
    entry.count += 1;
    entry.revenue += apt.price ?? 0;
    statsMap.set(apt.service_id, entry);
  }

  return services.map((s) => {
    const stats = statsMap.get(s.id);
    return {
      id: s.id,
      name: s.name,
      name_pt: s.name_pt,
      name_fr: s.name_fr,
      name_en: s.name_en,
      description: s.description,
      description_pt: s.description_pt,
      description_fr: s.description_fr,
      description_en: s.description_en,
      duration_minutes: s.duration_minutes,
      consultation_type: s.consultation_type,
      is_active: s.is_active ?? true,
      price: s.price,
      total_appointments: stats?.count ?? 0,
      total_revenue: stats?.revenue ?? 0,
    };
  });
}

// ---------------------------------------------------------------------------
// KPI computation
// ---------------------------------------------------------------------------

export function buildServicesKpi(rows: ServiceDashboardRow[]): ServicesKpi {
  const totalServices = rows.length;
  const activeServices = rows.filter((s) => s.is_active).length;

  const pricesAboveZero = rows.filter((s) => s.price > 0);
  const avgPrice =
    pricesAboveZero.length > 0
      ? Math.round(
          (pricesAboveZero.reduce((sum, s) => sum + s.price, 0) /
            pricesAboveZero.length) *
            100,
        ) / 100
      : 0;

  const totalRevenue = rows.reduce((sum, s) => sum + s.total_revenue, 0);

  // Most popular service by appointment count
  let mostPopularService: ServicesKpi["mostPopularService"] = null;
  let maxAppointments = 0;
  for (const s of rows) {
    if (s.total_appointments > maxAppointments) {
      maxAppointments = s.total_appointments;
      mostPopularService = {
        name: s.name,
        name_pt: s.name_pt,
        name_fr: s.name_fr,
        name_en: s.name_en,
      };
    }
  }

  const avgDuration =
    totalServices > 0
      ? Math.round(
          rows.reduce((sum, s) => sum + s.duration_minutes, 0) / totalServices,
        )
      : 0;

  return {
    totalServices,
    activeServices,
    avgPrice,
    totalRevenue,
    mostPopularService,
    avgDuration,
  };
}

// ---------------------------------------------------------------------------
// Revenue per service (bar chart)
// ---------------------------------------------------------------------------

export function buildRevenuePerService(
  rows: ServiceDashboardRow[],
): RevenuePerServiceSlice[] {
  return rows
    .filter((s) => s.total_revenue > 0)
    .map((s) => ({
      name: s.name,
      name_pt: s.name_pt,
      name_fr: s.name_fr,
      name_en: s.name_en,
      revenue: s.total_revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

// ---------------------------------------------------------------------------
// Appointment volume per service (bar chart)
// ---------------------------------------------------------------------------

export function buildAppointmentVolume(
  rows: ServiceDashboardRow[],
): AppointmentVolumeSlice[] {
  return rows
    .filter((s) => s.total_appointments > 0)
    .map((s) => ({
      name: s.name,
      name_pt: s.name_pt,
      name_fr: s.name_fr,
      name_en: s.name_en,
      appointments: s.total_appointments,
    }))
    .sort((a, b) => b.appointments - a.appointments)
    .slice(0, 10);
}

// ---------------------------------------------------------------------------
// Filtering + sorting
// ---------------------------------------------------------------------------

export function applyServiceFilters(
  services: ServiceDashboardRow[],
  params: {
    search?: string;
    status?: string;
    sort?: string;
  },
): ServiceDashboardRow[] {
  let filtered = [...services];

  // Search by name
  if (params.search?.trim()) {
    const q = params.search.toLowerCase().trim();
    filtered = filtered.filter((s) => s.name.toLowerCase().includes(q));
  }

  // Status filter
  if (params.status === "active") {
    filtered = filtered.filter((s) => s.is_active);
  } else if (params.status === "inactive") {
    filtered = filtered.filter((s) => !s.is_active);
  }

  // Sort
  switch (params.sort) {
    case "name":
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "price":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "duration":
      filtered.sort((a, b) => b.duration_minutes - a.duration_minutes);
      break;
    case "appointments":
      filtered.sort((a, b) => b.total_appointments - a.total_appointments);
      break;
    case "revenue":
      filtered.sort((a, b) => b.total_revenue - a.total_revenue);
      break;
    default:
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  return filtered;
}

// ---------------------------------------------------------------------------
// Extract unique consultation types
// ---------------------------------------------------------------------------

export function getUniqueConsultationTypes(
  services: ServiceDashboardRow[],
): string[] {
  const set = new Set<string>();
  for (const s of services) {
    if (s.consultation_type) set.add(s.consultation_type);
  }
  return Array.from(set).sort();
}
