import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal, Pencil, Trash2, X as XIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { ColumnDef } from "@/components/shared/data-table";
import type { AppointmentRow } from "./appointments-table";
import type { AppointmentStatus, AttendanceStatus } from "@/types";

export const AVATAR_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

export function hashStr(s: string): number {
  let hash = 0;
  for (const ch of s) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  return Math.abs(hash);
}

const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "pending", "confirmed", "completed", "cancelled", "rejected", "no-show",
];

const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  "waiting", "present", "absent", "late", "cancelled",
];

interface ColumnTranslations {
  tablePatient: string;
  tableProfessional: string;
  dateAndTime: string;
  changeAttendance: string;
  viewDetails: string;
  editDateTime: string;
  cancelAppointment: string;
  deleteAppointment: string;
  deletedPatient: string;
  commonStatus: string;
  commonActions: string;
  dateLocale: "pt-PT" | "fr-FR";
  statusLabels: Record<string, string>;
  attendanceLabels: Record<string, string>;
}

interface ColumnHandlers {
  onStatusChange: (appointmentId: string, status: string) => void;
  onAttendanceChange: (appointmentId: string, status: string) => void;
  onCancel: (id: string) => void;
  onViewDetails: (row: AppointmentRow) => void;
  onEdit: (target: { id: string; date: string; time: string }) => void;
  onDelete: (id: string) => void;
}

export function buildAppointmentColumns(
  translations: ColumnTranslations,
  handlers: ColumnHandlers,
): ColumnDef<AppointmentRow>[] {
  const {
    tablePatient, tableProfessional, dateAndTime, changeAttendance,
    viewDetails, editDateTime, cancelAppointment, deleteAppointment,
    deletedPatient, commonStatus, commonActions, dateLocale,
    statusLabels, attendanceLabels,
  } = translations;

  const {
    onStatusChange, onAttendanceChange, onCancel,
    onViewDetails, onEdit, onDelete,
  } = handlers;

  return [
    {
      key: "patient",
      header: tablePatient,
      render: (row) => {
        if (!row.patient_name) {
          return <span className="text-[13px] italic text-[#9ca3af]">{deletedPatient}</span>;
        }
        return <span className="text-[13px] font-medium text-muted-foreground">{row.patient_name}</span>;
      },
    },
    {
      key: "professional",
      header: tableProfessional,
      render: (row) => {
        if (row.professional_name === "\u2014") return "\u2014";
        const bg = AVATAR_COLORS[hashStr(row.professional_name) % AVATAR_COLORS.length];
        const initials = row.professional_name.split(" ").map((w) => w[0]).join("").slice(0, 2);
        return (
          <div className="flex items-center gap-2">
            <Avatar className="size-[30px]">
              {row.professional_avatar_url && <AvatarImage src={row.professional_avatar_url} alt={row.professional_name} />}
              <AvatarFallback style={{ backgroundColor: bg, color: "white" }} className="text-[11px] font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-[13px]">{row.professional_name}</span>
          </div>
        );
      },
    },
    {
      key: "dateTime",
      header: dateAndTime,
      render: (row) => {
        const formatted = new Intl.DateTimeFormat(dateLocale, {
          day: "numeric", month: "long", year: "numeric",
        }).format(new Date(row.date));
        const duration = row.duration_minutes ? ` \u00b7 ${row.duration_minutes} min` : "";
        return <span className="text-[13px]">{formatted} \u00b7 {row.time}{duration}</span>;
      },
    },
    {
      key: "status",
      header: commonStatus,
      render: (row) => (
        <Select value={row.status} onValueChange={(v) => onStatusChange(row.id, v)}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {APPOINTMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{statusLabels[s] ?? statusLabels[s.replace("-", "_")] ?? s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "attendance",
      header: changeAttendance,
      render: (row) => (
        <Select value={row.attendance_status ?? "waiting"} onValueChange={(v) => onAttendanceChange(row.id, v)}>
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ATTENDANCE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{attendanceLabels[s] ?? s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-10",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" aria-label={commonActions}>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(row)}>
              <Eye className="size-4 mr-2" />
              {viewDetails}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit({ id: row.id, date: row.date, time: row.time })}>
              <Pencil className="size-4 mr-2" />
              {editDateTime}
            </DropdownMenuItem>
            {row.status !== "completed" && row.status !== "cancelled" && (
              <DropdownMenuItem onClick={() => onCancel(row.id)} className="text-destructive">
                <XIcon className="size-4 mr-2" />
                {cancelAppointment}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(row.id)} className="text-destructive">
              <Trash2 className="size-4 mr-2" />
              {deleteAppointment}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
