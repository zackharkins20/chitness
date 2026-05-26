"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MoreVertical, Trash2, Settings as SettingsIcon } from "lucide-react";

type Props = {
  onDiscard: () => void | Promise<void>;
};

export function SessionMenu({ onDiscard }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleDiscard() {
    setOpen(false);
    if (!confirm("Discard this workout? All sets you've logged will be deleted.")) return;
    await onDiscard();
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label="Workout options"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="size-9 rounded-full flex items-center justify-center text-fg-muted active:bg-bg-elevated"
      >
        <MoreVertical className="size-5" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-30 w-56 rounded-xl bg-bg-card border border-border shadow-lg overflow-hidden"
        >
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 h-11 text-sm font-medium active:bg-bg-elevated"
          >
            <SettingsIcon className="size-4 text-fg-muted" />
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleDiscard}
            className="w-full flex items-center gap-3 px-4 h-11 text-sm font-medium text-danger active:bg-danger/10"
          >
            <Trash2 className="size-4" />
            Discard workout
          </button>
        </div>
      )}
    </div>
  );
}
