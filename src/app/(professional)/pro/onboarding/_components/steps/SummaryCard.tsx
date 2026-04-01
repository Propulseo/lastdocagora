"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

export interface SummaryCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  sub?: string;
  onEdit: () => void;
  editLabel: string;
}

export function SummaryCard({
  icon: Icon,
  title,
  value,
  sub,
  onEdit,
  editLabel,
}: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-muted p-2">
            <Icon className="size-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-sm font-medium">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={onEdit}
        >
          <Pencil className="size-3" />
          {editLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
