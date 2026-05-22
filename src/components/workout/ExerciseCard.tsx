"use client";

import { MoreHorizontal } from "lucide-react";
import { SetRow } from "./SetRow";
import { RestTimer, defaultRestSec } from "./RestTimer";
import { cn } from "@/lib/cn";
import type { ExerciseSlot, SetLog } from "@/lib/types";

type ActiveRest = {
  programExerciseId: string;
  durationSec: number;
  startedAt: number;
};

type Props = {
  programExercise: ExerciseSlot;
  sets: Array<Partial<SetLog> | null>;            // length = target_sets
  previous: SetLog[];                              // last session's sets for this exercise
  isSupersetHead?: boolean;                        // top of a superset group
  isSupersetMember?: boolean;                      // belongs to a superset
  activeRest: ActiveRest | null;
  onSetChange: (setIndex: number, patch: Partial<SetLog>) => void;
  onToggleComplete: (setIndex: number, restSec: number) => void;
  onDismissRest: () => void;
  onOpenMenu: () => void;
};

export function ExerciseCard({
  programExercise,
  sets,
  previous,
  isSupersetMember,
  activeRest,
  onSetChange,
  onToggleComplete,
  onDismissRest,
  onOpenMenu,
}: Props) {
  const targetReps =
    programExercise.target_reps_low && programExercise.target_reps_high
      ? `${programExercise.target_reps_low}-${programExercise.target_reps_high}`
      : programExercise.target_reps_low?.toString();
  const targetTime = programExercise.target_time_sec ? `${programExercise.target_time_sec}s` : null;

  const showRest = activeRest && activeRest.programExerciseId === programExercise.id;

  return (
    <section
      className={cn(
        "bg-bg-card rounded-2xl border border-border overflow-hidden",
        isSupersetMember && "border-accent/40",
      )}
    >
      <header className="flex items-center gap-3 px-4 py-3">
        <span
          className={cn(
            "size-7 rounded-full flex items-center justify-center text-xs font-bold text-white",
            isSupersetMember ? "bg-accent" : "bg-accent/80",
          )}
        >
          {programExercise.slot_label}
        </span>
        <h3 className="flex-1 font-semibold text-base leading-tight truncate">
          {programExercise.exercise.name}
        </h3>
        <button
          type="button"
          aria-label="Exercise options"
          onClick={onOpenMenu}
          className="size-9 rounded-full flex items-center justify-center text-fg-muted active:bg-bg-elevated"
        >
          <MoreHorizontal className="size-5" />
        </button>
      </header>

      {/* Target summary row */}
      <div className="px-4 pb-2 flex items-center gap-3 text-xs text-fg-muted">
        <span>{programExercise.target_sets} sets</span>
        {targetTime ? <span>· {targetTime}</span> : targetReps && <span>· {targetReps} reps</span>}
        {programExercise.target_rpe != null && <span>· RPE {programExercise.target_rpe}</span>}
      </div>

      {showRest && (
        <div className="px-3 pb-2">
          <RestTimer
            durationSec={activeRest!.durationSec}
            startedAt={activeRest!.startedAt}
            onDismiss={onDismissRest}
          />
        </div>
      )}

      {/* Column headers */}
      <div
        className={cn(
          "grid items-center gap-2 px-3 py-1 text-[10px] uppercase tracking-wider text-fg-dim font-medium",
          programExercise.show_intensity
            ? "grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem]"
            : "grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem]",
        )}
      >
        <div className="text-center">Set</div>
        <div className="text-center">Prev</div>
        <div className="text-center">{programExercise.target_time_sec ? "Time" : "Load"}</div>
        {!programExercise.target_time_sec && <div className="text-center">Reps</div>}
        {programExercise.show_intensity && <div className="text-center">Intensity</div>}
        <div></div>
      </div>

      <div className="px-2 pb-3 space-y-1">
        {Array.from({ length: programExercise.target_sets }).map((_, i) => (
          <SetRow
            key={i}
            setIndex={i + 1}
            programExercise={programExercise}
            current={sets[i]}
            previous={previous[i] ?? null}
            onChange={(patch) => onSetChange(i + 1, patch)}
            onToggleComplete={() => onToggleComplete(i + 1, defaultRestSec(programExercise.target_rpe))}
          />
        ))}
      </div>
    </section>
  );
}
