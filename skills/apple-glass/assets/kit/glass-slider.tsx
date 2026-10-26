// apple-glass kit: copied verbatim from sparkmentor/frontend/components/landing/ui/glass-slider.tsx on 2026-10-06. The live file wins; re-copy it when it changes.
"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import * as React from "react";
import { GlassSurface } from "@/components/ui/glass";
import { cn } from "@/lib/utils";

/**
 * An iOS 26 slider with a Liquid Glass thumb.
 *
 * At rest the thumb is a solid white capsule. Grab it and it swells into a
 * clear pane of glass -- the white fades away, so the moss fill and the track
 * bend through it (real refraction where the browser supports it) -- with the
 * value floating above in a solid bubble. That is the HIG's one allowance for
 * glass in the content layer: a control, while it is being used.
 *
 * Snaps to `step` with a light haptic tick per step on touch. A real slider
 * for assistive tech: role="slider", aria-value*, arrows / PageUp / PageDown /
 * Home / End. Reduced motion: no swell or spring travel.
 */
interface GlassSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  /** id of the element that labels it. */
  labelledBy?: string;
  /** Screen-reader and bubble text for a value, e.g. "6 hours". */
  format?: (value: number) => string;
  /**
   * `dark` (default) is tuned for the dark landing page: pale track, moss
   * fill. `app` follows the app theme: a foreground-tinted track and the
   * primary colour as the fill.
   */
  tone?: "dark" | "app";
  className?: string;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

export function GlassSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
  labelledBy,
  format = (v) => String(v),
  tone = "dark",
  className,
}: GlassSliderProps) {
  const app = tone === "app";
  const reduce = useReducedMotion();
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const lastRef = React.useRef(value);

  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  // Position as a motion value: follows the finger 1:1 while dragging,
  // springs when the value changes by keyboard or a tap on the track.
  const pos = useMotionValue(pct(value));
  const left = useTransform(pos, (p) => `${p}%`);

  React.useEffect(() => {
    if (dragging) return;
    const target = ((value - min) / (max - min)) * 100;
    if (reduce) {
      pos.set(target);
      return;
    }
    const controls = animate(pos, target, {
      type: "spring",
      stiffness: 520,
      damping: 38,
    });
    return () => controls.stop();
  }, [value, dragging, reduce, pos, min, max]);

  const valueAt = (clientX: number) => {
    const track = trackRef.current;
    if (!track) return value;
    const rect = track.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    const raw = min + ratio * (max - min);
    return clamp(Math.round((raw - min) / step) * step + min, min, max);
  };

  const commit = (next: number) => {
    if (next === lastRef.current) return;
    lastRef.current = next;
    navigator.vibrate?.(4);
    onChange(next);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    const track = trackRef.current;
    if (track) {
      const rect = track.getBoundingClientRect();
      pos.set(clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100));
    }
    commit(valueAt(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const track = trackRef.current;
    if (track) {
      const rect = track.getBoundingClientRect();
      // The thumb tracks the finger smoothly; the value snaps underneath.
      pos.set(clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100));
    }
    commit(valueAt(e.clientX));
  };
  const endDrag = () => {
    if (!dragging) return;
    setDragging(false); // the effect springs the thumb onto the snapped step
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const big = Math.max(step, Math.round((max - min) / 10 / step) * step);
    const map: Record<string, number> = {
      ArrowRight: value + step,
      ArrowUp: value + step,
      ArrowLeft: value - step,
      ArrowDown: value - step,
      PageUp: value + big,
      PageDown: value - big,
      Home: min,
      End: max,
    };
    if (!(e.key in map)) return;
    e.preventDefault();
    commit(clamp(map[e.key], min, max));
  };

  const steps = Math.round((max - min) / step);

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-labelledby={labelledBy}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={format(value)}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={cn(
        "group relative flex h-10 cursor-pointer touch-none select-none items-center outline-none",
        className,
      )}
    >
      {/* Track + moss fill. */}
      <div
        ref={trackRef}
        className={cn(
          "relative h-1.5 w-full rounded-full",
          app ? "bg-foreground/10" : "bg-white/12",
        )}
      >
        <motion.div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full bg-linear-to-r",
            app ? "from-primary/70 to-primary" : "from-moss-600 to-lime-300",
          )}
          style={{ width: left }}
        />
        {/* Step ticks, when there are few enough to read. */}
        {steps <= 12 &&
          Array.from({ length: steps + 1 }, (_, i) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed ticks
              key={i}
              aria-hidden
              className={cn(
                "absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full",
                app ? "bg-foreground/20" : "bg-white/25",
              )}
              style={{ left: `${(i / steps) * 100}%` }}
            />
          ))}
      </div>

      {/* Thumb. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ left }}
      >
        {/* The value, floating above while held. Solid: it is text. */}
        <AnimatePresence>
          {dragging && (
            <motion.span
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 520, damping: 30 }}
              className="absolute bottom-full left-1/2 mb-4 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2.5 py-1 font-mono font-semibold text-[11px] text-neutral-900 shadow-lg"
            >
              {format(value)}
            </motion.span>
          )}
        </AnimatePresence>

        <motion.div
          animate={
            reduce
              ? undefined
              : dragging
                ? { scaleX: 1.55, scaleY: 1.3 }
                : { scaleX: 1, scaleY: 1 }
          }
          transition={{ type: "spring", stiffness: 480, damping: 26 }}
          className="relative h-6 w-10"
        >
          <GlassSurface
            variant="clear"
            radius={12}
            className="liquid-bead size-full rounded-full shadow-[0_4px_14px_-4px_rgb(0_0_0/0.45)]"
          >
            {/* The resting white face; fades away to reveal the glass. */}
            <motion.span
              className="absolute inset-0 rounded-full bg-white"
              initial={false}
              animate={{ opacity: dragging ? 0 : 1 }}
              transition={{ duration: reduce ? 0 : 0.18 }}
            />
          </GlassSurface>
        </motion.div>
      </motion.div>

      {/* Keyboard focus ring around the thumb's lane. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -inset-x-2 inset-y-0 rounded-full group-focus-visible:ring-2",
          app ? "ring-primary/50" : "ring-moss-400/60",
        )}
      />
    </div>
  );
}
