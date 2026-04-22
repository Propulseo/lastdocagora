"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { deleteReview, updateReviewStatus } from "@/app/(admin)/_actions/admin-crud-actions";
import { ReviewList, type ReviewRow } from "./review-columns";

export function ReviewsClient({ reviews, pendingCount }: { reviews: ReviewRow[]; pendingCount: number }) {
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
        toast.error(result.error ?? t.common.errorUpdating);
      }
      setDeleteTarget(null);
    });
  }

  const pendingBadge = pendingCount > 0 ? (
    <Badge variant="destructive" className="ml-2 text-xs">
      {rt.pendingCount.replace("{count}", String(pendingCount))}
    </Badge>
  ) : null;

  return (
    <div className="space-y-6">
      <PageHeader title={rt.title} description={rt.description} action={pendingBadge} />
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            {rt.tabs.pending}
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1.5 size-5 p-0 text-[10px] justify-center">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">{rt.tabs.approved}</TabsTrigger>
          <TabsTrigger value="rejected">{rt.tabs.rejected}</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">
          <ReviewList items={pending} emptyMessage={rt.emptyPending} rt={rt} locale={locale} onModerate={handleModerate} onDelete={setDeleteTarget} moderatingId={moderatingId} isPending={isPending} showActions />
        </TabsContent>
        <TabsContent value="approved" className="mt-4">
          <ReviewList items={approved} emptyMessage={rt.emptyApproved} rt={rt} locale={locale} onDelete={setDeleteTarget} onRetract={handleRetract} moderatingId={moderatingId} isPending={isPending} showRetract />
        </TabsContent>
        <TabsContent value="rejected" className="mt-4">
          <ReviewList items={rejected} emptyMessage={rt.emptyRejected} rt={rt} locale={locale} onDelete={setDeleteTarget} moderatingId={moderatingId} isPending={isPending} />
        </TabsContent>
      </Tabs>

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
