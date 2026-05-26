import { getTodayData } from "@/lib/data/today";
import { WorkoutSession } from "@/components/workout/WorkoutSession";

export const dynamic = "force-dynamic";

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string }>;
}) {
  const { day } = await searchParams;
  const dayOrder = day ? Number(day) : undefined;
  const data = await getTodayData(Number.isFinite(dayOrder) ? dayOrder : undefined);

  if (!data) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <h1 className="text-xl font-semibold">No program yet</h1>
        <p className="text-fg-muted mt-2 text-center">
          Sign out and sign back in to seed your program.
        </p>
      </main>
    );
  }

  return <WorkoutSession data={data} />;
}
