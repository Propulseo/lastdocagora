import { redirect } from "next/navigation"

export default async function RegisterRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const params = await searchParams
  const qs = new URLSearchParams()
  if (params.redirect) qs.set("redirect", params.redirect)
  if (params.role) qs.set("role", params.role)
  const query = qs.toString()
  redirect(`/login${query ? `?${query}` : ""}#register`)
}
