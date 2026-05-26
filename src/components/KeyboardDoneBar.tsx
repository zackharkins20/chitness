"use client";

import { useEffect, useState } from "react";

/**
 * Sticky "Done" bar that floats just above the iOS soft keyboard whenever
 * any input with `[data-chitness-num]` is focused. Uses VisualViewport
 * so it tracks the keyboard precisely (position: fixed alone gets hidden
 * behind the iOS keyboard).
 *
 * Render once at app-shell level.
 */
export function KeyboardDoneBar() {
  const [visible, setVisible] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(0);

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.matches?.("[data-chitness-num]")) setVisible(true);
    };
    const onFocusOut = (e: FocusEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.matches?.("[data-chitness-num]")) {
        // Delay so tapping the Done button doesn't blur first
        setTimeout(() => {
          const active = document.activeElement as HTMLElement | null;
          if (!active?.matches?.("[data-chitness-num]")) setVisible(false);
        }, 50);
      }
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    const vv = window.visualViewport;
    if (!vv) return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };

    const updateOffset = () => {
      // Distance from bottom of layout viewport to bottom of visible viewport.
      // When the keyboard is open this equals the keyboard height.
      const offset = window.innerHeight - vv.height - vv.offsetTop;
      setBottomOffset(Math.max(0, offset));
    };
    updateOffset();
    vv.addEventListener("resize", updateOffset);
    vv.addEventListener("scroll", updateOffset);

    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      vv.removeEventListener("resize", updateOffset);
      vv.removeEventListener("scroll", updateOffset);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 z-50 bg-bg-elevated/95 backdrop-blur border-t border-border flex justify-end px-3 py-2"
      style={{ bottom: bottomOffset }}
    >
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}   // prevent focus loss before click fires
        onClick={() => (document.activeElement as HTMLElement | null)?.blur()}
        className="px-5 h-9 rounded-lg bg-accent text-white font-semibold text-sm active:bg-accent-hover"
      >
        Done
      </button>
    </div>
  );
}
