"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Trash2, Undo2, MessageSquare } from "lucide-react";

export interface ReviewRow {
  id: string;
  rating: number;
  comment: string | null;
  status: string;
  created_at: string | null;
  would_recommend: boolean | null;
  patient_name: string;
  professional_name: string;
}

const LOCALE_MAP: Record<string, string> = { pt: "pt-PT", fr: "fr-FR", en: "en-GB" };

function RatingCell({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold tabular-nums">{rating.toFixed(1)}</span>
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden hidden sm:block">
        <div
          className="h-full rounded-full bg-foreground/30"
          style={{ width: `${(rating / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}

function ReviewItem({
  review,
  rt,
  locale,
  onModerate,
  onDelete,
  onRetract,
  moderatingId,
  isPending,
  showActions,
  showRetract,
}: {
  review: ReviewRow;
  rt: Record<string, string | Record<string, string>>;
  locale?: string;
  onModerate?: (id: string, status: "approved" | "rejected") => void;
  onDelete?: (id: string) => void;
  onRetract?: (id: string) => void;
  moderatingId?: string | null;
  isPending?: boolean;
  showActions?: boolean;
  showRetract?: boolean;
}) {
  const isLoading = isPending && moderatingId === review.id;
  const dateStr = review.created_at
    ? new Intl.DateTimeFormat(LOCALE_MAP[locale ?? "pt"] ?? "pt-PT", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(review.created_at))
    : "";

  return (
    <div className="group border-b border-border last:border-b-0 transition-colors hover:bg-muted/30">
      {/* Desktop row */}
      <div className="hidden sm:grid sm:grid-cols-[60px_1fr_1fr_2fr_100px_auto] items-center gap-4 px-4 py-3">
        <RatingCell rating={review.rating} />

        <div className="min-w-0">
          <p className="text-sm truncate">{review.professional_name}</p>
          <p className="text-[11px] text-muted-foreground/60">{rt.professional as string}</p>
        </div>

        <div className="min-w-0">
          <p className="text-sm truncate text-muted-foreground">{review.patient_name}</p>
          <p className="text-[11px] text-muted-foreground/60">{rt.patient as string}</p>
        </div>

        <div className="min-w-0 flex items-center gap-2">
          {review.comment ? (
            <p className="text-sm text-muted-foreground truncate">{review.comment}</p>
          ) : (
            <span className="flex items-center gap-1 text-xs text-muted-foreground/40 italic">
              <MessageSquare className="size-3" />
              {rt.noComment as string}
            </span>
          )}
        </div>

        <p className="text-xs tabular-nums text-muted-foreground">{dateStr}</p>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {showActions && onModerate && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
                onClick={() => onModerate(review.id, "approved")}
                title={rt.approve as string}
              >
                <CheckCircle2 className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 text-muted-foreground hover:text-foreground"
                disabled={isLoading}
                onClick={() => onModerate(review.id, "rejected")}
                title={rt.reject as string}
              >
                <XCircle className="size-4" />
              </Button>
            </>
          )}
          {showRetract && onRetract && (
            <Button
              size="icon"
              variant="ghost"
              className="size-8 text-muted-foreground hover:text-foreground"
              disabled={isLoading}
              onClick={() => onRetract(review.id)}
              title={rt.retract as string}
            >
              <Undo2 className="size-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="size-8 text-muted-foreground hover:text-destructive"
              disabled={isLoading}
              onClick={() => onDelete(review.id)}
              title={rt.deleteReview as string}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Mobile row */}
      <div className="sm:hidden px-4 py-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-md bg-muted text-sm font-semibold tabular-nums">
              {review.rating.toFixed(1)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{review.professional_name}</p>
              <p className="text-xs text-muted-foreground truncate">{review.patient_name}</p>
            </div>
          </div>
          <p className="text-[11px] tabular-nums text-muted-foreground shrink-0">{dateStr}</p>
        </div>

        {review.comment && (
          <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>
        )}

        <div className="flex items-center gap-1.5 pt-0.5">
          {showActions && onModerate && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-9 min-h-[44px] flex-1"
                disabled={isLoading}
                onClick={() => onModerate(review.id, "approved")}
              >
                <CheckCircle2 className="size-3.5 mr-1" />
                {rt.approve as string}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 min-h-[44px] flex-1"
                disabled={isLoading}
                onClick={() => onModerate(review.id, "rejected")}
              >
                <XCircle className="size-3.5 mr-1" />
                {rt.reject as string}
              </Button>
            </>
          )}
          {showRetract && onRetract && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 min-h-[44px] flex-1"
              disabled={isLoading}
              onClick={() => onRetract(review.id)}
            >
              <Undo2 className="size-3.5 mr-1" />
              {rt.retract as string}
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon"
              variant="ghost"
              className="size-9 min-h-[44px] text-muted-foreground hover:text-destructive shrink-0"
              disabled={isLoading}
              onClick={() => onDelete(review.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface ReviewListProps {
  items: ReviewRow[];
  emptyMessage: string;
  rt: Record<string, string | Record<string, string>>;
  locale?: string;
  onModerate?: (id: string, status: "approved" | "rejected") => void;
  onDelete?: (id: string) => void;
  onRetract?: (id: string) => void;
  moderatingId?: string | null;
  isPending?: boolean;
  showActions?: boolean;
  showRetract?: boolean;
}

export function ReviewList({
  items,
  emptyMessage,
  rt,
  locale,
  onModerate,
  onDelete,
  onRetract,
  moderatingId,
  isPending,
  showActions,
  showRetract,
}: ReviewListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <MessageSquare className="size-8 mb-2 opacity-20" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div>
      {/* Desktop column headers */}
      <div className="hidden sm:grid sm:grid-cols-[60px_1fr_1fr_2fr_100px_auto] items-center gap-4 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50 border-b border-border">
        <span>{rt.rating as string}</span>
        <span>{rt.professional as string}</span>
        <span>{rt.patient as string}</span>
        <span>{rt.comment as string}</span>
        <span>{rt.date as string}</span>
        <span className="w-[104px]" />
      </div>
      {items.map((review) => (
        <ReviewItem
          key={review.id}
          review={review}
          rt={rt}
          locale={locale}
          onModerate={onModerate}
          onDelete={onDelete}
          onRetract={onRetract}
          moderatingId={moderatingId}
          isPending={isPending}
          showActions={showActions}
          showRetract={showRetract}
        />
      ))}
    </div>
  );
}
