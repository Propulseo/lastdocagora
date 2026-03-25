"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/shared/responsive-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Star } from "lucide-react"
import { usePatientTranslations } from "@/locales/locale-context"

export function RatingDialog({
  appointmentId,
  professionalId,
  professionalUserId,
  professionalName,
}: {
  appointmentId: string
  professionalId: string
  professionalUserId: string
  professionalName: string
}) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { t } = usePatientTranslations()

  async function handleSubmit() {
    if (rating < 1 || rating > 5) return

    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.from("appointment_ratings").upsert(
      {
        appointment_id: appointmentId,
        professional_id: professionalId,
        professional_user_id: professionalUserId,
        rating,
        comment: comment.trim() || null,
      },
      { onConflict: "appointment_id" }
    )

    if (error) {
      toast.error(t.ratingDialog.errorSubmit)
      setLoading(false)
      return
    }

    toast.success(t.ratingDialog.successSubmit)
    setOpen(false)
    setRating(0)
    setHoveredStar(0)
    setComment("")
    setLoading(false)
    router.refresh()
  }

  const displayRating = hoveredStar || rating

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen}>
      <ResponsiveDialogTrigger asChild>
        <Button variant="outline" size="sm" className="min-h-[44px]">
          <Star className="size-4" />
          {t.appointments.rate}
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t.ratingDialog.title}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {t.ratingDialog.description.replace("{name}", professionalName)}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="space-y-4 px-4 lg:px-0">
          <div className="space-y-2">
            <Label>{t.ratingDialog.ratingLabel}</Label>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => {
                const starValue = i + 1
                return (
                  <button
                    key={starValue}
                    type="button"
                    className="min-h-[44px] min-w-[44px] rounded p-0.5 transition-colors hover:bg-muted flex items-center justify-center"
                    onMouseEnter={() => setHoveredStar(starValue)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => setRating(starValue)}
                    disabled={loading}
                  >
                    <Star
                      className={`size-7 transition-colors ${
                        starValue <= displayRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                )
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rating-comment">{t.ratingDialog.commentLabel}</Label>
            <Textarea
              id="rating-comment"
              placeholder={t.ratingDialog.commentPlaceholder}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={1000}
              disabled={loading}
            />
          </div>
        </div>
        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            className="min-h-[48px] w-full sm:w-auto"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            {t.ratingDialog.cancel}
          </Button>
          <Button
            className="min-h-[48px] w-full sm:w-auto"
            onClick={handleSubmit}
            disabled={loading || rating < 1}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? t.ratingDialog.submitting : t.ratingDialog.submit}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
