"use client";

import { useEffect, useState } from "react";

export function WorkoutDuration({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsedSec = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const h = Math.floor(elapsedSec / 3600);
  const m = Math.floor((elapsedSec % 3600) / 60).toString().padStart(h > 0 ? 2 : 1, "0");
  const s = (elapsedSec % 60).toString().padStart(2, "0");
  return (
    <span className="font-mono tabular-nums text-sm text-fg-muted">
      {h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`}
    </span>
  );
}
