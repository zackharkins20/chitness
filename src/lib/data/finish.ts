import "server-only";
import { createClient } from "@/lib/supabase/server";

export type FinishStats = {
  dayName: string;
  startedAt: string;
  finishedAt: string;
  durationSec: number;
  totalVolume: number;
  totalReps: number;
  setsCompleted: number;
  prs: Array<{ exerciseName: string; load: number; reps: number }>;
  streak: number;
};

export async function getFinishStats(workoutId: string): Promise<FinishStats | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: workout } = await supabase
    .from("workouts")
    .select("*, program_days!inner(name)")
    .eq("id", workoutId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!workout || !workout.finished_at) return null;

  const { data: sets } = await supabase
    .from("set_logs")
    .select("*, program_exercises!inner(exercise_id, exercises!inner(name))")
    .eq("workout_id", workoutId)
    .not("completed_at", "is", null);

  const setsArr = sets ?? [];
  let totalVolume = 0;
  let totalReps = 0;
  // Track this workout's best set per exercise
  type BestSet = { load: number; reps: number; exerciseName: string; exerciseId: string };
  const bestByExercise = new Map<string, BestSet>();

  for (const s of setsArr) {
    if (s.load != null && s.reps != null) {
      totalVolume += s.load * s.reps;
      totalReps += s.reps;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pe = (s as any).program_exercises;
    const exerciseId = pe?.exercise_id as string;
    const exerciseName = pe?.exercises?.name as string;
    if (exerciseId && s.load != null && s.reps != null) {
      const prev = bestByExercise.get(exerciseId);
      // Compare by estimated 1RM: load * (1 + reps/30)
      const score = s.load * (1 + s.reps / 30);
      const prevScore = prev ? prev.load * (1 + prev.reps / 30) : 0;
      if (score > prevScore) {
        bestByExercise.set(exerciseId, { load: s.load, reps: s.reps, exerciseName, exerciseId });
      }
    }
  }

  // For each exercise, compare against all-time best from earlier workouts
  const prs: FinishStats["prs"] = [];
  for (const [exerciseId, best] of bestByExercise) {
    const { data: priorSets } = await supabase
      .from("set_logs")
      .select("load, reps, workout_id")
      .eq("user_id", user.id)
      .neq("workout_id", workoutId)
      .not("completed_at", "is", null)
      .in(
        "program_exercise_id",
        // Get all program_exercise_ids for this exercise across days
        (
          await supabase
            .from("program_exercises")
            .select("id, program_days!inner(program_id, programs!inner(user_id))")
            .eq("exercise_id", exerciseId)
        ).data?.map((r) => r.id) ?? [],
      );

    const priorBestScore = (priorSets ?? []).reduce((acc, s) => {
      if (s.load == null || s.reps == null) return acc;
      return Math.max(acc, s.load * (1 + s.reps / 30));
    }, 0);
    const currentScore = best.load * (1 + best.reps / 30);
    if (currentScore > priorBestScore) {
      prs.push({ exerciseName: best.exerciseName, load: best.load, reps: best.reps });
    }
  }

  // Streak: count consecutive days (by finished_at::date) including today, walking backward
  const { data: history } = await supabase
    .from("workouts")
    .select("finished_at")
    .eq("user_id", user.id)
    .not("finished_at", "is", null)
    .order("finished_at", { ascending: false })
    .limit(60);

  const dates = new Set<string>();
  for (const w of history ?? []) {
    if (w.finished_at) dates.add(w.finished_at.slice(0, 10));
  }
  let streak = 0;
  const cursor = new Date();
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  const durationSec = Math.floor(
    (new Date(workout.finished_at).getTime() - new Date(workout.started_at).getTime()) / 1000,
  );

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dayName: (workout as any).program_days.name,
    startedAt: workout.started_at,
    finishedAt: workout.finished_at,
    durationSec,
    totalVolume: Math.round(totalVolume),
    totalReps,
    setsCompleted: setsArr.length,
    prs,
    streak,
  };
}
