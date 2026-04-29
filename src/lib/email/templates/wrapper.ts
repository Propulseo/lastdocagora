export type EmailTemplate = { subject: string; html: string }
export type Lang = "pt" | "fr" | "en"

/* --- Wrapper i18n --- */

export const wrapperI18n = {
  pt: { footer: "DocAgora — Plataforma de Saúde" },
  fr: { footer: "DocAgora — Plateforme de Santé" },
  en: { footer: "DocAgora — Healthcare Platform" },
} as const

export const wrapper = (content: string, lang: Lang = "pt") => {
  const t = wrapperI18n[lang] || wrapperI18n.pt
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#0d9488;padding:24px 32px">
<img src="${process.env.NEXT_PUBLIC_APP_URL || ""}/logo.png" alt="DocAgora" height="32" style="height:32px;width:auto;display:block" />
</td></tr>
<tr><td style="padding:32px">
${content}
</td></tr>
<tr><td style="padding:16px 32px 24px;color:#71717a;font-size:12px;text-align:center;border-top:1px solid #e4e4e7">
${t.footer}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
`
}
