import type { CommonSection } from "./common"
import type { SearchSection } from "./search"
import type { BookingSection } from "./booking"
import type { AppointmentsSection } from "./appointments"
import type { ProfileSection } from "./profile"
import type { MessagesSection } from "./messages"
import type { AuthSection } from "./auth"
import type { MiscSection } from "./misc"

import { commonPt } from "./common"
import { searchPt } from "./search"
import { bookingPt } from "./booking"
import { appointmentsPt } from "./appointments"
import { profilePt } from "./profile"
import { messagesPt } from "./messages"
import { authPt } from "./auth"
import { miscPt } from "./misc"

export type PatientTranslations = CommonSection &
  SearchSection &
  BookingSection &
  AppointmentsSection &
  ProfileSection &
  MessagesSection &
  AuthSection &
  MiscSection

export const ptPatient: PatientTranslations = {
  ...commonPt,
  ...searchPt,
  ...bookingPt,
  ...appointmentsPt,
  ...profilePt,
  ...messagesPt,
  ...authPt,
  ...miscPt,
}
