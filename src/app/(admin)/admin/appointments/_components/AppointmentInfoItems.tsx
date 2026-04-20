import {
  Calendar,
  Clock,
  Stethoscope,
  MapPin,
  FileText,
  Tag,
} from "lucide-react";

export function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}

interface AppointmentInfoGridProps {
  formattedDate: string;
  time: string;
  durationMinutes?: number | null;
  serviceName: string | null;
  formattedPrice: string | null;
  consultationType: string | null;
  location: string | null;
  createdViaLabel: string;
  createdAt: string | null;
  formatTimestamp: (ts: string | null) => string | null;
  d: Record<string, string>;
}

export function AppointmentInfoGrid({
  formattedDate,
  time,
  durationMinutes,
  serviceName,
  formattedPrice,
  consultationType,
  location,
  createdViaLabel,
  createdAt,
  formatTimestamp,
  d,
}: AppointmentInfoGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <InfoItem
        icon={Calendar}
        label={d.dateTime}
        value={`${formattedDate} · ${time}`}
      />
      <InfoItem
        icon={Clock}
        label={d.duration}
        value={
          durationMinutes
            ? `${durationMinutes} ${d.minutes}`
            : "—"
        }
      />
      <InfoItem
        icon={Tag}
        label={d.service}
        value={serviceName ?? d.noService}
      />
      {formattedPrice && (
        <InfoItem icon={Tag} label={d.price} value={formattedPrice} />
      )}
      <InfoItem
        icon={Stethoscope}
        label={d.consultationType}
        value={
          consultationType === "in-person"
            ? d.inPerson
            : (consultationType ?? "—")
        }
      />
      <InfoItem
        icon={MapPin}
        label={d.location}
        value={location ?? d.noLocation}
      />
      <InfoItem
        icon={FileText}
        label={d.createdVia}
        value={createdViaLabel}
      />
      {createdAt && (
        <InfoItem
          icon={Calendar}
          label={d.createdAt}
          value={formatTimestamp(createdAt)}
        />
      )}
    </div>
  );
}
