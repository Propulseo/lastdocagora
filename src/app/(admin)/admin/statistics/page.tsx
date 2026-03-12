import { fetchStatisticsData, type PeriodRange, PERIOD_OPTIONS } from "./_lib/queries";
import { StatisticsClient } from "./_components/StatisticsClient";

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

export default async function StatisticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const range = PERIOD_OPTIONS.includes(params.range as PeriodRange)
    ? (params.range as PeriodRange)
    : "30d";

  const data = await fetchStatisticsData(range);

  return <StatisticsClient data={data} />;
}
