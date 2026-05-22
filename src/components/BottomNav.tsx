"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Calendar, LineChart, Dumbbell } from "lucide-react";
import { cn } from "@/lib/cn";

const tabs = [
  { href: "/today", label: "Today", icon: Calendar },
  { href: "/history", label: "History", icon: LineChart },
  { href: "/program", label: "Program", icon: Dumbbell },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  // Optimistic "tapped" tab — gives instant feedback while the route loads.
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-bg-elevated/95 backdrop-blur border-t border-border pb-safe">
      <ul className="flex justify-around max-w-md mx-auto px-2 pt-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            pendingHref === href ||
            (pendingHref === null && (pathname === href || pathname.startsWith(href + "/")));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                prefetch
                onClick={(e) => {
                  if (pathname === href) return;
                  e.preventDefault();
                  setPendingHref(href);
                  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
                    navigator.vibrate?.(8);
                  }
                  startTransition(() => {
                    router.push(href);
                  });
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg",
                  "active:bg-bg-card touch-manipulation select-none",
                  active ? "text-accent" : "text-fg-dim",
                )}
              >
                <Icon className="size-6" strokeWidth={active ? 2.5 : 2} />
                <span className={cn("text-[11px] font-medium", active && "font-semibold")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
