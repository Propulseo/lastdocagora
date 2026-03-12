"use server";

import type { PeriodStats } from "./compare-actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AIInsight {
  type: "positive" | "warning" | "info";
  title: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Server action — generate AI insights via OpenAI
// ---------------------------------------------------------------------------

const LOCALE_MAP: Record<string, string> = {
  fr: "français",
  pt: "portugais",
  en: "anglais",
};

export async function fetchAIInsights(
  dataA: PeriodStats,
  dataB: PeriodStats,
  locale: string,
): Promise<AIInsight[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackInsights(dataA, dataB);
  }

  const lang = LOCALE_MAP[locale] ?? "français";

  const systemPrompt = `Tu es un assistant d'analyse médicale pour DocAgora. Analyse ces statistiques d'un professionnel de santé et génère 3 insights concis et actionnables en ${lang}.
Format : JSON array de 3 objets { "type": "positive"|"warning"|"info", "title": string, "description": string }
Sois précis, utilise les chiffres fournis, max 25 mots par insight.`;

  const userPrompt = `Période A: ${dataA.appointments} RDV, ${dataA.revenue}€ revenus, ${dataA.attendanceRate}% présence, ${dataA.newPatients} nouveaux patients, ${dataA.cancellationRate}% annulation.
Période B: ${dataB.appointments} RDV, ${dataB.revenue}€ revenus, ${dataB.attendanceRate}% présence, ${dataB.newPatients} nouveaux patients, ${dataB.cancellationRate}% annulation.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!res.ok) return fallbackInsights(dataA, dataB);

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "";
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) return fallbackInsights(dataA, dataB);

    const parsed = JSON.parse(match[0]) as AIInsight[];
    return parsed.slice(0, 3);
  } catch {
    return fallbackInsights(dataA, dataB);
  }
}

// ---------------------------------------------------------------------------
// Fallback (no API key or error)
// ---------------------------------------------------------------------------

function fallbackInsights(a: PeriodStats, b: PeriodStats): AIInsight[] {
  const insights: AIInsight[] = [];
  const delta = b.appointments > 0
    ? Math.round(((a.appointments - b.appointments) / b.appointments) * 100)
    : 0;

  if (delta > 0) {
    insights.push({
      type: "positive",
      title: `+${delta}%`,
      description: `Activité en hausse : ${a.appointments} vs ${b.appointments} RDV`,
    });
  } else if (delta < 0) {
    insights.push({
      type: "warning",
      title: `${delta}%`,
      description: `Activité en baisse : ${a.appointments} vs ${b.appointments} RDV`,
    });
  }

  if (a.attendanceRate > b.attendanceRate) {
    insights.push({
      type: "positive",
      title: `${a.attendanceRate}%`,
      description: `Taux de présence amélioré (+${a.attendanceRate - b.attendanceRate}%)`,
    });
  } else if (a.cancellationRate > 15) {
    insights.push({
      type: "warning",
      title: `${a.cancellationRate}%`,
      description: "Taux d'annulation élevé, considérer des rappels",
    });
  }

  if (a.newPatients > b.newPatients) {
    insights.push({
      type: "info",
      title: `${a.newPatients} nouveaux`,
      description: `Croissance des nouveaux patients vs ${b.newPatients} précédemment`,
    });
  }

  return insights.slice(0, 3);
}
