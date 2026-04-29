"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { resolveErrorMessage } from "@/lib/error-messages";
import { deleteReview, updateReviewStatus } from "@/app/(admin)/_actions/admin-crud-actions";
import { ReviewList, type ReviewRow } from "./review-columns";
import { ReviewsHeader } from "./reviews-header";

interface ReviewsClientProps {
  reviews: ReviewRow[];
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  avgRating: number;
  recommendPct: number;
  ratingDistribution: number[];
}

export function ReviewsClient({
  reviews,
  pendingCount,
  approvedCount,
  rejectedCount,
  avgRating,
  recommendPct,
  ratingDistribution,
}: ReviewsClientProps) {
  const { t, locale } = useAdminI18n();
  const rt = t.reviews;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const pending = reviews.filter((r) => r.status === "pending");
  const approved = reviews.filter((r) => r.status === "approved");
  const rejected = reviews.filter((r) => r.status === "rejected");

  function handleModerate(id: string, status: "approved" | "rejected") {
    setModeratingId(id);
    startTransition(async () => {
      const result = await updateReviewStatus(id, status);
      if (result.success) {
        toast.success(status === "approved" ? rt.approveSuccess : rt.rejectSuccess);
        router.refresh();
      } else {
        toast.error(rt.moderateError);
      }
      setModeratingId(null);
    });
  }

  function handleRetract(id: string) {
    setModeratingId(id);
    startTransition(async () => {
      const result = await updateReviewStatus(id, "rejected");
      if (result.success) {
        toast.success(rt.retracted);
        router.refresh();
      } else {
        toast.error(rt.moderateError);
      }
      setModeratingId(null);
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteReview(deleteTarget);
      if (result.success) {
        toast.success(rt.reviewDeleted);
        router.refresh();
      } else {
        toast.error(resolveErrorMessage(result.error, t.common.errorUpdating));
      }
      setDeleteTarget(null);
    });
  }

  const total = pendingCount + approvedCount + rejectedCount;

  return (
    <div className="space-y-5">
      <ReviewsHeader
        total={total}
        pending={pendingCount}
        approved={approvedCount}
        rejected={rejectedCount}
        avgRating={avgRating}
        recommendPct={recommendPct}
        ratingDistribution={ratingDistribution}
      />

      <div
        style={{ animation: "admin-fade-up 0.4s ease-out both", animationDelay: "100ms" }}
      >
        <Tabs defaultValue={pendingCount > 0 ? "pending" : "approved"}>
          <TabsList>
            <TabsTrigger value="pending" className="relative">
              {rt.tabs.pending}
              {pendingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center size-5 rounded-full bg-foreground text-background text-[10px] font-semibold tabular-nums">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">
              {rt.tabs.approved}
              <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">{approvedCount}</span>
            </TabsTrigger>
            <TabsTrigger value="rejected">
              {rt.tabs.rejected}
              <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">{rejectedCount}</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
            <TabsContent value="pending" className="mt-0">
              <ReviewList
                items={pending}
                emptyMessage={rt.emptyPending}
                rt={rt}
                locale={locale}
                onModerate={handleModerate}
                onDelete={setDeleteTarget}
                moderatingId={moderatingId}
                isPending={isPending}
                showActions
              />
            </TabsContent>
            <TabsContent value="approved" className="mt-0">
              <ReviewList
                items={approved}
                emptyMessage={rt.emptyApproved}
                rt={rt}
                locale={locale}
                onDelete={setDeleteTarget}
                onRetract={handleRetract}
                moderatingId={moderatingId}
                isPending={isPending}
                showRetract
              />
            </TabsContent>
            <TabsContent value="rejected" className="mt-0">
              <ReviewList
                items={rejected}
                emptyMessage={rt.emptyRejected}
                rt={rt}
                locale={locale}
                onDelete={setDeleteTarget}
                moderatingId={moderatingId}
                isPending={isPending}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={rt.deleteConfirmTitle}
        description={rt.deleteConfirmDesc}
        confirmLabel={rt.deleteReview}
        cancelLabel={t.common.cancel}
        loadingLabel={t.common.processing}
        variant="destructive"
        loading={isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
