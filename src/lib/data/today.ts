import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { DayWithExercises, SetLog } from "@/lib/types";

export type TodayData = {
  userId: string;
  day: DayWithExercises;
  workoutId: string;             // active (in-progress) workout, created if needed
  startedAt: string;
  setLogs: SetLog[];             // sets already logged in the active workout
  previousByExercise: Record<string, SetLog[]>;  // last completed sets per program_exercise_id
};

/**
 * Pick which day she's doing today:
 *   1. If a workout was started today but not finished → resume it
 *   2. Otherwise, advance from the last finished workout's day_order
 *   3. If she has never trained → Day 1
 */
export async function getTodayData(): Promise<TodayData | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Active program + days
  const { data: program } = await supabase
    .from("programs")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!program) return null;

  const { data: days } = await supabase
    .from("program_days")
    .select("*")
    .eq("program_id", program.id)
    .order("day_order");

  if (!days || days.length === 0) return null;

  // 1. Look for an in-progress workout
  const { data: inProgress } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", user.id)
    .is("finished_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let chosenDayId: string;
  let workoutId: string;
  let startedAt: string;

  if (inProgress) {
    chosenDayId = inProgress.program_day_id;
    workoutId = inProgress.id;
    startedAt = inProgress.started_at;
  } else {
    // 2. Advance from the most recent finished workout
    const { data: lastFinished } = await supabase
      .from("workouts")
      .select("program_day_id, finished_at, program_days!inner(day_order)")
      .eq("user_id", user.id)
      .not("finished_at", "is", null)
      .order("finished_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let nextOrder = 1;
    if (lastFinished) {
      const lastOrder = (lastFinished.program_days as unknown as { day_order: number }).day_order;
      nextOrder = (lastOrder % days.length) + 1;
    }
    const chosen = days.find((d) => d.day_order === nextOrder)!;
    chosenDayId = chosen.id;

    // Create new workout
    const { data: created } = await supabase
      .from("workouts")
      .insert({ user_id: user.id, program_day_id: chosenDayId })
      .select()
      .single();
    if (!created) return null;
    workoutId = created.id;
    startedAt = created.started_at;
  }

  // Exercises for the chosen day
  const { data: programExercises } = await supabase
    .from("program_exercises")
    .select("*, exercise:exercises(*)")
    .eq("program_day_id", chosenDayId)
    .order("order_index");

  if (!programExercises) return null;

  // Sets logged in the active workout so far
  const { data: setLogs } = await supabase
    .from("set_logs")
    .select("*")
    .eq("workout_id", workoutId)
    .order("set_index");

  // For each program_exercise, find the most recent COMPLETED sets from a previous workout
  // so we can pre-fill load/reps as grayed placeholders.
  const programExerciseIds = programExercises.map((pe) => pe.id);
  const previousByExercise: Record<string, SetLog[]> = {};
  if (programExerciseIds.length > 0) {
    // Get the most recent finished workout for THIS day
    const { data: priorWorkouts } = await supabase
      .from("workouts")
      .select("id, finished_at")
      .eq("user_id", user.id)
      .eq("program_day_id", chosenDayId)
      .not("finished_at", "is", null)
      .neq("id", workoutId)
      .order("finished_at", { ascending: false })
      .limit(1);

    if (priorWorkouts && priorWorkouts.length > 0) {
      const priorId = priorWorkouts[0].id;
      const { data: priorSets } = await supabase
        .from("set_logs")
        .select("*")
        .eq("workout_id", priorId)
        .in("program_exercise_id", programExerciseIds)
        .order("set_index");
      for (const s of priorSets ?? []) {
        (previousByExercise[s.program_exercise_id] ??= []).push(s);
      }
    }
  }

  const dayRecord = days.find((d) => d.id === chosenDayId)!;
  const day: DayWithExercises = {
    ...dayRecord,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    exercises: programExercises as any,
  };

  return {
    userId: user.id,
    day,
    workoutId,
    startedAt,
    setLogs: setLogs ?? [],
    previousByExercise,
  };
}
