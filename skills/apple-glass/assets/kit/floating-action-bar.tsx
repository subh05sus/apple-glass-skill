// apple-glass kit: copied verbatim from sparkmentor/frontend/components/ui/floating-action-bar.tsx on 2026-10-06. The live file wins; re-copy it when it changes.
"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import * as React from "react";
import { createPortal } from "react-dom";
import { GlassSurface } from "@/components/ui/glass";
import {
  EASE_EXIT,
  PRESS_SCALE,
  PRESS_SCALE_ICON,
  SPRING_DEFAULT,
  SPRING_SNAPPY,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * An iOS-style floating action bar: the screen's primary actions pinned to
 * the bottom in panes of glass, so the thumb finds them in the same place no
 * matter how tall the content above grows.
 *
 * Fixed to the viewport (above the mobile tab bar, 24px up on desktop) but
 * aligned to the column it is declared in -- it measures its parent -- so on
 * desktop it stays centred over the page, not the window, beside the
 * sidebar. A spacer the bar's height stays in the flow, so the last line of
 * content never ends up underneath it.
 *
 * `barKey` swaps the bar's contents with a short cross-fade (e.g. flashcard
 * "Show answer" -> the three grades -> "Next card").
 *
 * `anchor="composer"` is for bars inside a chat: the bar sits 10px above the
 * floating chat composer on every breakpoint, aligned to the chat area (the
 * nearest `[data-chat-chrome]` element), reads the composer's live height
 * from that element's `--chat-composer-h`, and leaves no spacer in the flow
 * -- the chat composer already reserves the transcript's bottom space.
 *
 * `open` shows and hides the bar with a rise-in and a fade-out. Keep the bar
 * mounted and toggle `open` rather than rendering it conditionally: the
 * portal and its AnimatePresence stay mounted, so the exit can play (a bar
 * that unmounts can only vanish). Mounting it open still animates it in.
 */
/**
 * The element whose box the bar lines up with: the slot's parent, skipping
 * wrappers that have no box of their own (`display: contents`, e.g. the
 * pull-to-refresh layer at rest). Their rect is all zeros, which would pin
 * the bar to the left edge with no width.
 */
function boxedAncestor(start: HTMLElement | null): HTMLElement | null {
  let el = start;
  while (el && el !== document.body) {
    if (getComputedStyle(el).display !== "contents") return el;
    el = el.parentElement;
  }
  return start;
}

export function FloatingActionBar({
  children,
  barKey,
  label,
  anchor = "tabbar",
  open = true,
  className,
}: {
  children: React.ReactNode;
  barKey?: string;
  label: string;
  /** What the bar sits above: the mobile tab bar (default) or a chat composer. */
  anchor?: "tabbar" | "composer";
  /** Shown (default) or hidden, animating either way. */
  open?: boolean;
  className?: string;
}) {
  const slotRef = React.useRef<HTMLDivElement>(null);
  const barRef = React.useRef<HTMLDivElement>(null);
  const [box, setBox] = React.useState<{ left: number; width: number } | null>(
    null,
  );
  const inChat = anchor === "composer";
  // On screen, including while it animates out: the spacer and the published
  // --floating-bar-h follow this, so nothing moves under a bar still leaving.
  const [onScreen, setOnScreen] = React.useState(open);
  const openRef = React.useRef(open);
  React.useLayoutEffect(() => {
    openRef.current = open;
    if (open) setOnScreen(true);
  }, [open]);
  // Composer mode: the chat composer's live height, read off the chat area.
  // The bar is portalled to <body>, so it cannot inherit the CSS variable.
  const [composerH, setComposerH] = React.useState<string>("5rem");
  // On-screen keyboard height. iOS Safari (and Chrome on Android by default)
  // overlays the keyboard on the layout viewport, so a bar pinned to the
  // bottom would sit behind it while you type. The visual viewport shrinks
  // by the keyboard's height; while it is open the bar rides just above it.
  const [keyboard, setKeyboard] = React.useState(0);

  React.useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const covered = window.innerHeight - vv.height - vv.offsetTop;
      // Under ~120px is browser chrome resizing, not a keyboard.
      setKeyboard(covered > 120 ? Math.round(covered) : 0);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  React.useLayoutEffect(() => {
    const slot = slotRef.current;
    const host = inChat
      ? (slot?.closest<HTMLElement>("[data-chat-chrome]") ??
        boxedAncestor(slot?.parentElement ?? null))
      : boxedAncestor(slot?.parentElement ?? null);
    if (!host) return;
    const measure = () => {
      const r = host.getBoundingClientRect();
      setBox((prev) =>
        prev && prev.left === r.left && prev.width === r.width
          ? prev
          : { left: r.left, width: r.width },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    window.addEventListener("resize", measure);

    // The composer publishes its height as an inline style on the chat area;
    // watch that attribute so the bar rides the composer as it grows.
    let styleWatch: MutationObserver | null = null;
    if (inChat) {
      const read = () => {
        const v = host.style.getPropertyValue("--chat-composer-h").trim();
        setComposerH(v || "5rem");
      };
      read();
      styleWatch = new MutationObserver(read);
      styleWatch.observe(host, {
        attributes: true,
        attributeFilter: ["style"],
      });
    }
    return () => {
      observer.disconnect();
      styleWatch?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [inChat]);

  // Publish the bar's height as --floating-bar-h so other fixed buttons (the
  // notes button) can sit above it instead of on top of it. Tab-bar bars
  // only: a chat bar rides the composer, which the notes button already clears.
  React.useEffect(() => {
    const bar = barRef.current;
    if (inChat || !box || !bar || !onScreen) return;
    const root = document.documentElement;
    const publish = () =>
      root.style.setProperty("--floating-bar-h", `${bar.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(bar);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--floating-bar-h");
    };
  }, [inChat, box, onScreen]);

  return (
    <>
      <div
        ref={slotRef}
        aria-hidden
        className={inChat || !onScreen ? "h-0 shrink-0" : "h-20 shrink-0"}
      />
      {box &&
        createPortal(
          <MotionConfig reducedMotion="user">
            <div
              ref={barRef}
              className={cn(
                // Mirrors the tab bar: notch safe area on the outer layer and
                // a 16px margin on the row inside, so on a phone the two
                // floating bars share both edges exactly.
                "pointer-events-none fixed z-[35] flex justify-center pr-safe pl-safe md:px-1",
                // Phone: 8px above the tab bar, computed from the tab bar's
                // own position (its bottom inset + its live height), so when
                // it shrinks on scroll this glides down with it -- same 300ms
                // ease as the tab bar's height. Desktop: 24px up.
                !inChat &&
                  "bottom-[calc(max(env(safe-area-inset-bottom,0px),12px)+var(--tabbar-live-h,62px)+8px)] transition-[bottom] duration-300 ease-out md:bottom-6",
                inChat && "transition-[bottom] duration-200 ease-out",
                className,
              )}
              style={{
                left: box.left,
                width: box.width,
                // Chat: 10px above the floating composer, every breakpoint.
                // Otherwise, keyboard open: 8px above it, over the tab bar
                // (which the keyboard covers anyway); else the class offsets.
                ...(inChat
                  ? { bottom: `calc(${composerH} + 10px)` }
                  : keyboard
                    ? { bottom: keyboard + 8 }
                    : null),
              }}
            >
              {/* Always mounted (once measured), so `open` can animate both
                  ways; `barKey` swaps cross-fade inside it. */}
              <AnimatePresence
                mode="popLayout"
                onExitComplete={() => {
                  if (!openRef.current) setOnScreen(false);
                }}
              >
                {open && (
                  <motion.div
                    key={barKey ?? "bar"}
                    role="toolbar"
                    aria-label={label}
                    initial={{ opacity: 0, y: 12, scale: 0.96 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: SPRING_DEFAULT,
                    }}
                    exit={{
                      opacity: 0,
                      y: 8,
                      scale: 0.96,
                      transition: EASE_EXIT,
                    }}
                    className="pointer-events-auto mx-4 flex w-[calc(100%-2rem)] max-w-md items-center gap-2 md:mx-0 md:w-full"
                  >
                    {children}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </MotionConfig>,
          document.body,
        )}
    </>
  );
}

/**
 * One action in the bar. `shape="circle"` for an icon-only secondary
 * action (skip); `capsule` for a labelled one. `primary` is the screen's
 * main action: a solid foreground fill instead of glass -- the one opaque,
 * committed choice, the same rule as send in the composer.
 */
export const BarButton = React.forwardRef<
  HTMLButtonElement,
  {
    shape?: "circle" | "capsule";
    primary?: boolean;
    label?: string;
    className?: string;
  } & Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"
  >
>(function BarButton(
  {
    shape = "capsule",
    primary,
    label,
    className,
    children,
    disabled,
    ...props
  },
  ref,
) {
  const button = (
    <motion.button
      ref={ref}
      type="button"
      aria-label={label}
      disabled={disabled}
      whileTap={
        disabled
          ? undefined
          : { scale: shape === "circle" ? PRESS_SCALE_ICON : PRESS_SCALE }
      }
      transition={SPRING_SNAPPY}
      className={cn(
        "relative flex size-full items-center justify-center gap-1.5 rounded-full font-medium text-sm outline-none",
        "focus-visible:ring-2 focus-visible:ring-foreground/40 disabled:pointer-events-none",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        primary ? "bg-foreground text-background" : "text-foreground",
      )}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {children}
    </motion.button>
  );

  const sizing =
    shape === "circle" ? "size-12 shrink-0" : "h-12 min-w-0 flex-1";

  if (primary) {
    return (
      <div
        className={cn(
          sizing,
          "rounded-full shadow-[0_10px_28px_-10px_rgb(0_0_0/0.45)] transition-opacity",
          disabled && "opacity-40",
          className,
        )}
      >
        {button}
      </div>
    );
  }
  return (
    <GlassSurface
      className={cn(
        sizing,
        "liquid-glass-milky rounded-full",
        disabled && "opacity-50",
        className,
      )}
    >
      {button}
    </GlassSurface>
  );
});
