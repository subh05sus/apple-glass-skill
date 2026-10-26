// apple-glass kit: copied verbatim from sparkmentor/frontend/components/bottom-nav/compose-shine.tsx on 2026-10-06. The live file wins; re-copy it when it changes.
"use client";

import { motion, useAnimate, useReducedMotion } from "motion/react";
import type * as React from "react";
import { useEffect } from "react";

/**
 * The + button's "catch the light" moment: the glass squishes like a droplet
 * and springs back, a band of light sweeps across it, then a bloom expands
 * from the centre with a faint rainbow fringe -- light refracting through
 * the pane, the same colour split the glass lens has at its rim.
 *
 * Driven by `signal`: every change replays it once (0 = never played, so
 * nothing runs on mount). Reduced motion: nothing plays.
 *
 * `ShineWobble` wraps the glass pane (it owns the squish); `ShineLight`
 * goes inside the pane, over its content, clipped to its circle.
 */

export function ShineWobble({
  signal,
  children,
  className,
}: {
  signal: number;
  children: React.ReactNode;
  className?: string;
}) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!signal || reduceMotion || !scope.current) return;
    // Droplet: wide-and-short, then tall-and-narrow, settling. Volume is
    // roughly kept (x up when y down), which is what makes it read liquid.
    animate(
      scope.current,
      {
        scaleX: [1, 1.14, 0.94, 1.04, 0.99, 1],
        scaleY: [1, 0.88, 1.07, 0.97, 1.01, 1],
      },
      { duration: 0.7, ease: "easeOut" },
    );
  }, [signal, reduceMotion, animate, scope]);

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}

const RAINBOW =
  "conic-gradient(from 200deg, rgb(255 110 199 / 0.9), rgb(122 252 255 / 0.9), rgb(254 255 156 / 0.9), rgb(180 140 255 / 0.9), rgb(255 110 199 / 0.9))";
// A thin ring: transparent inside and out, opaque between 58% and 72%.
const RING_MASK =
  "radial-gradient(circle, transparent 56%, #000 61%, #000 69%, transparent 74%)";

export function ShineLight({ signal }: { signal: number }) {
  const reduceMotion = useReducedMotion();
  if (!signal || reduceMotion) return null;

  return (
    <span
      // Keyed by the signal: a remount replays every layer from the start.
      key={signal}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
    >
      {/* 1. Shine sweep: a skewed band of light crossing top-left to right. */}
      <motion.span
        className="absolute -inset-y-3 left-0 w-1/2 -skew-x-[22deg] mix-blend-screen"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgb(255 255 255 / 0.85), transparent)",
        }}
        initial={{ x: "-160%" }}
        animate={{ x: "260%" }}
        transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
      />
      {/* 2. Bloom: soft white light swelling out from the centre. */}
      <motion.span
        className="absolute inset-0 rounded-full mix-blend-screen"
        style={{
          background:
            "radial-gradient(circle, rgb(255 255 255 / 0.7) 0%, rgb(255 255 255 / 0.25) 35%, transparent 62%)",
        }}
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: [0.3, 1.25], opacity: [0, 0.9, 0] }}
        transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
      />
      {/* 3. Refraction fringe: a faint rainbow ring riding the bloom out. */}
      <motion.span
        className="absolute inset-0 rounded-full mix-blend-screen"
        style={{
          background: RAINBOW,
          WebkitMask: RING_MASK,
          mask: RING_MASK,
        }}
        initial={{ scale: 0.55, opacity: 0, rotate: 0 }}
        animate={{ scale: [0.55, 1.3], opacity: [0, 0.55, 0], rotate: 40 }}
        transition={{ duration: 0.8, delay: 0.38, ease: "easeOut" }}
      />
    </span>
  );
}
