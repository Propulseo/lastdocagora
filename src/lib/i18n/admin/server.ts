import { cookies } from "next/headers";
import { getAdminI18n } from "./getAdminI18n";

/**
 * Server-only helper for admin translations.
 * Reads locale from cookie and resolves translations.
 * Use in server components and server pages.
 */
export async function getAdminI18nServer() {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("docagora_lang")?.value;
  return getAdminI18n(rawLocale);
}
