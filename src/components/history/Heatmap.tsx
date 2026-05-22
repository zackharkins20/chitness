"use client";

import { cn } from "@/lib/cn";

type Props = {
  workoutDates: string[];      // yyyy-mm-dd
  weeks?: number;
};

export function Heatmap({ workoutDates, weeks = 12 }: Props) {
  const set = new Set(workoutDates);

  // Build a grid: columns = weeks, rows = 7 days (Sun..Sat)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find the Saturday of the current week to anchor the last column
  const endOfWeek = new Date(today);
  const dow = today.getDay(); // 0..6 (Sun..Sat)
  endOfWeek.setDate(today.getDate() + (6 - dow));

  const days: Array<{ date: string; trained: boolean; isFuture: boolean }> = [];
  const totalDays = weeks * 7;
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(endOfWeek);
    d.setDate(endOfWeek.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, trained: set.has(key), isFuture: d > today });
  }

  return (
    <div className="grid grid-flow-col grid-rows-7 gap-1">
      {days.map((d) => (
        <div
          key={d.date}
          title={d.date}
          className={cn(
            "size-3.5 rounded-sm",
            d.isFuture
              ? "bg-bg-elevated/40"
              : d.trained
              ? "bg-accent"
              : "bg-bg-elevated",
          )}
        />
      ))}
    </div>
  );
}
