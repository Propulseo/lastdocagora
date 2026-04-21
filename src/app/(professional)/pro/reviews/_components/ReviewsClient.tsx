"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHADOW, RADIUS, TYPE, SPACING } from "@/lib/design-tokens";
import { PageHeader } from "@/components/shared/page-header";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { ReviewCard } from "./ReviewCard";

export interface ReviewItem {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  patientInitials: string;
}

interface ReviewsClientProps {
  reviews: ReviewItem[];
}

export function ReviewsClient({ reviews }: ReviewsClientProps) {
  const { t } = useProfessionalI18n();

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.reviews.title}
        description={t.reviews.subtitle}
      />

      {/* Summary bar */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-6 border border-border/40 bg-card",
          RADIUS.card,
          SHADOW.card,
          SPACING.card_sm
        )}
      >
        <div className="flex items-center gap-2">
          <Star className="size-5 fill-yellow-400 text-yellow-400" />
          <span className={TYPE.kpi_number}>
            {avgRating > 0 ? avgRating.toFixed(1) : "\u2014"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {reviews.length} {t.reviews.totalReviews}
        </p>
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div
          className={cn(
            "flex flex-col items-center justify-center py-16 text-center border border-border/40 bg-card",
            RADIUS.card
          )}
        >
          <Star className="size-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">
            {t.reviews.noReviews}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
