export type PeriodRange = "7d" | "30d" | "3m" | "6m" | "1y";
export const PERIOD_OPTIONS: PeriodRange[] = ["7d", "30d", "3m", "6m", "1y"];

export interface GrowthPoint { date: string; patients: number; professionals: number }
export interface ActivityPoint { date: string; confirmed: number; cancelled: number; noShow: number }
export interface TopPro {
  name: string; avatar_url: string | null; specialty: string; city: string;
  appointmentCount: number; rating: number;
}
export interface SpecialtyCount { specialty: string; count: number }

export interface StatisticsData {
  kpis: {
    totalUsers: number; usersDelta: number;
    totalPatients: number; newPatients: number; patientsDelta: number;
    totalProfessionals: number; verifiedPros: number; pendingPros: number; prosDelta: number;
    totalAppointments: number; periodAppointments: number;
    activityRate: number; completionRate: number;
  };
  growth: GrowthPoint[];
  activity: ActivityPoint[];
  rates: {
    attendance: number; cancellation: number; noShow: number;
    attendanceDelta: number; cancellationDelta: number; noShowDelta: number;
  };
  proStatus: { verified: number; pending: number; rejected: number };
  bookingChannel: { patient: number; manual: number };
  topProfessionals: TopPro[];
  topSpecialties: SpecialtyCount[];
  alerts: {
    pendingVerifications: number; unresolvedTickets48h: number;
    suspendedUsers: number; prosWithNoAppointments: number;
  };
  range: PeriodRange;
}
