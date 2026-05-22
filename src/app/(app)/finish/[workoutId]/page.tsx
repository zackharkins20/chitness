import Link from "next/link";
import { getFinishStats } from "@/lib/data/finish";
import { Trophy, Clock, Flame, Dumbbell } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FinishPage({ params }: { params: Promise<{ workoutId: string }> }) {
  const { workoutId } = await params;
  const stats = await getFinishStats(workoutId);

  if (!stats) {
    return (
      <main className="flex-1 flex items-center justify-center p-6">
        <p className="text-fg-muted">Workout not found.</p>
      </main>
    );
  }

  const minutes = Math.round(stats.durationSec / 60);
  const volume = stats.totalVolume.toLocaleString();

  return (
    <main className="flex-1 flex flex-col items-center px-5 pt-safe pb-6 max-w-md w-full mx-auto">
      <div className="mt-12 mb-8 text-center">
        <div className="size-20 mx-auto rounded-full bg-success/20 flex items-center justify-center mb-4">
          <Trophy className="size-10 text-success" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Workout complete</h1>
        <p className="text-fg-muted mt-1">{stats.dayName}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full mb-6">
        <StatTile icon={<Clock className="size-5" />} label="Duration" value={`${minutes}m`} />
        <StatTile icon={<Dumbbell className="size-5" />} label="Sets" value={String(stats.setsCompleted)} />
        <StatTile icon={<Flame className="size-5" />} label="Streak" value={`${stats.streak}d`} />
        <StatTile icon={<Dumbbell className="size-5" />} label="Volume" value={volume} suffix="kg" />
      </div>

      {stats.prs.length > 0 && (
        <div className="w-full mb-6 rounded-2xl bg-warning/10 border border-warning/30 p-4">
          <div className="flex items-center gap-2 text-warning font-semibold mb-2">
            <Trophy className="size-4" /> {stats.prs.length} new {stats.prs.length === 1 ? "PR" : "PRs"}
          </div>
          <ul className="text-sm space-y-1">
            {stats.prs.map((pr, i) => (
              <li key={i} className="flex justify-between text-fg">
                <span>{pr.exerciseName}</span>
                <span className="font-mono">{pr.load} × {pr.reps}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href="/today"
        className="mt-auto w-full h-14 rounded-2xl bg-accent text-white font-semibold text-lg flex items-center justify-center active:bg-accent-hover"
      >
        Done
      </Link>
    </main>
  );
}

function StatTile({
  icon, label, value, suffix,
}: { icon: React.ReactNode; label: string; value: string; suffix?: string }) {
  return (
    <div className="rounded-2xl bg-bg-card border border-border p-4">
      <div className="flex items-center gap-2 text-fg-muted text-xs uppercase tracking-wider">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 font-bold text-2xl tabular-nums">
        {value}
        {suffix && <span className="text-fg-muted text-base font-medium ml-1">{suffix}</span>}
      </div>
    </div>
  );
}
