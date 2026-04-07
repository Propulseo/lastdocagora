/**
 * Resolve the localised display name for a service.
 *
 * Falls back: name_{locale} → name_pt → name → ""
 */
export function getServiceName(
  service:
    | {
        name?: string | null
        name_pt?: string | null
        name_fr?: string | null
        name_en?: string | null
      }
    | null
    | undefined,
  locale: string,
): string {
  if (!service) return ""
  const key = `name_${locale}` as keyof typeof service
  const localized = service[key]
  if (typeof localized === "string" && localized) return localized
  if (service.name_pt) return service.name_pt
  return service.name ?? ""
}
