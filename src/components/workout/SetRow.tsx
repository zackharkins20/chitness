"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ExerciseSlot, SetLog } from "@/lib/types";

type Props = {
  setIndex: number;
  programExercise: ExerciseSlot;
  current: Partial<SetLog> | null;
  previous: SetLog | null;
  onChange: (patch: Partial<SetLog>) => void;
  onToggleComplete: () => void;
};

export function SetRow({ setIndex, programExercise, current, previous, onChange, onToggleComplete }: Props) {
  const completed = !!current?.completed_at;
  const isTimeBased = programExercise.target_time_sec != null;

  const targetReps = programExercise.target_reps_low && programExercise.target_reps_high
    ? `${programExercise.target_reps_low}-${programExercise.target_reps_high}`
    : programExercise.target_reps_low?.toString() ?? "";

  const previousDisplay = previous
    ? isTimeBased
      ? `${previous.time_sec ?? "-"}s`
      : `${previous.load ?? "-"} × ${previous.reps ?? "-"}`
    : "";

  return (
    <div
      className={cn(
        "grid items-center gap-2 px-3 py-2 rounded-lg transition-colors",
        programExercise.show_intensity
          ? "grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem]"
          : "grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem]",
        completed && "bg-success/10",
      )}
    >
      <div className="text-fg-muted text-sm font-semibold text-center">{setIndex}</div>

      <div className="text-fg-dim text-xs text-center truncate" title={previousDisplay}>
        {previousDisplay || "—"}
      </div>

      {isTimeBased ? (
        <NumberCell
          value={current?.time_sec ?? null}
          placeholder={`${programExercise.target_time_sec ?? ""}s`}
          onChange={(v) => onChange({ time_sec: v })}
          disabled={completed}
        />
      ) : (
        <NumberCell
          value={current?.load ?? null}
          placeholder={previous?.load?.toString() ?? "kg"}
          onChange={(v) => onChange({ load: v })}
          step={2.5}
          disabled={completed}
        />
      )}

      {!isTimeBased && (
        <NumberCell
          value={current?.reps ?? null}
          placeholder={previous?.reps?.toString() ?? targetReps}
          onChange={(v) => onChange({ reps: v != null ? Math.round(v) : null })}
          disabled={completed}
        />
      )}

      {programExercise.show_intensity && (
        <TextCell
          value={current?.intensity ?? ""}
          placeholder="—"
          onChange={(v) => onChange({ intensity: v || null })}
          disabled={completed}
        />
      )}

      <button
        type="button"
        aria-label={completed ? "Mark set incomplete" : "Mark set complete"}
        onClick={onToggleComplete}
        className={cn(
          "size-10 rounded-lg flex items-center justify-center transition-all active:scale-90",
          completed
            ? "bg-success text-white"
            : "bg-bg-elevated border border-border text-fg-dim",
        )}
      >
        <Check className={cn("size-5", !completed && "opacity-40")} strokeWidth={3} />
      </button>
    </div>
  );
}

function NumberCell({
  value,
  placeholder,
  onChange,
  disabled,
  step = 1,
}: {
  value: number | null;
  placeholder: string;
  onChange: (v: number | null) => void;
  disabled?: boolean;
  step?: number;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      placeholder={placeholder}
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => {
        const raw = e.target.value;
        onChange(raw === "" ? null : Number(raw));
      }}
      className={cn(
        "w-full text-center h-9 rounded-md bg-bg-elevated border border-transparent text-fg text-base font-semibold",
        "placeholder:text-fg-dim placeholder:font-normal",
        "focus:outline-none focus:border-accent focus:bg-bg-card",
        "disabled:opacity-100 disabled:bg-transparent disabled:text-fg",
      )}
    />
  );
}

function TextCell({
  value,
  placeholder,
  onChange,
  disabled,
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full text-center h-9 rounded-md bg-bg-elevated border border-transparent text-fg text-sm font-medium",
        "placeholder:text-fg-dim",
        "focus:outline-none focus:border-accent focus:bg-bg-card",
        "disabled:opacity-100 disabled:bg-transparent",
      )}
    />
  );
}
