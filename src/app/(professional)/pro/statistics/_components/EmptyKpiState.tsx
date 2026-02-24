"use client";

import Link from "next/link";
import { type LucideIcon, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyKpiStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function EmptyKpiState({
  icon: Icon = BarChart3,
  title,
  description,
  ctaLabel,
  ctaHref,
}: EmptyKpiStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        {description}
      </p>
      {ctaLabel && ctaHref && (
        <Button asChild variant="outline" size="sm" className="mt-3">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      )}
    </div>
  );
}
