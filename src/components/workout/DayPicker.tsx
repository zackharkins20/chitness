"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/cn";

type Props = {
  days: { id: string; day_order: number; name: string }[];
  activeDayOrder: number;
  hasLoggedSets: boolean;
};

export function DayPicker({ days, activeDayOrder, hasLoggedSets }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(dayOrder: number) {
    if (dayOrder === activeDayOrder) return;
    if (
      hasLoggedSets &&
      !confirm("Switch days? Your current in-progress workout will be discarded.")
    ) {
      return;
    }
    startTransition(() => {
      router.push(`/today?day=${dayOrder}`);
    });
  }

  return (
    <div
      className="flex gap-1 p-1 rounded-xl bg-bg-card border border-border"
      role="tablist"
      aria-label="Workout day"
    >
      {days.map((d) => {
        const active = d.day_order === activeDayOrder;
        return (
          <button
            key={d.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => switchTo(d.day_order)}
            disabled={pending}
            className={cn(
              "flex-1 h-9 rounded-lg text-xs font-semibold transition-colors active:scale-95",
              active ? "bg-accent text-white" : "text-fg-muted active:bg-bg-elevated",
            )}
          >
            Day {d.day_order}
          </button>
        );
      })}
    </div>
  );
}
