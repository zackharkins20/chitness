import { getHistoryData } from "@/lib/data/history";
import { Heatmap } from "@/components/history/Heatmap";
import { ExerciseProgress } from "@/components/history/ExerciseProgress";
import { Flame } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const data = await getHistoryData();
  if (!data) return null;

  return (
    <main className="flex-1 flex flex-col gap-4 px-4 pt-safe pb-4 max-w-md w-full mx-auto">
      <header className="pt-3 pb-1">
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
      </header>

      <section className="rounded-2xl bg-bg-card border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="size-5 text-warning" />
            <span className="font-semibold">Streak</span>
          </div>
          <span className="text-2xl font-bold tabular-nums">
            {data.streak}<span className="text-fg-muted text-sm font-medium ml-1">days</span>
          </span>
        </div>
        <Heatmap workoutDates={data.workoutDates} />
        <p className="text-xs text-fg-dim mt-2">Last 12 weeks</p>
      </section>

      <ExerciseProgress exercises={data.exercises} />
    </main>
  );
}
