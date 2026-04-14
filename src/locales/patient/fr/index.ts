import type { PatientTranslations } from "../pt"

import { commonFr } from "./common"
import { searchFr } from "./search"
import { bookingFr } from "./booking"
import { appointmentsFr } from "./appointments"
import { profileFr } from "./profile"
import { messagesFr } from "./messages"
import { authFr } from "./auth"
import { miscFr } from "./misc"

export const frPatient: PatientTranslations = {
  ...commonFr,
  ...searchFr,
  ...bookingFr,
  ...appointmentsFr,
  ...profileFr,
  ...messagesFr,
  ...authFr,
  ...miscFr,
}
