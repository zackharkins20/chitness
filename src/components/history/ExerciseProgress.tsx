"use client";

import { useEffect, useState, useTransition } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

type Point = {
  date: string;
  heaviestLoad: number | null;
  topSetVolume: number | null;
  estimated1RM: number | null;
};

type Metric = "estimated1RM" | "heaviestLoad" | "topSetVolume";
const metricLabels: Record<Metric, string> = {
  estimated1RM: "Est. 1RM",
  heaviestLoad: "Heaviest",
  topSetVolume: "Top Volume",
};

export function ExerciseProgress({
  exercises,
}: {
  exercises: Array<{ id: string; name: string }>;
}) {
  const [selected, setSelected] = useState(exercises[0]?.id ?? "");
  const [metric, setMetric] = useState<Metric>("estimated1RM");
  const [points, setPoints] = useState<Point[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!selected) return;
    const supabase = createClient();
    startTransition(async () => {
      // Fetch via a thin client query: only this user's sets, joined on program_exercise.exercise_id
      const { data: peRows } = await supabase
        .from("program_exercises")
        .select("id")
        .eq("exercise_id", selected);
      const peIds = (peRows ?? []).map((r) => r.id);
      if (peIds.length === 0) {
        setPoints([]);
        return;
      }
      const { data: rows } = await supabase
        .from("set_logs")
        .select("load, reps, completed_at")
        .in("program_exercise_id", peIds)
        .not("completed_at", "is", null)
        .order("completed_at");

      const byDate = new Map<string, Point>();
      for (const r of rows ?? []) {
        if (r.load == null || r.reps == null || !r.completed_at) continue;
        const date = r.completed_at.slice(0, 10);
        const e1rm = Math.round(r.load * (1 + r.reps / 30) * 10) / 10;
        const vol = r.load * r.reps;
        const existing = byDate.get(date);
        if (!existing) {
          byDate.set(date, { date, heaviestLoad: r.load, topSetVolume: vol, estimated1RM: e1rm });
        } else {
          if (r.load > (existing.heaviestLoad ?? 0)) existing.heaviestLoad = r.load;
          if (vol > (existing.topSetVolume ?? 0)) existing.topSetVolume = vol;
          if (e1rm > (existing.estimated1RM ?? 0)) existing.estimated1RM = e1rm;
        }
      }
      setPoints(Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date)));
    });
  }, [selected]);

  if (exercises.length === 0) {
    return <p className="text-fg-muted text-sm">No exercises yet.</p>;
  }

  return (
    <div className="rounded-2xl bg-bg-card border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="flex-1 bg-bg-elevated border border-border rounded-lg h-10 px-3 text-sm font-medium"
        >
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-1 mb-3">
        {(Object.keys(metricLabels) as Metric[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMetric(m)}
            className={cn(
              "flex-1 h-8 rounded-md text-xs font-medium transition-colors",
              metric === m
                ? "bg-accent text-white"
                : "bg-bg-elevated text-fg-muted",
            )}
          >
            {metricLabels[m]}
          </button>
        ))}
      </div>

      <div className="h-48">
        {points.length === 0 ? (
          <div className="flex h-full items-center justify-center text-fg-dim text-sm">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#26262d" strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#6b6b75", fontSize: 11 }}
                tickFormatter={(d) => d.slice(5)}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "#6b6b75", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: "#1a1a1f",
                  border: "1px solid #34343d",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey={metric}
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3, fill: "#3b82f6" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
