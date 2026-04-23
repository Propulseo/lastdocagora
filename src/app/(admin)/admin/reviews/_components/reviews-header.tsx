"use client";

import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";

interface ReviewsHeaderProps {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  avgRating: number;
  recommendPct: number;
  ratingDistribution: number[];
}

export function ReviewsHeader({
  total,
  pending,
  approved,
  rejected,
  avgRating,
  recommendPct,
  ratingDistribution,
}: ReviewsHeaderProps) {
  const { t } = useAdminI18n();
  const rt = t.reviews;

  const maxBucket = Math.max(...ratingDistribution, 1);

  return (
    <div style={{ animation: "admin-fade-up 0.4s ease-out both" }}>
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">
          {rt.title}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {rt.description}
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {/* Desktop — horizontal */}
        <div className="hidden sm:flex">
          {/* Rating highlight */}
          <div className="flex flex-col justify-center border-r border-border px-6 py-4 min-w-[180px]">
            <div className="flex items-baseline gap-1.5">
              <p className="text-3xl font-semibold tabular-nums tracking-tight">
                {avgRating.toFixed(1)}
              </p>
              <span className="text-sm text-muted-foreground">/5</span>
            </div>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {rt.headerAvgRating}
            </p>
            {/* Mini distribution bars */}
            <div className="mt-2.5 flex flex-col gap-[3px]">
              {[5, 4, 3, 2, 1].map((star, idx) => (
                <div key={star} className="flex items-center gap-1.5">
                  <span className="text-[10px] tabular-nums text-muted-foreground/60 w-2.5 text-right">
                    {star}
                  </span>
                  <div className="flex-1 h-[5px] rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground/25 transition-all duration-500"
                      style={{
                        width: `${(ratingDistribution[4 - idx] / maxBucket) * 100}%`,
                        animationDelay: `${200 + idx * 60}ms`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground/40 w-4">
                    {ratingDistribution[4 - idx]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Numeric metrics */}
          {[
            { label: "Total", value: total, primary: true },
            { label: rt.pending as string, value: pending },
            { label: rt.approved as string, value: approved },
            { label: rt.rejected as string, value: rejected },
            { label: rt.headerRecommend, value: `${recommendPct}%`, isString: true },
          ].map((m, i) => (
            <div
              key={i}
              className={`flex flex-1 flex-col justify-center px-5 py-4 ${
                i > 0 ? "border-l border-border" : ""
              }`}
            >
              <p
                className={`tabular-nums tracking-tight font-semibold ${
                  m.primary ? "text-2xl" : "text-xl"
                }`}
              >
                {m.value}
              </p>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                {m.label}
              </p>
            </div>
          ))}
        </div>

        {/* Mobile */}
        <div className="sm:hidden">
          {/* Rating row */}
          <div className="flex items-center gap-4 px-4 py-3.5 border-b border-border">
            <div>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-semibold tabular-nums tracking-tight">
                  {avgRating.toFixed(1)}
                </p>
                <span className="text-xs text-muted-foreground">/5</span>
              </div>
              <p className="text-[11px] font-medium text-muted-foreground">
                {rt.headerAvgRating}
              </p>
            </div>
            <div className="flex-1 flex flex-col gap-[3px]">
              {[5, 4, 3, 2, 1].map((star, idx) => (
                <div key={star} className="flex items-center gap-1">
                  <span className="text-[9px] tabular-nums text-muted-foreground/50 w-2 text-right">
                    {star}
                  </span>
                  <div className="flex-1 h-[4px] rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground/25"
                      style={{
                        width: `${(ratingDistribution[4 - idx] / maxBucket) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold tabular-nums">{recommendPct}%</p>
              <p className="text-[10px] text-muted-foreground">{rt.headerRecommend}</p>
            </div>
          </div>

          {/* Metrics 2x2 */}
          <div className="grid grid-cols-4">
            {[
              { label: "Total", value: total },
              { label: rt.pending as string, value: pending },
              { label: rt.approved as string, value: approved },
              { label: rt.rejected as string, value: rejected },
            ].map((m, i) => (
              <div
                key={i}
                className={`flex flex-col justify-center px-3 py-3 ${
                  i > 0 ? "border-l border-border" : ""
                }`}
              >
                <p className="text-lg font-semibold tabular-nums tracking-tight">
                  {m.value}
                </p>
                <p className="text-[10px] font-medium text-muted-foreground">
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
