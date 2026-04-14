import { ReviewForm } from "./_components/ReviewForm"

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams
  return <ReviewForm token={token ?? null} />
}
