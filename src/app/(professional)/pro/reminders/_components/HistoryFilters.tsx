"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

const CHANNELS = ["email", "sms", "whatsapp"] as const;
const STATUSES = ["pending", "sent", "delivered", "failed", "bounced"] as const;

export interface HistoryFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  channelFilter: string;
  onChannelChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  labels: {
    searchPlaceholder?: string;
    channel?: string;
    allChannels?: string;
    status?: string;
    allStatuses?: string;
  };
  statusLabels: Record<string, string>;
}

export function HistoryFilters({
  search,
  onSearchChange,
  channelFilter,
  onChannelChange,
  statusFilter,
  onStatusChange,
  labels,
  statusLabels,
}: HistoryFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative max-w-xs">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          placeholder={labels.searchPlaceholder ?? "Search..."}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={channelFilter} onValueChange={onChannelChange}>
        <SelectTrigger className="h-9 w-auto min-w-[140px]">
          <SelectValue placeholder={labels.channel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {labels.allChannels ?? "All"}
          </SelectItem>
          {CHANNELS.map((ch) => (
            <SelectItem key={ch} value={ch}>
              {ch.charAt(0).toUpperCase() + ch.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="h-9 w-auto min-w-[140px]">
          <SelectValue placeholder={labels.status} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {labels.allStatuses ?? "All"}
          </SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {statusLabels[s] ?? s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
