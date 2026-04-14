"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHADOW, RADIUS, SPACING } from "@/lib/design-tokens";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import type { ReviewItem } from "./ReviewsClient";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "size-4",
            i <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

export function ReviewCard({ review }: { review: ReviewItem }) {
  const { t } = useProfessionalI18n();

  const dateLocale = t.common.dateLocale ?? "pt-PT";

  const formattedDate = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString(dateLocale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <div
      className={cn(
        "border border-border/40 bg-card",
        RADIUS.card,
        SHADOW.card,
        SPACING.card
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold uppercase text-primary">
            {review.patientInitials}
          </div>
          <div>
            <StarRating rating={review.rating} />
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formattedDate}
            </p>
          </div>
        </div>
      </div>

      {review.comment && (
        <p className="mt-3 text-sm leading-relaxed text-foreground">
          {review.comment}
        </p>
      )}
    </div>
  );
}
