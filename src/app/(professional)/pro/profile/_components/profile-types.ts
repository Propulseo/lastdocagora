export interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  language: string | null;
}

export interface InsuranceProviderData {
  id: string;
  name: string;
}

export interface Professional {
  id: string;
  specialty: string | null;
  registration_number: string | null;
  practice_type: string | null;
  cabinet_name: string | null;
  years_experience: number | null;
  subspecialties: string[] | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  languages_spoken: string[] | null;
  bio: string | null;
  bio_pt: string | null;
  bio_fr: string | null;
  bio_en: string | null;
  rating: number | null;
  total_reviews: number | null;
  verification_status: string | null;
}

export interface Rating {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  appointment_date: string;
  service_name: string | null;
  patient_identifier: string | null;
}

export interface ProfileClientProps {
  userId: string;
  userProfile: UserProfile;
  professional: Professional;
  recentRatings: Rating[];
  insuranceProviders: InsuranceProviderData[];
  professionalInsuranceIds: string[];
}

export type SectionKey = "personal" | "professional" | "location" | "languages" | "insurances";
