"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { usePatientTranslations } from "@/locales/locale-context"

interface RatingStats {
  average_rating: number
  total_reviews: number
  avg_punctuality: number
  avg_listening: number
  avg_clarity: number
}

interface ReviewRow {
  id: string
  rating: number
  rating_punctuality: number | null
  rating_listening: number | null
  rating_clarity: number | null
  comment: string | null
  is_anonymous: boolean
  created_at: string
  patients: { users: { first_name: string; last_name: string } } | null
}

const PAGE_SIZE = 10

function StarRating({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = Math.min(1, Math.max(0, value - i))
        const id = `star-${size}-${i}-${value.toFixed(1)}`
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="none">
            <defs>
              <linearGradient id={id}>
                <stop offset={`${fill * 100}%`} stopColor="#facc15" />
                <stop offset={`${fill * 100}%`} stopColor="transparent" />
              </linearGradient>
            </defs>
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill={`url(#${id})`}
              stroke="#facc15"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        )
      })}
    </div>
  )
}

function CriteriaBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 5) * 100
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-yellow-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-sm font-medium">{value.toFixed(1)}</span>
    </div>
  )
}

export function ProfessionalReviews({ professionalId }: { professionalId: string }) {
  const { t, dateLocale } = usePatientTranslations()
  const [stats, setStats] = useState<RatingStats | null>(null)
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(0)

  const supabase = createClient()

  const fetchReviews = useCallback(async (pageNum: number) => {
    const from = pageNum * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    const { data } = await (supabase.from as unknown as (table: string) => ReturnType<typeof supabase.from>)("reviews")
      .select(
        "id, rating, rating_punctuality, rating_listening, rating_clarity, comment, is_anonymous, created_at, patients(users!patients_user_id_fkey(first_name, last_name))"
      )
      .eq("professional_id", professionalId)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .range(from, to) as unknown as { data: ReviewRow[] | null }
    return data ?? []
  }, [professionalId, supabase])

  useEffect(() => {
    async function init() {
      setLoading(true)
      const [statsResult, reviewsData] = await Promise.all([
        (supabase.rpc as unknown as (fn: string, params: Record<string, string>) => Promise<{ data: RatingStats | null }>)(
          "get_professional_rating_stats",
          { professional_uuid: professionalId }
        ),
        fetchReviews(0),
      ])
      setStats(statsResult.data)
      setReviews(reviewsData)
      setHasMore(reviewsData.length === PAGE_SIZE)
      setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [professionalId])

  const loadMore = async () => {
    setLoadingMore(true)
    const nextPage = page + 1
    const data = await fetchReviews(nextPage)
    setReviews((prev) => [...prev, ...data])
    setPage(nextPage)
    setHasMore(data.length === PAGE_SIZE)
    setLoadingMore(false)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (!stats || stats.total_reviews < 3) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="size-5" />
            {t.professionalReviews.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t.professionalReviews.notEnoughReviews}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="size-5" />
          {t.professionalReviews.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold">{stats.average_rating.toFixed(1)}</span>
            <div className="space-y-1">
              <StarRating value={stats.average_rating} size={20} />
              <p className="text-sm text-muted-foreground">
                {stats.total_reviews} {stats.total_reviews !== 1 ? t.professionalReviews.reviewPlural : t.professionalReviews.reviewSingular}
              </p>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {stats.avg_punctuality > 0 && <CriteriaBar label={t.professionalReviews.punctuality} value={stats.avg_punctuality} />}
            {stats.avg_listening > 0 && <CriteriaBar label={t.professionalReviews.listening} value={stats.avg_listening} />}
            {stats.avg_clarity > 0 && <CriteriaBar label={t.professionalReviews.clarity} value={stats.avg_clarity} />}
          </div>
        </div>

        <Separator />

        {/* Review list */}
        <div className="space-y-4">
          {reviews.map((review) => {
            const isAnon = review.is_anonymous
            const user = review.patients?.users
            const initials = isAnon || !user
              ? "PA"
              : `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase()
            const displayName = isAnon || !user
              ? t.professionalReviews.anonymousPatient
              : `${user.first_name} ${user.last_name?.[0]}.`

            return (
              <div key={review.id} className="space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar size="sm">
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{displayName}</span>
                      <StarRating value={review.rating} size={14} />
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(review.created_at), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="mt-1.5 text-sm text-muted-foreground">{review.comment}</p>
                    )}
                  </div>
                </div>
                <Separator />
              </div>
            )
          })}
        </div>

        {hasMore && (
          <Button variant="outline" className="w-full" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {t.professionalReviews.loadMore}
          </Button>
        )}
      </CardContent>
    </Card>)
}
