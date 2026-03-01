"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME, isSupportedLocale } from "./types";

export async function setLanguageCookie(locale: string) {
  if (!isSupportedLocale(locale)) {
    throw new Error(`Unsupported locale: ${locale}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
    httpOnly: false, // Readable by middleware
  });
}
