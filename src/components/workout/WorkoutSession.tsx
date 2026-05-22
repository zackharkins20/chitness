"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ExerciseCard } from "./ExerciseCard";
import { SwipeToFinish } from "./SwipeToFinish";
import type { SetLog } from "@/lib/types";
import type { TodayData } from "@/lib/data/today";

type ActiveRest = {
  programExerciseId: string;
  durationSec: number;
  startedAt: number;
};

const setKey = (peId: string, setIndex: number) => `${peId}:${setIndex}`;

export function WorkoutSession({ data }: { data: TodayData }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Hydrate initial sets state from server data
  const initialSets = useMemo(() => {
    const m: Record<string, Partial<SetLog>> = {};
    for (const s of data.setLogs) {
      m[setKey(s.program_exercise_id, s.set_index)] = s;
    }
    return m;
  }, [data.setLogs]);

  const [sets, setSets] = useState<Record<string, Partial<SetLog>>>(initialSets);
  const [activeRest, setActiveRest] = useState<ActiveRest | null>(null);

  /** Group exercises by superset_group, preserving order. */
  const groups = useMemo(() => {
    const result: Array<{ supersetGroup: string | null; items: typeof data.day.exercises }> = [];
    for (const ex of data.day.exercises) {
      const last = result[result.length - 1];
      if (ex.superset_group && last?.supersetGroup === ex.superset_group) {
        last.items.push(ex);
      } else {
        result.push({ supersetGroup: ex.superset_group, items: [ex] });
      }
    }
    return result;
  }, [data.day.exercises]);

  const onSetChange = useCallback(
    async (programExerciseId: string, setIndex: number, patch: Partial<SetLog>) => {
      const key = setKey(programExerciseId, setIndex);
      const current = sets[key] ?? {};
      const next = { ...current, ...patch };
      setSets((s) => ({ ...s, [key]: next }));

      // Persist (upsert): keep the row in sync, but only after the user has typed something
      // or completed the set. Empty rows with no completed_at can stay un-persisted.
      const hasContent =
        next.load != null || next.reps != null || next.time_sec != null ||
        next.rpe != null || next.intensity != null || next.completed_at != null;
      if (!hasContent) return;

      await supabase.from("set_logs").upsert(
        {
          workout_id: data.workoutId,
          program_exercise_id: programExerciseId,
          user_id: data.userId,
          set_index: setIndex,
          load: next.load ?? null,
          reps: next.reps ?? null,
          time_sec: next.time_sec ?? null,
          rpe: next.rpe ?? null,
          intensity: next.intensity ?? null,
          completed_at: next.completed_at ?? null,
        },
        { onConflict: "workout_id,program_exercise_id,set_index" },
      );
    },
    [sets, supabase, data.workoutId, data.userId],
  );

  const onToggleComplete = useCallback(
    async (programExerciseId: string, setIndex: number, restSec: number) => {
      const key = setKey(programExerciseId, setIndex);
      const current = sets[key] ?? {};
      const wasCompleted = !!current.completed_at;

      if (wasCompleted) {
        // Uncomplete
        await onSetChange(programExerciseId, setIndex, { completed_at: null });
        setActiveRest((r) => (r?.programExerciseId === programExerciseId ? null : r));
      } else {
        // Complete: pull values from previous if the user didn't type anything
        const prevForExercise = data.previousByExercise[programExerciseId] ?? [];
        const prev = prevForExercise[setIndex - 1];
        const patch: Partial<SetLog> = {
          completed_at: new Date().toISOString(),
          load: current.load ?? prev?.load ?? null,
          reps: current.reps ?? prev?.reps ?? null,
          time_sec: current.time_sec ?? prev?.time_sec ?? null,
        };
        await onSetChange(programExerciseId, setIndex, patch);

        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.(20);
        }

        setActiveRest({ programExerciseId, durationSec: restSec, startedAt: Date.now() });
      }
    },
    [sets, onSetChange, data.previousByExercise],
  );

  const onFinishWorkout = useCallback(async () => {
    await supabase
      .from("workouts")
      .update({ finished_at: new Date().toISOString() })
      .eq("id", data.workoutId);
    router.push(`/finish/${data.workoutId}`);
  }, [supabase, data.workoutId, router]);

  return (
    <main className="flex-1 flex flex-col gap-3 px-3 pt-safe pb-4 max-w-md w-full mx-auto">
      <header className="flex items-center justify-between px-2 pt-3 pb-1">
        <div>
          <h1 className="text-lg font-bold tracking-tight">{data.day.name}</h1>
          <p className="text-xs text-fg-muted">
            Started {new Date(data.startedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        {groups.map((group, gi) => (
          <div
            key={gi}
            className={
              group.supersetGroup
                ? "rounded-2xl border border-accent/30 bg-accent/5 p-1 space-y-1"
                : ""
            }
          >
            {group.supersetGroup && (
              <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider font-semibold text-accent">
                Superset {group.supersetGroup}
              </div>
            )}
            {group.items.map((ex) => {
              const setsForEx: Array<Partial<SetLog> | null> = Array.from(
                { length: ex.target_sets },
                (_, i) => sets[setKey(ex.id, i + 1)] ?? null,
              );
              return (
                <ExerciseCard
                  key={ex.id}
                  programExercise={ex}
                  sets={setsForEx}
                  previous={data.previousByExercise[ex.id] ?? []}
                  isSupersetMember={!!group.supersetGroup}
                  activeRest={activeRest}
                  onSetChange={(setIndex, patch) => onSetChange(ex.id, setIndex, patch)}
                  onToggleComplete={(setIndex, restSec) => onToggleComplete(ex.id, setIndex, restSec)}
                  onDismissRest={() => setActiveRest(null)}
                  onOpenMenu={() => {/* TODO: notes / swap exercise */}}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-2">
        <SwipeToFinish onFinish={onFinishWorkout} />
      </div>
    </main>
  );
}
