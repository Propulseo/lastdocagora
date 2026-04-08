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
  description_pt?: string | null;
  description_fr?: string | null;
  description_en?: string | null;
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
  mostPopularService: {
    name: string;
    name_pt?: string | null;
    name_fr?: string | null;
    name_en?: string | null;
  } | null;
  avgDuration: number;
}

export interface RevenuePerServiceSlice {
  name: string;
  name_pt?: string | null;
  name_fr?: string | null;
  name_en?: string | null;
  revenue: number;
}

export interface AppointmentVolumeSlice {
  name: string;
  name_pt?: string | null;
  name_fr?: string | null;
  name_en?: string | null;
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
