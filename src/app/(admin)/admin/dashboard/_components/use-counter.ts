"use client";

import { useEffect, useState } from "react";

/**
 * Animated counter hook — eases from 0 to `end` over `duration` ms.
 * Uses cubic ease-out for a smooth deceleration feel.
 */
export function useCounter(end: number, duration = 1200): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (end === 0) {
      setCount(0);
      return;
    }

    let raf: number;
    const startTime = performance.now();

    function update(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress < 1) {
        raf = requestAnimationFrame(update);
      }
    }

    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [end, duration]);

  return count;
}
