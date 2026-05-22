import "server-only";
import { createClient } from "@/lib/supabase/server";

export type HistoryData = {
  workoutDates: string[];               // ISO yyyy-mm-dd, finished workouts
  streak: number;
  exercises: Array<{ id: string; name: string }>;  // for picker
};

export async function getHistoryData(): Promise<HistoryData | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: workouts } = await supabase
    .from("workouts")
    .select("finished_at")
    .eq("user_id", user.id)
    .not("finished_at", "is", null)
    .order("finished_at", { ascending: false });

  const workoutDates = (workouts ?? [])
    .map((w) => w.finished_at?.slice(0, 10))
    .filter((d): d is string => !!d);

  // Streak: consecutive days backwards from today
  const dateSet = new Set(workoutDates);
  let streak = 0;
  const cursor = new Date();
  while (dateSet.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const { data: exercises } = await supabase
    .from("exercises")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name");

  return {
    workoutDates,
    streak,
    exercises: exercises ?? [],
  };
}

export type ExerciseProgressPoint = {
  date: string;
  heaviestLoad: number | null;
  topSetVolume: number | null;     // load × reps for heaviest set
  estimated1RM: number | null;     // Epley: load × (1 + reps/30)
};

export async function getExerciseProgress(exerciseId: string): Promise<ExerciseProgressPoint[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // All sets across all program_exercises that use this exercise
  const { data: rows } = await supabase
    .from("set_logs")
    .select("load, reps, completed_at, workout:workouts!inner(finished_at), program_exercise:program_exercises!inner(exercise_id)")
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("completed_at");

  if (!rows) return [];

  // Filter to this exercise (server-side join can't filter on nested ref directly here)
  type Row = {
    load: number | null;
    reps: number | null;
    completed_at: string;
    program_exercise: { exercise_id: string };
  };
  const filtered = (rows as unknown as Row[]).filter((r) => r.program_exercise.exercise_id === exerciseId);

  // Group by date (yyyy-mm-dd), keep the heaviest set per day
  const byDate = new Map<string, ExerciseProgressPoint>();
  for (const r of filtered) {
    if (r.load == null || r.reps == null) continue;
    const date = r.completed_at.slice(0, 10);
    const e1rm = r.load * (1 + r.reps / 30);
    const existing = byDate.get(date);
    if (!existing) {
      byDate.set(date, {
        date,
        heaviestLoad: r.load,
        topSetVolume: r.load * r.reps,
        estimated1RM: Math.round(e1rm * 10) / 10,
      });
    } else {
      if (r.load > (existing.heaviestLoad ?? 0)) existing.heaviestLoad = r.load;
      const vol = r.load * r.reps;
      if (vol > (existing.topSetVolume ?? 0)) existing.topSetVolume = vol;
      if (e1rm > (existing.estimated1RM ?? 0)) existing.estimated1RM = Math.round(e1rm * 10) / 10;
    }
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}
