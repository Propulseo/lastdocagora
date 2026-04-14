import type { PatientTranslations } from "../pt"

import { commonEn } from "./common"
import { searchEn } from "./search"
import { bookingEn } from "./booking"
import { appointmentsEn } from "./appointments"
import { profileEn } from "./profile"
import { messagesEn } from "./messages"
import { authEn } from "./auth"
import { miscEn } from "./misc"

export const enPatient: PatientTranslations = {
  ...commonEn,
  ...searchEn,
  ...bookingEn,
  ...appointmentsEn,
  ...profileEn,
  ...messagesEn,
  ...authEn,
  ...miscEn,
}
