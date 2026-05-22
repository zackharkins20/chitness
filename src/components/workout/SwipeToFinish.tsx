"use client";

import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useRef, useState } from "react";
import { ChevronsRight } from "lucide-react";

type Props = {
  onFinish: () => void | Promise<void>;
};

export function SwipeToFinish({ onFinish }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [finishing, setFinishing] = useState(false);

  // Visual: text fades as the knob travels
  const textOpacity = useTransform(x, [0, 100], [1, 0]);

  async function handleEnd() {
    const track = trackRef.current;
    if (!track || finishing) return;
    const maxX = track.offsetWidth - 64;        // 64 = knob width
    if (x.get() >= maxX * 0.8) {
      setFinishing(true);
      animate(x, maxX, { type: "spring", stiffness: 300, damping: 30 });
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate?.(40);
      }
      await onFinish();
    } else {
      animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  }

  return (
    <div
      ref={trackRef}
      className="relative h-16 rounded-2xl bg-accent/10 border border-accent/30 overflow-hidden select-none"
    >
      <motion.div
        className="absolute inset-0 flex items-center justify-center text-accent font-semibold"
        style={{ opacity: textOpacity }}
      >
        Swipe to complete workout
      </motion.div>
      <motion.button
        type="button"
        aria-label="Swipe to complete workout"
        drag="x"
        dragConstraints={trackRef}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={handleEnd}
        style={{ x }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-1 left-1 bottom-1 w-16 rounded-xl bg-accent text-white flex items-center justify-center shadow-lg touch-none"
      >
        <ChevronsRight className="size-6" />
      </motion.button>
    </div>
  );
}
