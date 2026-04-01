import type { ReactNode } from "react";

export function computeAge(dob: string): number | null {
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  confirmed: "default",
  pending: "secondary",
  completed: "outline",
  cancelled: "destructive",
  "no-show": "destructive",
};

export const ATTENDANCE_COLORS: Record<string, string> = {
  present: "text-emerald-600 bg-emerald-50",
  late: "text-amber-600 bg-amber-50",
  absent: "text-red-600 bg-red-50",
};

interface InfoRowProps {
  icon: ReactNode;
  label: string;
  value: string;
}

export function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

interface MiniKpiProps {
  icon: ReactNode;
  label: string;
  value: string;
}

export function MiniKpi({ icon, label, value }: MiniKpiProps) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-xs text-muted-foreground truncate">{label}</p>
      </div>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
