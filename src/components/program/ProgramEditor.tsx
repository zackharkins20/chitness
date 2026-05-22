"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Save } from "lucide-react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import type { DayWithExercises, ExerciseSlot } from "@/lib/types";

type Props = {
  days: DayWithExercises[];
};

export function ProgramEditor({ days }: Props) {
  return (
    <div className="space-y-4">
      {days.map((day) => (
        <DayBlock key={day.id} day={day} />
      ))}
    </div>
  );
}

function DayBlock({ day }: { day: DayWithExercises }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="rounded-2xl bg-bg-card border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 active:bg-bg-elevated"
      >
        <h2 className="font-semibold">{day.name}</h2>
        <ChevronDown className={cn("size-5 text-fg-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-border divide-y divide-border">
          {day.exercises.map((ex) => (
            <ExerciseEditor key={ex.id} exercise={ex} />
          ))}
        </div>
      )}
    </section>
  );
}

function ExerciseEditor({ exercise }: { exercise: ExerciseSlot }) {
  const [open, setOpen] = useState(false);
  const [sets, setSets] = useState(exercise.target_sets);
  const [repsLow, setRepsLow] = useState(exercise.target_reps_low ?? "");
  const [repsHigh, setRepsHigh] = useState(exercise.target_reps_high ?? "");
  const [rpe, setRpe] = useState(exercise.target_rpe ?? "");
  const [notes, setNotes] = useState(exercise.exercise.notes ?? "");
  const [saving, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const targetReps =
    exercise.target_reps_low && exercise.target_reps_high
      ? `${exercise.target_reps_low}-${exercise.target_reps_high}`
      : exercise.target_reps_low ?? "";

  function save() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.from("program_exercises").update({
        target_sets: Number(sets),
        target_reps_low: repsLow === "" ? null : Number(repsLow),
        target_reps_high: repsHigh === "" ? null : Number(repsHigh),
        target_rpe: rpe === "" ? null : Number(rpe),
      }).eq("id", exercise.id);
      if (notes !== (exercise.exercise.notes ?? "")) {
        await supabase.from("exercises").update({ notes: notes || null }).eq("id", exercise.exercise.id);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 active:bg-bg-elevated"
      >
        <span className="size-7 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">
          {exercise.slot_label}
        </span>
        <div className="flex-1 text-left min-w-0">
          <div className="font-medium truncate">{exercise.exercise.name}</div>
          <div className="text-xs text-fg-muted">
            {exercise.target_sets} × {exercise.target_time_sec ? `${exercise.target_time_sec}s` : targetReps}
            {exercise.target_rpe != null ? ` · RPE ${exercise.target_rpe}` : ""}
          </div>
        </div>
        <ChevronDown className={cn("size-4 text-fg-dim transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <Field label="Sets" value={sets} onChange={(v) => setSets(Number(v))} type="number" />
            <Field label="Reps↓" value={repsLow} onChange={(v) => setRepsLow(v as never)} type="number" />
            <Field label="Reps↑" value={repsHigh} onChange={(v) => setRepsHigh(v as never)} type="number" />
            <Field label="RPE" value={rpe} onChange={(v) => setRpe(v as never)} type="number" step="0.5" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-fg-dim font-medium">Notes / form cues</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. neutral spine, drive through heel"
              className="w-full mt-1 rounded-lg bg-bg-elevated border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:border-accent"
            />
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className={cn(
              "w-full h-10 rounded-lg font-semibold text-sm flex items-center justify-center gap-2",
              saved ? "bg-success text-white" : "bg-accent text-white",
            )}
          >
            <Save className="size-4" />
            {saved ? "Saved" : saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", step,
}: {
  label: string;
  value: string | number;
  onChange: (v: string | number) => void;
  type?: string;
  step?: string;
}) {
  return (
    <label className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-fg-dim font-medium">{label}</span>
      <input
        type={type}
        inputMode={type === "number" ? "decimal" : undefined}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 rounded-lg bg-bg-elevated border border-border px-2 text-center text-base font-semibold focus:outline-none focus:border-accent"
      />
    </label>
  );
}
