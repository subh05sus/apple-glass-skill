// apple-glass kit: copied verbatim from sparkmentor/frontend/components/bottom-nav/nav-tab-row.tsx on 2026-10-06. The live file wins; re-copy it when it changes.
"use client";

import { Plus } from "lucide-react";
import { motion } from "motion/react";
import type * as React from "react";
import { ShineLight, ShineWobble } from "@/components/bottom-nav/compose-shine";
import { GlassSurface } from "@/components/ui/glass";
import {
  getDestination,
  type NavDestination,
  type NavDestinationId,
} from "@/lib/bottom-nav/destinations";
import { PRESS_SCALE_ICON, SPRING_SNAPPY } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * The mobile tab bar: a floating Liquid Glass capsule holding the pinned
 * destinations and More, and -- detached, at the far right -- a round glass
 * button for a new chat.
 *
 * Shared by the live bar and by the customiser's preview so the preview cannot
 * drift from the real thing -- the whole point of previewing is that what you
 * see is what you get.
 *
 * The current tab sits on a lens: a smaller, denser pane of glass that slides
 * between tabs rather than cross-fading, so the eye follows it. Everything is
 * neutral -- the lens, not a brand colour, is what marks the current tab.
 */

const ICON = "size-[22px]";
const LENS_SPRING = { type: "spring", stiffness: 420, damping: 34 } as const;

export type NavTabRowProps = {
  ids: NavDestinationId[];
  /** Id of the destination to show as current, if any. */
  activeId?: NavDestinationId | null;
  moreActive?: boolean;
  /** Scrolled down: icons only, and a shorter bar. */
  collapsed?: boolean;
  /** Omitted in the preview, where nothing is interactive. */
  onNavigate?: (destination: NavDestination) => void;
  onCompose?: () => void;
  onMore?: () => void;
  /** Preview mode: no links, no layout animation, no haptics. */
  static?: boolean;
  labelFor: (destination: NavDestination) => string;
  moreLabel: string;
  composeLabel: string;
  /** Each change plays the + button's shine once (see compose-shine). */
  shineSignal?: number;
  className?: string;
};

function TabLabel({
  children,
  collapsed,
}: {
  children: React.ReactNode;
  collapsed?: boolean;
}) {
  // A 0fr/1fr grid row animates the label's height to nothing without
  // measuring it. `max-w` plus truncation keeps a long name inside its cell.
  return (
    <span
      className={cn(
        "grid w-full transition-[grid-template-rows,opacity] duration-300 ease-out",
        collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
      )}
    >
      <span className="min-h-0 overflow-hidden">
        <span className="block max-w-full truncate px-0.5 pt-1 text-center font-medium text-[10.5px] leading-none tracking-[-0.01em]">
          {children}
        </span>
      </span>
    </span>
  );
}

function Lens({ isStatic }: { isStatic?: boolean }) {
  const className = "liquid-lens absolute inset-0 rounded-full";
  if (isStatic) return <span aria-hidden className={className} />;
  return (
    <motion.span
      aria-hidden
      layoutId="bottom-nav-lens"
      transition={LENS_SPRING}
      className={className}
    />
  );
}

function MoreGlyph() {
  // Three dots drawn rather than an icon glyph: lucide's MoreHorizontal
  // renders visually lighter than the filled destination icons beside it,
  // which read as a weight mismatch across the row.
  return (
    <span className="flex h-[22px] items-center gap-[3px]">
      <span className="size-[4.5px] rounded-full bg-current" />
      <span className="size-[4.5px] rounded-full bg-current" />
      <span className="size-[4.5px] rounded-full bg-current" />
    </span>
  );
}

export function NavTabRow({
  ids,
  activeId,
  moreActive,
  collapsed,
  onNavigate,
  onCompose,
  onMore,
  static: isStatic,
  labelFor,
  moreLabel,
  composeLabel,
  shineSignal = 0,
  className,
}: NavTabRowProps) {
  const destinations = ids
    .map(getDestination)
    .filter((d): d is NavDestination => d !== null);

  const height = collapsed ? "h-[50px]" : "h-[62px]";

  const cell = (
    key: string,
    active: boolean,
    icon: React.ReactNode,
    label: string,
    props: React.ButtonHTMLAttributes<HTMLButtonElement>,
  ) => {
    const content = (
      <>
        {active && <Lens isStatic={isStatic} />}
        <span className="relative flex min-w-0 flex-col items-center">
          {icon}
          <TabLabel collapsed={collapsed}>{label}</TabLabel>
        </span>
      </>
    );
    const cellClass = cn(
      "relative flex h-full min-w-0 select-none items-center justify-center rounded-full",
      "transition-colors duration-200",
      active ? "text-foreground" : "text-foreground/60",
    );
    if (isStatic) {
      return (
        <div key={key} className={cellClass} aria-hidden>
          {content}
        </div>
      );
    }
    return (
      <motion.button
        key={key}
        type="button"
        whileTap={{ scale: 0.92 }}
        transition={SPRING_SNAPPY}
        className={cn(
          cellClass,
          "outline-none focus-visible:ring-2 focus-visible:ring-foreground/40",
        )}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {content}
      </motion.button>
    );
  };

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <GlassSurface
        className={cn(
          "liquid-glass-milky min-w-0 flex-1 rounded-full transition-[height] duration-300 ease-out",
          height,
        )}
      >
        <div className="grid h-full grid-cols-4 p-[5px]">
          {destinations.slice(0, 3).map((destination) => {
            const { id, icon: Icon } = destination;
            const active = activeId === id;
            const label = labelFor(destination);
            return cell(id, active, <Icon className={ICON} />, label, {
              onClick: () => onNavigate?.(destination),
              "aria-current": active ? "page" : undefined,
              "aria-label": collapsed ? label : undefined,
            });
          })}
          {cell("more", !!moreActive, <MoreGlyph />, moreLabel, {
            onClick: onMore,
            "aria-haspopup": "dialog",
            "aria-expanded": moreActive ?? false,
            "aria-label": collapsed ? moreLabel : undefined,
          })}
        </div>
      </GlassSurface>

      {/* New chat: its own pane of glass, detached at the far right, so the
          one creating action never reads as another place to go. */}
      <ShineWobble signal={shineSignal} className="shrink-0">
        <GlassSurface
          className={cn(
            "liquid-glass-milky aspect-square shrink-0 rounded-full transition-[height] duration-300 ease-out",
            height,
          )}
        >
          {isStatic ? (
            <div
              aria-hidden
              className="flex size-full items-center justify-center text-foreground"
            >
              <Plus className="size-7" strokeWidth={2.25} />
            </div>
          ) : (
            <motion.button
              type="button"
              onClick={onCompose}
              aria-label={composeLabel}
              whileTap={{ scale: PRESS_SCALE_ICON }}
              transition={SPRING_SNAPPY}
              className="flex size-full items-center justify-center rounded-full text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/40"
            >
              <Plus
                className={cn(
                  "transition-[width,height] duration-300",
                  collapsed ? "size-6" : "size-7",
                )}
                strokeWidth={2.25}
              />
            </motion.button>
          )}
          <ShineLight signal={shineSignal} />
        </GlassSurface>
      </ShineWobble>
    </div>
  );
}
