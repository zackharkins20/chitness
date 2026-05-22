"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Minus, X } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  durationSec: number;
  startedAt: number;            // Date.now() when timer began
  onDismiss: () => void;
};

export function RestTimer({ durationSec, startedAt, onDismiss }: Props) {
  const [remaining, setRemaining] = useState(durationSec);
  const [extraSec, setExtraSec] = useState(0);
  const buzzed = useRef(false);

  useEffect(() => {
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const r = durationSec + extraSec - elapsed;
      setRemaining(r);
      if (r <= 0 && !buzzed.current) {
        buzzed.current = true;
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate?.([200, 80, 200]);
        }
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [startedAt, durationSec, extraSec]);

  const done = remaining <= 0;
  const displayMin = Math.max(0, Math.floor(Math.abs(remaining) / 60));
  const displaySec = Math.max(0, Math.abs(remaining) % 60).toString().padStart(2, "0");

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg border",
        done
          ? "bg-success/15 border-success/40 text-success"
          : "bg-accent/10 border-accent/30 text-accent",
      )}
    >
      <button
        type="button"
        aria-label="Subtract 15 seconds"
        onClick={() => setExtraSec((s) => s - 15)}
        className="size-8 rounded-md bg-bg-elevated/60 flex items-center justify-center active:scale-90"
      >
        <Minus className="size-4" />
      </button>
      <div className="flex-1 text-center font-mono font-semibold tabular-nums text-lg">
        {done ? "Ready" : `${displayMin}:${displaySec}`}
      </div>
      <button
        type="button"
        aria-label="Add 15 seconds"
        onClick={() => setExtraSec((s) => s + 15)}
        className="size-8 rounded-md bg-bg-elevated/60 flex items-center justify-center active:scale-90"
      >
        <Plus className="size-4" />
      </button>
      <button
        type="button"
        aria-label="Dismiss rest timer"
        onClick={onDismiss}
        className="size-8 rounded-md bg-bg-elevated/60 flex items-center justify-center active:scale-90"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

/** Default rest based on target RPE — heavier sets get longer rest. */
export function defaultRestSec(rpe: number | null): number {
  if (rpe == null) return 60;
  if (rpe >= 9) return 180;
  if (rpe >= 8) return 120;
  if (rpe >= 7) return 90;
  return 60;
}
