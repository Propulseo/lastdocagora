/**
 * Known French service names → PT/EN translations.
 * Used when name_pt/name_en DB columns are empty and only the French `name`
 * column has a value.
 */
const FRENCH_SERVICE_FALLBACK: Record<string, { pt: string; en: string }> = {
  "Bilan complet": { pt: "Avaliação completa", en: "Complete Check-up" },
  "Consultation de suivi": { pt: "Consulta de acompanhamento", en: "Follow-up Consultation" },
  "Consultation generale": { pt: "Consulta geral", en: "General Consultation" },
  "Consultation générale": { pt: "Consulta geral", en: "General Consultation" },
}

/**
 * Resolve the localised display name for a service.
 *
 * Falls back: name_{locale} → name_pt → French→locale dictionary → name → ""
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

  // Before returning raw French name, try the fallback dictionary
  const raw = service.name
  if (raw && locale !== "fr") {
    const fb = FRENCH_SERVICE_FALLBACK[raw]
    if (fb) return (fb as Record<string, string>)[locale] ?? fb.pt
  }

  return raw ?? ""
}

/**
 * Resolve the localised description for a service.
 *
 * Falls back: description_{locale} → description_pt → description → ""
 */
export function getServiceDescription(
  service:
    | {
        description?: string | null
        description_pt?: string | null
        description_fr?: string | null
        description_en?: string | null
      }
    | null
    | undefined,
  locale: string,
): string {
  if (!service) return ""
  const key = `description_${locale}` as keyof typeof service
  const localized = service[key]
  if (typeof localized === "string" && localized) return localized
  if (service.description_pt) return service.description_pt
  return service.description ?? ""
}
