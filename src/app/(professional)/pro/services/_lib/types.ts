// ---------------------------------------------------------------------------
// Types for Services Dashboard
// ---------------------------------------------------------------------------

export interface ServiceDashboardRow {
  id: string;
  name: string;
  name_pt?: string | null;
  name_fr?: string | null;
  name_en?: string | null;
  description: string | null;
  duration_minutes: number;
  consultation_type: string;
  is_active: boolean;
  price: number;
  total_appointments: number;
  total_revenue: number;
}

export interface ServicesKpi {
  totalServices: number;
  activeServices: number;
  avgPrice: number;
  totalRevenue: number;
  mostPopularService: string | null;
  avgDuration: number;
}

export interface RevenuePerServiceSlice {
  name: string;
  revenue: number;
}

export interface AppointmentVolumeSlice {
  name: string;
  appointments: number;
}

export interface ServicesDashboardData {
  kpi: ServicesKpi;
  revenuePerService: RevenuePerServiceSlice[];
  appointmentVolume: AppointmentVolumeSlice[];
  services: ServiceDashboardRow[];
  totalFiltered: number;
  filterOptions: {
    consultationTypes: string[];
  };
}

// Raw appointment row for service aggregation
export interface RawServiceAppointment {
  id: string;
  service_id: string | null;
  status: string;
  price: number | null;
}
