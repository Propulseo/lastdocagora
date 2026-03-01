"use client";

import { LOCALE_COOKIE_NAME, type SupportedLocale } from "./types";

type LocaleListener = (locale: SupportedLocale) => void;

const listeners = new Set<LocaleListener>();

/**
 * Set locale client-side: writes cookie directly + notifies all subscribed
 * i18n providers so they re-render with new translations immediately.
 * No server round-trip required.
 */
export function setClientLocale(locale: SupportedLocale): void {
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;

  for (const fn of listeners) {
    fn(locale);
  }
}

/**
 * Subscribe to locale changes. Returns cleanup function.
 * Used by i18n providers to react to language switches instantly.
 */
export function subscribeLocaleChange(fn: LocaleListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
