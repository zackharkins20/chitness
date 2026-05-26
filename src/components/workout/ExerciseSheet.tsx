"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, RotateCcw, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ExerciseSlot } from "@/lib/types";

type Props = {
  open: boolean;
  programExercise: ExerciseSlot;
  onClose: () => void;
  onResetSets: () => void | Promise<void>;
};

export function ExerciseSheet({ open, programExercise, onClose, onResetSets }: Props) {
  const [notes, setNotes] = useState(programExercise.exercise.notes ?? "");
  const [, startTransition] = useTransition();
  const [savedFlash, setSavedFlash] = useState(false);

  const targetReps =
    programExercise.target_reps_low && programExercise.target_reps_high
      ? `${programExercise.target_reps_low}-${programExercise.target_reps_high}`
      : programExercise.target_reps_low?.toString();
  const targetTime = programExercise.target_time_sec ? `${programExercise.target_time_sec}s` : null;

  function saveNotes() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase
        .from("exercises")
        .update({ notes: notes || null })
        .eq("id", programExercise.exercise.id);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1200);
    });
  }

  async function handleReset() {
    if (!confirm(`Clear all logged sets for ${programExercise.exercise.name}?`)) return;
    await onResetSets();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            className="fixed inset-x-0 bottom-0 z-50 bg-bg-card rounded-t-3xl border-t border-border max-h-[80dvh] overflow-hidden flex flex-col pb-safe"
          >
            <div className="mx-auto mt-3 mb-2 h-1 w-10 rounded-full bg-border-strong" />
            <header className="flex items-center gap-3 px-5 pb-2">
              <span className="size-7 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">
                {programExercise.slot_label}
              </span>
              <h2 className="flex-1 font-semibold text-lg leading-tight truncate">
                {programExercise.exercise.name}
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="size-9 rounded-full flex items-center justify-center text-fg-muted active:bg-bg-elevated"
              >
                <X className="size-5" />
              </button>
            </header>

            <div className="px-5 pb-1 flex items-center gap-3 text-xs text-fg-muted">
              <span>{programExercise.target_sets} sets</span>
              {targetTime ? <span>· {targetTime}</span> : targetReps && <span>· {targetReps} reps</span>}
              {programExercise.target_rpe != null && <span>· RPE {programExercise.target_rpe}</span>}
            </div>

            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-5 space-y-4">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-fg-dim font-semibold">
                  Form cues & notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. neutral spine, drive through the heel, pause at the bottom…"
                  rows={5}
                  className="w-full mt-1.5 rounded-xl bg-bg-elevated border border-border p-3 text-sm leading-relaxed resize-none focus:outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={saveNotes}
                  className={`mt-2 w-full h-10 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 ${
                    savedFlash ? "bg-success text-white" : "bg-bg-elevated text-fg active:bg-bg-card"
                  }`}
                >
                  <Save className="size-4" />
                  {savedFlash ? "Saved" : "Save notes"}
                </button>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="w-full h-11 rounded-lg border border-danger/30 bg-danger/10 text-danger font-semibold text-sm flex items-center justify-center gap-2 active:bg-danger/20"
              >
                <RotateCcw className="size-4" />
                Clear all sets for this exercise
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
