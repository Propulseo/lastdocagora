import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, CheckCircle2, XCircle, ThumbsUp, ThumbsDown, Trash2, Undo2 } from "lucide-react";

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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`size-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

const STATUS_VARIANTS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

function ReviewCard({
  review, rt, onModerate, onDelete, onRetract, moderatingId, isPending, showActions, showRetract,
}: {
  review: ReviewRow;
  rt: Record<string, string | Record<string, string>>;
  onModerate?: (id: string, status: "approved" | "rejected") => void;
  onDelete?: (id: string) => void;
  onRetract?: (id: string) => void;
  moderatingId?: string | null;
  isPending?: boolean;
  showActions?: boolean;
  showRetract?: boolean;
}) {
  const statusLabel = review.status === "approved" ? rt.approved : review.status === "rejected" ? rt.rejected : rt.pending;
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <StarRating rating={review.rating} />
              <Badge className={`text-xs font-medium ${STATUS_VARIANTS[review.status] ?? STATUS_VARIANTS.pending}`}>
                {statusLabel as string}
              </Badge>
              {review.would_recommend !== null && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {review.would_recommend
                    ? <><ThumbsUp className="size-3" /> {rt.wouldRecommend as string}</>
                    : <><ThumbsDown className="size-3" /> {rt.wouldNotRecommend as string}</>}
                </span>
              )}
            </div>
            <p className="text-sm text-foreground">
              {review.comment || <span className="italic text-muted-foreground">{rt.noComment as string}</span>}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span><span className="font-medium">{rt.patient as string}:</span> {review.patient_name}</span>
              <span><span className="font-medium">{rt.professional as string}:</span> {review.professional_name}</span>
              {review.created_at && (
                <span>{new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "short", year: "numeric" }).format(new Date(review.created_at))}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {showActions && onModerate && (
              <>
                <Button
                  size="sm" variant="outline"
                  className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 min-h-[44px]"
                  disabled={isPending && moderatingId === review.id}
                  onClick={() => onModerate(review.id, "approved")}
                >
                  <CheckCircle2 className="size-4 mr-1.5" />{rt.approve as string}
                </Button>
                <Button
                  size="sm" variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 min-h-[44px]"
                  disabled={isPending && moderatingId === review.id}
                  onClick={() => onModerate(review.id, "rejected")}
                >
                  <XCircle className="size-4 mr-1.5" />{rt.reject as string}
                </Button>
              </>
            )}
            {showRetract && onRetract && (
              <Button
                size="sm" variant="outline"
                className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 min-h-[44px]"
                disabled={isPending && moderatingId === review.id}
                onClick={() => onRetract(review.id)}
              >
                <Undo2 className="size-4 mr-1.5" />{rt.retract as string}
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm" variant="ghost"
                className="text-destructive min-h-[44px]"
                disabled={isPending && moderatingId === review.id}
                onClick={() => onDelete(review.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ReviewListProps {
  items: ReviewRow[];
  emptyMessage: string;
  rt: Record<string, string | Record<string, string>>;
  onModerate?: (id: string, status: "approved" | "rejected") => void;
  onDelete?: (id: string) => void;
  onRetract?: (id: string) => void;
  moderatingId?: string | null;
  isPending?: boolean;
  showActions?: boolean;
  showRetract?: boolean;
}

export function ReviewList({ items, emptyMessage, rt, onModerate, onDelete, onRetract, moderatingId, isPending, showActions, showRetract }: ReviewListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Star className="size-10 mb-3 opacity-30" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div className="grid gap-3">
      {items.map((review) => (
        <ReviewCard key={review.id} review={review} rt={rt} onModerate={onModerate} onDelete={onDelete} onRetract={onRetract} moderatingId={moderatingId} isPending={isPending} showActions={showActions} showRetract={showRetract} />
      ))}
    </div>
  );
}
