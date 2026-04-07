/**
 * Utilitaire CSV centralisé — serveur et client.
 *
 * - BOM UTF-8 pour accents dans Excel
 * - Séparateur ";" compatible Excel FR/PT
 * - Retours de ligne CRLF
 * - Échappement guillemets / sauts de ligne
 */

const SEPARATOR = ";";
const BOM = "\uFEFF";

/** Échappe une cellule CSV (guillemets, séparateur, sauts de ligne). */
export function escapeCell(value: unknown): string {
  if (value == null || value === "") return "";
  const str = String(value);
  if (
    str.includes(SEPARATOR) ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Construit le contenu CSV complet (avec BOM) à partir de lignes pré-échappées. */
export function buildCsvContent(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCell).join(SEPARATOR);
  const dataLines = rows.map((row) => row.map(escapeCell).join(SEPARATOR));
  return BOM + [headerLine, ...dataLines].join("\r\n");
}

/** Génère le nom de fichier avec la date du jour. */
export function csvFilename(prefix: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `${prefix}_${today}.csv`;
}

/**
 * Télécharge un CSV côté client (navigateur uniquement).
 */
export function downloadCsv(
  headers: string[],
  rows: string[][],
  filenamePrefix: string,
): void {
  const content = buildCsvContent(headers, rows);
  const blob = new Blob([content], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = csvFilename(filenamePrefix);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Crée une NextResponse CSV (pour les API routes serveur).
 */
export function csvResponse(
  headers: string[],
  rows: string[][],
  filenamePrefix: string,
): Response {
  const content = buildCsvContent(headers, rows);
  const filename = csvFilename(filenamePrefix);

  return new Response(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
