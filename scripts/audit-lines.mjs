#!/usr/bin/env node

/**
 * audit-lines.mjs
 *
 * Scans the codebase for large files and generates a maintenance report.
 * Run: node scripts/audit-lines.mjs
 * Output: maintenance_audit.md at project root
 */

import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, relative, extname, sep } from "node:path";

// ── Config ──────────────────────────────────────────────────────────────────

const ROOT = process.cwd();
const SCAN_DIRS = ["src", "app", "pages"];
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const IGNORE_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  "supabase",
  "public",
  "generated",
]);
const THRESHOLD = 250;
const TOP_N = 30;
const OUTPUT = join(ROOT, "maintenance_audit.md");

// ── Line counting ───────────────────────────────────────────────────────────

/**
 * Counts "useful" lines by stripping blank lines and comments.
 * Handles single-line (//) and multi-line block comments.
 * Limitation: does not handle strings containing comment-like patterns
 * (e.g. `const x = "// not a comment"`). This is acceptable for an audit.
 */
function countUsefulLines(content) {
  const lines = content.split("\n");
  let total = lines.length;
  let useful = 0;
  let inBlockComment = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Inside a block comment — check for end
    if (inBlockComment) {
      if (line.includes("*/")) {
        inBlockComment = false;
      }
      continue;
    }

    // Blank line
    if (line === "") continue;

    // Single-line block comment: /* ... */
    if (line.startsWith("/*") && line.includes("*/")) continue;

    // Start of multi-line block comment
    if (line.startsWith("/*")) {
      inBlockComment = true;
      continue;
    }

    // Single-line comment
    if (line.startsWith("//")) continue;

    useful++;
  }

  return { total, useful };
}

// ── File categorization ─────────────────────────────────────────────────────

function categorize(relPath) {
  const normalized = relPath.replace(/\\/g, "/");
  const segments = normalized.split("/");
  const fileName = segments[segments.length - 1];

  if (fileName === "page.tsx" || fileName === "page.ts" || fileName === "page.jsx" || fileName === "page.js") {
    return "page";
  }
  if (fileName === "layout.tsx" || fileName === "layout.ts") {
    return "page"; // layouts are page-level
  }
  if (fileName === "loading.tsx" || fileName === "loading.ts") {
    return "page";
  }

  if (segments.includes("components") || segments.includes("_components")) {
    return "component";
  }
  if (segments.includes("ui")) {
    return "component";
  }

  if (
    segments.includes("lib") ||
    segments.includes("utils") ||
    segments.includes("hooks") ||
    segments.includes("config") ||
    segments.includes("locales") ||
    segments.includes("i18n") ||
    segments.includes("_actions")
  ) {
    return "lib";
  }

  if (segments.includes("api")) {
    return "lib"; // API routes are logic
  }

  // .tsx files not in lib are likely components
  if (extname(fileName) === ".tsx") {
    return "component";
  }

  return "other";
}

// ── Refactoring suggestions ─────────────────────────────────────────────────

function suggest(category, usefulLines, relPath) {
  const normalized = relPath.replace(/\\/g, "/");

  if (category === "page") {
    if (usefulLines > 500) {
      return "Extraire sections en sous-composants + data fetching dans des server actions/services";
    }
    if (usefulLines > 350) {
      return "Extraire les sections UI dans des sous-composants colocalisés (_components/)";
    }
    return "Envisager d'extraire la logique métier dans un fichier séparé ou un hook";
  }

  if (category === "component") {
    if (normalized.includes("/ui/")) {
      return "Composant UI shadcn/ui — normal, laisser tel quel sauf si customisé lourdement";
    }
    if (usefulLines > 500) {
      return "Composant trop large — splitter en sous-composants + extraire hooks/logique";
    }
    if (usefulLines > 350) {
      return "Extraire la logique dans un hook custom, garder le composant déclaratif";
    }
    return "Envisager de séparer rendu et logique (hook dédié ou composants enfants)";
  }

  if (category === "lib") {
    if (usefulLines > 500) {
      return "Module trop dense — séparer en sous-modules par responsabilité";
    }
    return "Vérifier si certaines fonctions peuvent être extraites dans un module dédié";
  }

  return "Examiner la structure et envisager un découpage par responsabilité";
}

// ── File system walk ────────────────────────────────────────────────────────

async function walk(dir) {
  const results = [];

  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return results; // directory doesn't exist, skip
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      results.push(...(await walk(fullPath)));
    } else if (entry.isFile() && EXTENSIONS.has(extname(entry.name))) {
      results.push(fullPath);
    }
  }

  return results;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Scanning codebase...\n");

  // Collect all files from scan directories
  const allFiles = [];
  for (const dir of SCAN_DIRS) {
    const absDir = join(ROOT, dir);
    allFiles.push(...(await walk(absDir)));
  }

  if (allFiles.length === 0) {
    console.error("No files found. Make sure you run this from the project root.");
    process.exit(1);
  }

  // Analyze each file
  const results = [];
  for (const filePath of allFiles) {
    const content = await readFile(filePath, "utf-8");
    const relPath = relative(ROOT, filePath);
    const { total, useful } = countUsefulLines(content);
    const category = categorize(relPath);

    results.push({ relPath, total, useful, category });
  }

  // Sort by useful lines descending
  results.sort((a, b) => b.useful - a.useful);

  // Stats
  const totalFiles = results.length;
  const overThreshold = results.filter((r) => r.useful > THRESHOLD);
  const top30 = results.slice(0, TOP_N);

  // Category distribution
  const catCounts = { page: 0, component: 0, lib: 0, other: 0 };
  for (const r of results) catCounts[r.category]++;

  const overCatCounts = { page: 0, component: 0, lib: 0, other: 0 };
  for (const r of overThreshold) overCatCounts[r.category]++;

  // ── Generate report ─────────────────────────────────────────────────────

  const now = new Date().toISOString().slice(0, 10);
  const lines = [];

  lines.push(`# Audit de maintenance — Taille des fichiers`);
  lines.push(``);
  lines.push(`> Rapport généré le ${now} par \`node scripts/audit-lines.mjs\``);
  lines.push(``);
  lines.push(`## Résumé`);
  lines.push(``);
  lines.push(`| Métrique | Valeur |`);
  lines.push(`|---|---|`);
  lines.push(`| Fichiers scannés | ${totalFiles} |`);
  lines.push(`| Fichiers > ${THRESHOLD} lignes utiles | ${overThreshold.length} |`);
  lines.push(`| Seuil d'alerte | ${THRESHOLD} lignes (hors vides & commentaires) |`);
  lines.push(``);
  lines.push(`### Répartition par catégorie`);
  lines.push(``);
  lines.push(`| Catégorie | Total | > ${THRESHOLD} lignes |`);
  lines.push(`|---|---|---|`);
  for (const cat of ["page", "component", "lib", "other"]) {
    lines.push(`| ${cat} | ${catCounts[cat]} | ${overCatCounts[cat]} |`);
  }
  lines.push(``);

  // Top 30
  lines.push(`## Top ${TOP_N} des fichiers les plus longs`);
  lines.push(``);
  lines.push(`| # | Fichier | Lignes utiles | Total | Catégorie |`);
  lines.push(`|---|---|---|---|---|`);
  top30.forEach((r, i) => {
    const flag = r.useful > THRESHOLD ? " :warning:" : "";
    lines.push(
      `| ${i + 1} | \`${r.relPath.replace(/\\/g, "/")}\` | **${r.useful}** | ${r.total} | ${r.category}${flag} |`
    );
  });
  lines.push(``);

  // Detailed section for files over threshold
  if (overThreshold.length > 0) {
    lines.push(`## Fichiers dépassant ${THRESHOLD} lignes — Suggestions de refactoring`);
    lines.push(``);
    lines.push(`| Fichier | Lignes utiles | Catégorie | Suggestion |`);
    lines.push(`|---|---|---|---|`);
    for (const r of overThreshold) {
      const s = suggest(r.category, r.useful, r.relPath);
      lines.push(`| \`${r.relPath.replace(/\\/g, "/")}\` | **${r.useful}** | ${r.category} | ${s} |`);
    }
    lines.push(``);
  } else {
    lines.push(`## Aucun fichier ne dépasse ${THRESHOLD} lignes utiles :tada:`);
    lines.push(``);
  }

  // Methodology note
  lines.push(`## Méthodologie`);
  lines.push(``);
  lines.push(`- **Lignes utiles** : lignes non vides, hors commentaires (\`//\` et \`/* */\`)`);
  lines.push(`- **Limite connue** : les chaînes de caractères contenant des patterns de commentaires`);
  lines.push(`  (ex: \`"// ceci"\`) sont comptées comme commentaires. Impact négligeable en pratique.`);
  lines.push(`- **Répertoires scannés** : ${SCAN_DIRS.map((d) => `\`${d}/\``).join(", ")}`);
  lines.push(`- **Répertoires ignorés** : ${[...IGNORE_DIRS].map((d) => `\`${d}/\``).join(", ")}`);
  lines.push(`- **Extensions** : ${[...EXTENSIONS].join(", ")}`);
  lines.push(``);

  const report = lines.join("\n");
  await writeFile(OUTPUT, report, "utf-8");

  // Console summary
  console.log(`Fichiers scannés : ${totalFiles}`);
  console.log(`Fichiers > ${THRESHOLD} lignes utiles : ${overThreshold.length}`);
  console.log(`\nTop 10 :`);
  results.slice(0, 10).forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.relPath.replace(/\\/g, "/")} — ${r.useful} lignes utiles (${r.total} total)`);
  });
  console.log(`\nRapport écrit dans : ${relative(ROOT, OUTPUT)}`);
}

main().catch((err) => {
  console.error("Erreur :", err);
  process.exit(1);
});
