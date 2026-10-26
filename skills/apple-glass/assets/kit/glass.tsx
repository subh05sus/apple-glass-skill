// apple-glass kit: based on sparkmentor/frontend/components/ui/glass.tsx (2026-10-06). The lens was rebuilt on 2026-10-26 (liquid-lens.js: Snell refraction, a fold-free rim and a specular rim map) and is newer than SparkMentor's copy.
"use client";

import { motion } from "motion/react";
import * as React from "react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useGlassChoice, useGlassMode } from "@/lib/glass-preference";
import { lensFor, supportsBackdropRefraction } from "@/lib/liquid-lens";
import { PRESS_SCALE_ICON, SPRING_SNAPPY } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * A Liquid Glass surface: the regular variant from Apple's HIG (blur plus a
 * luminosity shift -- lighter in light mode, darker in dark mode -- so labels
 * stay legible), with real edge refraction where the browser can do it.
 *
 * Layers, bottom to top:
 *   1. backdrop-filter -- the content behind: saturated, luminosity-shifted,
 *      then bent at the rim by the lens (or frosted, without it).
 *   2. a translucent fill (`.liquid-glass` background, `--glass-tint`).
 *   3. ::before -- a faint glow pooled under the top edge.
 *   4. ::after  -- a 1px specular hairline lit from above: brightest along
 *      the top, fading down the sides (never a uniform ring).
 *   5. the bevel (`--glass-rim`, inset shadows): light along the curved edge.
 *   6. children.
 *
 * The lens (liquid-lens.js) is what makes it Liquid Glass rather than
 * frosted plastic: the rim is a convex edge that refracts by Snell's law,
 * so the content behind bends and magnifies toward the edge while the face
 * stays flat and clear, and the edge catches the light as a specular line.
 * The maps are generated for this element's exact size and corner radius.
 * Only Chromium applies an SVG filter inside `backdrop-filter`; Safari
 * (including every iOS browser) and Firefox keep the frosted layers and the
 * bevel without the bend, which is why the frosted look has to stand on its
 * own.
 *
 * The Surface style setting (lib/glass-preference.ts) picks the material:
 * Clear (this, with the lens), Soft (frosted and more opaque, no lens) or
 * Solid (an opaque surface). Reduce Transparency gets Soft until a style is
 * picked, browsers without backdrop-filter get Solid, and Increase Contrast
 * swaps in a solid outlined surface (see `.liquid-glass` in globals.css).
 *
 * The design system, in short (Apple HIG, Materials):
 *   - Glass is for the functional layer only -- navigation and floating
 *     controls: the chat composer and header buttons, Jump to latest, the
 *     Ask bar, the tab bar, floating action bars, segmented controls. Never
 *     cards, panels, lists or backgrounds: the content layer is solid.
 *   - `regular` wherever there is text or the backdrop could fight legibility.
 *     `clear` only over rich media (the tutor's video), with a dim behind it.
 *   - Refraction is for a handful of hero controls.
 *   - Menus, popovers, dialogs and drawers are NOT glass: they hold text over
 *     busy content, so they use the solid `.surface-menu` / `.surface-sheet`
 *     (globals.css) with the same Apple shape.
 *   - Neutral by default. Colour is reserved for meaning (the red end-call).
 */

export type GlassVariant = "regular" | "clear";

interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassVariant;
  /** Real edge refraction where supported. Off: frosted layers only. */
  refract?: boolean;
  /** Corner radius in px. Omit for a capsule/circle (half the short side). */
  radius?: number;
  /**
   * Width of the curved rim, in px. Default: 42% of the short side (48% for
   * clear glass).
   */
  bezel?: number;
  /** Largest push at the rim, in px. Default: scales with the bezel. */
  depth?: number;
  /** Frost before the bend, in px. Default 2 (0.6 for clear glass). */
  blur?: number;
  /**
   * Colour fringe at the rim (0 = none). Each channel bends a little more.
   * Default 0.06 (0.07 for clear glass).
   */
  chroma?: number;
  /** Strength of the specular rim, 0 to 1. */
  specular?: number;
}

export function GlassSurface({
  variant = "regular",
  refract: refractProp = true,
  radius,
  bezel,
  depth,
  blur,
  chroma,
  specular,
  className,
  style,
  children,
  ...rest
}: GlassSurfaceProps) {
  const ref = useRef<HTMLDivElement>(null);
  const baseId = useId().replace(/:/g, "");
  const [refract, setRefract] = useState(false);
  const [lens, setLens] = useState<{
    w: number;
    h: number;
    markup: string;
    backdrop: string;
  } | null>(null);

  const glassMode = useGlassMode();
  const glassChoice = useGlassChoice();
  // The glass slider's thumb (`.liquid-bead`) keeps its frozen CSS look
  // (globals.css) and keeps the lens unless a surface style says otherwise,
  // as before Reduce Transparency was honoured.
  const frozen = /(^|\s)liquid-bead(\s|$)/.test(className ?? "");
  const lensMode = frozen ? (glassChoice ?? "on") : glassMode;
  useEffect(() => {
    setRefract(
      refractProp && lensMode === "on" && supportsBackdropRefraction(),
    );
  }, [refractProp, lensMode]);

  // Regenerate only when the shape changes. The first lens is built right
  // away; while the shape is still changing (the tab bar's collapse) the old
  // maps keep stretching to fit, and new ones are built once the size has
  // settled -- building them every frame (a per-pixel canvas plus a data-URL
  // encode) made that transition stutter on Android. Position changes never
  // touch the maps.
  useLayoutEffect(() => {
    if (!refract || !ref.current) return;
    const el = ref.current;
    let frame = 0;
    let settle = 0;
    let built = false;
    let version = 0;
    const update = () => {
      if (built) {
        window.clearTimeout(settle);
        settle = window.setTimeout(build, 160);
        return;
      }
      build();
    };
    const build = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        built = true;
        setLens((prev) => {
          const w = Math.round(el.offsetWidth);
          const h = Math.round(el.offsetHeight);
          if (prev && prev.w === w && prev.h === h) return prev;
          // A fresh id per map: some engines cache a filter's output by id
          // and keep painting the old one after the map changes.
          const next = lensFor(el, `glass-${baseId}-${++version}`, {
            variant,
            radius,
            bezel,
            depth,
            frost: blur,
            chroma,
            specular,
          });
          return next ?? prev;
        });
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      observer.disconnect();
    };
  }, [refract, variant, radius, bezel, depth, blur, chroma, specular, baseId]);

  const on = refract && lens;
  const refractStyle: React.CSSProperties | undefined = on
    ? { backdropFilter: lens.backdrop, WebkitBackdropFilter: lens.backdrop }
    : undefined;

  return (
    <div
      ref={ref}
      className={cn(
        "liquid-glass",
        variant === "clear" && "liquid-glass-clear",
        className,
      )}
      style={{ ...style, ...refractStyle }}
      {...rest}
    >
      {on && (
        // biome-ignore lint/a11y/noSvgWithoutTitle: filter definitions only; nothing is drawn
        <svg
          aria-hidden
          width="0"
          height="0"
          className="pointer-events-none absolute"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: markup built locally from numbers and data URLs
          dangerouslySetInnerHTML={{ __html: lens.markup }}
        />
      )}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  GlassButton                                                        */
/* ------------------------------------------------------------------ */

const BUTTON_SIZES = {
  sm: "size-9", // 36px: dense desktop toolbars
  toolbar: "size-10 md:size-9", // chat header: six fit a 360px phone
  md: "size-11", // 44px: the HIG minimum tap target -- mobile headers
  lg: "size-[60px]", // call controls
} as const;

const ICON_SIZES = {
  sm: "[&_svg]:size-4",
  toolbar: "[&_svg]:size-[18px] md:[&_svg]:size-4",
  md: "[&_svg]:size-[20px]",
  lg: "[&_svg]:size-6",
} as const;

export interface GlassButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
  > {
  size?: keyof typeof BUTTON_SIZES;
  variant?: GlassVariant;
  /** `active`: a toggled-on control (denser lens). `destructive`: end call. */
  tone?: "default" | "active" | "destructive";
  refract?: boolean;
  /** Accessible name. Icon-only buttons must have one. */
  label: string;
}

/**
 * A round pane of glass holding one icon -- the building block for iOS-26
 * style toolbars and call controls. Presses scale down on a spring; the icon
 * stays neutral unless the tone says otherwise.
 */
export const GlassButton = React.forwardRef<
  HTMLButtonElement,
  GlassButtonProps
>(function GlassButton(
  {
    size = "md",
    variant = "regular",
    tone = "default",
    refract,
    label,
    className,
    children,
    disabled,
    ...props
  },
  ref,
) {
  return (
    <GlassSurface
      variant={variant}
      refract={refract ?? size !== "sm"}
      className={cn(
        "shrink-0 rounded-full",
        BUTTON_SIZES[size],
        tone === "destructive" && "liquid-glass-destructive",
        disabled && "opacity-50",
        className,
      )}
    >
      {tone === "active" && (
        <span
          aria-hidden
          className="liquid-lens absolute inset-1 rounded-full"
        />
      )}
      <motion.button
        ref={ref}
        type="button"
        aria-label={label}
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: PRESS_SCALE_ICON }}
        transition={SPRING_SNAPPY}
        className={cn(
          "relative flex size-full items-center justify-center rounded-full outline-none",
          "focus-visible:ring-2 focus-visible:ring-foreground/40",
          "disabled:pointer-events-none",
          ICON_SIZES[size],
          tone === "destructive"
            ? "text-white"
            : variant === "clear"
              ? "text-white"
              : "text-foreground",
        )}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {children}
      </motion.button>
    </GlassSurface>
  );
});
