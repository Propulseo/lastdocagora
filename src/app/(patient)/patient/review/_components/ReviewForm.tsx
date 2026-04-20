"use client"

import { useCallback, useEffect, useState } from "react"
import { CheckCircle2, AlertCircle, Loader2, Info } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { RADIUS, SHADOW } from "@/lib/design-tokens"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { usePatientTranslations } from "@/locales/locale-context"
import { validateReviewToken } from "../_actions/validate-token"
import { StarRating } from "./StarRating"

const COMMENT_MAX = 1000
type FormStatus = "loading" | "invalid" | "expired" | "already_submitted" | "ready" | "submitting" | "success"

export function ReviewForm({ token }: { token: string | null }) {
  const { t } = usePatientTranslations()
  const [status, setStatus] = useState<FormStatus>("loading")
  const [rating, setRating] = useState(0)
  const [ratingPunctuality, setRatingPunctuality] = useState(0)
  const [ratingListening, setRatingListening] = useState(0)
  const [ratingClarity, setRatingClarity] = useState(0)
  const [comment, setComment] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus("invalid")
      return
    }
    validateReviewToken(token).then((result) => {
      setStatus(result.status)
    })
  }, [token])

  const handleSubmit = useCallback(async () => {
    if (!token || rating < 1) return
    setStatus("submitting")

    try {
      const res = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          rating,
          rating_punctuality: ratingPunctuality || undefined,
          rating_listening: ratingListening || undefined,
          rating_clarity: ratingClarity || undefined,
          comment: comment.trim() || undefined,
          is_anonymous: isAnonymous,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (res.status === 409) {
          setStatus("already_submitted")
          return
        }
        if (res.status === 410) {
          setStatus("expired")
          return
        }
        throw new Error(body.error || t.review.errorSubmitTitle)
      }

      setStatus("success")
    } catch (err) {
      setStatus("ready")
      toast.error(
        err instanceof Error
          ? err.message
          : t.review.errorSubmitMessage
      )
    }
  }, [
    token, rating, ratingPunctuality, ratingListening,
    ratingClarity, comment, isAnonymous, t,
  ])

  if (status === "loading") return (
    <CenteredCard>
      <div className="flex flex-col items-center gap-4 py-8">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t.review.loading}</p>
      </div>
    </CenteredCard>
  )

  if (status === "invalid") return (
    <CenteredCard>
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <AlertCircle className="size-10 text-destructive" />
        <p className="font-semibold">{t.review.invalidLink}</p>
        <p className="text-sm text-muted-foreground">
          {t.review.invalidLinkDescription}
        </p>
      </div>
    </CenteredCard>
  )

  if (status === "expired") return (
    <CenteredCard>
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <AlertCircle className="size-10 text-amber-500" />
        <p className="font-semibold">{t.review.tokenExpired}</p>
        <p className="text-sm text-muted-foreground">
          {t.review.tokenExpiredDescription}
        </p>
      </div>
    </CenteredCard>
  )

  if (status === "already_submitted") return (
    <CenteredCard>
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle2 className="size-10 text-primary" />
        <p className="font-semibold">{t.review.alreadySubmitted}</p>
        <p className="text-sm text-muted-foreground">
          {t.review.alreadySubmittedDescription}
        </p>
      </div>
    </CenteredCard>
  )

  if (status === "success") return (
    <CenteredCard>
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle2 className="size-10 text-emerald-500" />
        <p className="text-lg font-semibold">{t.review.successTitle}</p>
        <p className="text-sm text-muted-foreground">
          {t.review.successDescription}
        </p>
      </div>
    </CenteredCard>
  )

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6">
      <Card className={cn(RADIUS.card, SHADOW.card)}>
        <CardHeader>
          <CardTitle className="text-xl">{t.review.title}</CardTitle>
          <CardDescription>
            {t.review.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              {t.review.overallRating}
            </Label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StarRating
              value={ratingPunctuality}
              onChange={setRatingPunctuality}
              size="sm"
              label={t.review.punctuality}
            />
            <StarRating
              value={ratingListening}
              onChange={setRatingListening}
              size="sm"
              label={t.review.listening}
            />
            <StarRating
              value={ratingClarity}
              onChange={setRatingClarity}
              size="sm"
              label={t.review.clarity}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-comment">{t.review.commentLabel}</Label>
            <Textarea
              id="review-comment"
              placeholder={t.review.commentPlaceholder}
              value={comment}
              onChange={(e) => {
                if (e.target.value.length <= COMMENT_MAX)
                  setComment(e.target.value)
              }}
              rows={4}
              className="resize-none"
            />
            <p className="text-right text-xs text-muted-foreground">
              {comment.length}/{COMMENT_MAX}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
            <Label htmlFor="anonymous" className="cursor-pointer select-none">
              {t.review.publishAnonymously}
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center"
                  >
                    <Info className="size-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px] text-center">
                  {t.review.anonymousTooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <Button
            className="w-full min-h-[48px]"
            disabled={rating < 1 || status === "submitting"}
            onClick={handleSubmit}
          >
            {status === "submitting" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t.review.submitting}
              </>
            ) : (
              t.review.submitButton
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6">
      <Card className={cn(RADIUS.card, SHADOW.card)}>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  )
}
