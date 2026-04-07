import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export async function sendNotificationEmail(params: {
  to: string
  subject: string
  html: string
}) {
  if (!resend) return
  try {
    await resend.emails.send({
      from: "DocAgora <noreply@docagora.com>",
      ...params,
    })
  } catch (error) {
    console.error("[email] Failed to send:", error)
  }
}
