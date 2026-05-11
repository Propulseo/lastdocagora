export const RELATED_SPECIALTIES: Record<string, string[]> = {
  cardiology: ["general_practitioner", "vascular_surgery"],
  dermatology: ["general_practitioner", "plastic_surgery"],
  general_practitioner: ["internal_medicine", "family_medicine"],
  dentist: ["orthodontics", "oral_surgery"],
  psychologist: ["psychiatry", "general_practitioner"],
  psychiatry: ["psychologist", "neurology"],
  ophthalmology: ["optometry", "general_practitioner"],
  orthopedics: ["physiotherapy", "sports_medicine"],
  physiotherapy: ["orthopedics", "sports_medicine"],
  gynecology: ["obstetrics", "general_practitioner"],
  pediatrics: ["general_practitioner", "family_medicine"],
  neurology: ["psychiatry", "neurosurgery"],
  urology: ["nephrology", "general_practitioner"],
  otolaryngology: ["general_practitioner", "allergology"],
  endocrinology: ["general_practitioner", "nutrition"],
  gastroenterology: ["general_practitioner", "nutrition"],
  pulmonology: ["general_practitioner", "allergology"],
  rheumatology: ["orthopedics", "physiotherapy"],
}

export function getRelatedSpecialties(specialty: string): string[] {
  const key = specialty.toLowerCase().replace(/\s+/g, "_")
  return RELATED_SPECIALTIES[key] ?? []
}
