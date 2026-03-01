/**
 * i18n Key Parity Checker
 *
 * Validates that all translation files for each namespace have identical key structures.
 * Portuguese (pt) is the source of truth. All other locales must match exactly.
 *
 * Covers:
 *   - JSON-based namespaces (professional, admin)
 *   - TypeScript-based namespaces (patient) — also type-checked at compile time
 *
 * Usage:
 *   npx tsx scripts/check-i18n-parity.ts
 *
 * Exit codes:
 *   0 = all keys match
 *   1 = missing or extra keys found
 */

import * as fs from "fs";
import * as path from "path";
import { pathToFileURL } from "url";

const LOCALES = ["pt", "fr"] as const;
const SOURCE_LOCALE = "pt";

// JSON namespace file path mappings
const JSON_NAMESPACES: Record<string, (locale: string) => string> = {
  professional: (locale) =>
    path.join(__dirname, "..", "src", "locales", locale, "professional.json"),
  admin: (locale) =>
    path.join(__dirname, "..", "locales", locale, "admin.json"),
};

function getKeys(obj: unknown, prefix = ""): string[] {
  if (obj === null || obj === undefined) return [];
  if (Array.isArray(obj)) {
    return [`${prefix}[]`];
  }
  if (typeof obj === "object") {
    const keys: string[] = [];
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        keys.push(...getKeys(value, fullKey));
      } else if (Array.isArray(value)) {
        keys.push(`${fullKey}[${value.length}]`);
      } else {
        keys.push(fullKey);
      }
    }
    return keys;
  }
  return [prefix];
}

function compareKeys(
  namespace: string,
  locale: string,
  sourceKeys: Set<string>,
  targetKeys: Set<string>,
): boolean {
  const missing: string[] = [];
  const extra: string[] = [];

  for (const key of sourceKeys) {
    if (!targetKeys.has(key)) missing.push(key);
  }

  for (const key of targetKeys) {
    if (!sourceKeys.has(key)) extra.push(key);
  }

  if (missing.length > 0 || extra.length > 0) {
    console.error(`\n[FAIL] ${namespace}/${locale}:`);
    if (missing.length > 0) {
      console.error(`  Missing keys (present in ${SOURCE_LOCALE}, absent in ${locale}):`);
      for (const key of missing) console.error(`    - ${key}`);
    }
    if (extra.length > 0) {
      console.error(`  Extra keys (absent in ${SOURCE_LOCALE}, present in ${locale}):`);
      for (const key of extra) console.error(`    + ${key}`);
    }
    return false;
  }

  console.log(`[PASS] ${namespace}/${locale}: ${sourceKeys.size} keys match`);
  return true;
}

async function main() {
  let hasErrors = false;

  // ── Check JSON-based namespaces ──
  for (const [namespace, getPath] of Object.entries(JSON_NAMESPACES)) {
    const sourcePath = getPath(SOURCE_LOCALE);

    if (!fs.existsSync(sourcePath)) {
      console.error(`[SKIP] Source file not found: ${sourcePath}`);
      continue;
    }

    const sourceContent = JSON.parse(fs.readFileSync(sourcePath, "utf-8"));
    const sourceKeys = new Set(getKeys(sourceContent));

    for (const locale of LOCALES) {
      if (locale === SOURCE_LOCALE) continue;

      const targetPath = getPath(locale);

      if (!fs.existsSync(targetPath)) {
        console.error(`[FAIL] ${namespace}/${locale}: File not found at ${targetPath}`);
        hasErrors = true;
        continue;
      }

      const targetContent = JSON.parse(fs.readFileSync(targetPath, "utf-8"));
      const targetKeys = new Set(getKeys(targetContent));

      if (!compareKeys(namespace, locale, sourceKeys, targetKeys)) {
        hasErrors = true;
      }
    }
  }

  // ── Check TypeScript-based namespaces (patient) ──
  // Also type-checked at compile time via PatientTranslations type.
  // This runtime check provides defense-in-depth for CI.
  try {
    const ptPath = path.join(__dirname, "..", "src", "locales", "patient", "pt.ts");
    const frPath = path.join(__dirname, "..", "src", "locales", "patient", "fr.ts");
    const ptModule = await import(pathToFileURL(ptPath).href);
    const frModule = await import(pathToFileURL(frPath).href);

    const ptKeys = new Set(getKeys(ptModule.ptPatient));
    const frKeys = new Set(getKeys(frModule.frPatient));

    if (!compareKeys("patient", "fr", ptKeys, frKeys)) {
      hasErrors = true;
    }
  } catch (err) {
    console.error("[FAIL] patient: Could not load TypeScript modules");
    console.error(`  ${err}`);
    hasErrors = true;
  }

  if (hasErrors) {
    console.error("\ni18n parity check FAILED. Fix the keys above.");
    process.exit(1);
  } else {
    console.log("\ni18n parity check PASSED. All locales match.");
    process.exit(0);
  }
}

main();
