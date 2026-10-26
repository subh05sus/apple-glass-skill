// apple-glass kit: copied verbatim from sparkmentor/frontend/components/ui/row-actions.tsx on 2026-10-06. The live file wins; re-copy it when it changes.
"use client";

import { MoreHorizontal } from "lucide-react";
import {
  animate,
  motion,
  type PanInfo,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { type ReactNode, useRef } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCoarsePointer } from "@/hooks/use-media-query";
import { track } from "@/lib/analytics/track";
import { haptic, SPRING_SNAPPY } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type RowAction = {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  /** Red, and placed last in menus. */
  destructive?: boolean;
};

const THRESHOLD = 72;

/** Anonymous usage: swipe vs. menu for the same row actions. */
function trackSwipe(side: "start" | "end", action: RowAction) {
  track("swipe_action", { side, destructive: Boolean(action.destructive) });
}

function runFromMenu(via: "context" | "menu", action: RowAction) {
  track("row_menu_action", { via, destructive: Boolean(action.destructive) });
  action.onSelect();
}

/**
 * Makes a row's content swipeable on touch screens and right-clickable (or
 * long-pressable) everywhere:
 *
 *   swipe right -> `start` (the positive action: done, resolve, favourite)
 *   swipe left  -> `end`   (usually remove)
 *
 * Past the threshold the action's label firms up with a haptic tick; letting
 * go there runs it, anywhere short of it springs back. The context menu
 * lists the same actions plus `menu`, so nothing is gesture-only.
 */
export function SwipeSurface({
  start,
  end,
  menu = [],
  className,
  children,
}: {
  start?: RowAction;
  end?: RowAction;
  menu?: RowAction[];
  className?: string;
  children: ReactNode;
}) {
  const coarse = useCoarsePointer();
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const crossed = useRef(false);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  const startOpacity = useTransform(x, [0, THRESHOLD], [0, 1]);
  const endOpacity = useTransform(x, [-THRESHOLD, 0], [1, 0]);
  const startScale = useTransform(x, [THRESHOLD * 0.6, THRESHOLD], [0.85, 1]);
  const endScale = useTransform(x, [-THRESHOLD, -THRESHOLD * 0.6], [1, 0.85]);

  const swipeable = coarse && !reduce && Boolean(start || end);
  const all = [start, ...menu, end].filter(Boolean) as RowAction[];
  const items = [
    ...all.filter((a) => !a.destructive),
    ...all.filter((a) => a.destructive),
  ];

  const onDrag = (_: unknown, info: PanInfo) => {
    const offset = info.offset.x;
    if (Math.abs(offset) > 6) dragged.current = true;
    const allowed = (offset > 0 && start) || (offset < 0 && end);
    const past = Boolean(allowed) && Math.abs(offset) >= THRESHOLD;
    if (past !== crossed.current) {
      crossed.current = past;
      if (past) haptic("tick");
    }
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const offset = info.offset.x;
    crossed.current = false;
    const width = surfaceRef.current?.offsetWidth ?? 400;
    if (offset <= -THRESHOLD && end?.destructive) {
      trackSwipe("end", end);
      // A committed remove slides the row off-screen first, then the list
      // closes the gap -- instead of springing back while it disappears.
      void animate(x, -width, {
        type: "tween",
        ease: [0.4, 0, 1, 1],
        duration: 0.18,
      }).then(() => {
        end.onSelect();
        // If the row is still here (the action asked for confirmation
        // instead of removing it), bring it back into place.
        window.setTimeout(() => {
          if (surfaceRef.current?.isConnected) animate(x, 0, SPRING_SNAPPY);
        }, 450);
      });
    } else {
      animate(x, 0, SPRING_SNAPPY);
      if (offset >= THRESHOLD && start) {
        trackSwipe("start", start);
        start.onSelect();
      } else if (offset <= -THRESHOLD && end) {
        trackSwipe("end", end);
        end.onSelect();
      }
    }
    // Swallow the click that ends a drag, then allow clicks again.
    requestAnimationFrame(() => {
      dragged.current = false;
    });
  };

  const surface = (
    <motion.div
      ref={surfaceRef}
      drag={swipeable ? "x" : false}
      dragDirectionLock
      dragConstraints={{ left: end ? -400 : 0, right: start ? 400 : 0 }}
      dragElastic={0.12}
      dragMomentum={false}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      onClickCapture={(event) => {
        if (dragged.current) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      style={{ x, touchAction: "pan-y" }}
      className={cn("relative bg-background", className)}
    >
      {children}
    </motion.div>
  );

  return (
    <div className="relative min-w-0 overflow-hidden">
      {swipeable && (
        <div aria-hidden="true" className="absolute inset-0 flex">
          {start && (
            <motion.div
              style={{ opacity: startOpacity }}
              className="flex flex-1 items-center gap-2 bg-primary px-5 text-sm font-medium text-primary-foreground"
            >
              <motion.span
                style={{ scale: startScale }}
                className="flex items-center gap-2 [&_svg]:size-4"
              >
                {start.icon}
                {start.label}
              </motion.span>
            </motion.div>
          )}
          {end && (
            <motion.div
              style={{ opacity: endOpacity }}
              className={cn(
                "flex flex-1 items-center justify-end gap-2 px-5 text-sm font-medium text-white",
                end.destructive
                  ? "bg-destructive"
                  : "bg-muted-foreground text-background",
              )}
            >
              <motion.span
                style={{ scale: endScale }}
                className="flex items-center gap-2 [&_svg]:size-4"
              >
                {end.label}
                {end.icon}
              </motion.span>
            </motion.div>
          )}
        </div>
      )}
      {items.length > 0 ? (
        <ContextMenu>
          <ContextMenuTrigger asChild>{surface}</ContextMenuTrigger>
          <ContextMenuContent>
            {items.map((action) => (
              <ContextMenuItem
                key={action.label}
                onSelect={() => runFromMenu("context", action)}
                variant={action.destructive ? "destructive" : "default"}
              >
                {action.icon}
                {action.label}
              </ContextMenuItem>
            ))}
          </ContextMenuContent>
        </ContextMenu>
      ) : (
        surface
      )}
    </div>
  );
}

/**
 * A ⋯ button listing a row's actions, for mouse and keyboard users. Hidden on
 * touch screens, where the row swipes and long-presses instead; on desktop
 * it fades in with the row's hover or focus.
 */
export function RowMenu({
  actions,
  label = "More actions",
  className,
}: {
  actions: RowAction[];
  label?: string;
  className?: string;
}) {
  if (actions.length === 0) return null;
  const ordered = [
    ...actions.filter((a) => !a.destructive),
    ...actions.filter((a) => a.destructive),
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "flex size-8 items-center justify-center rounded-full text-muted-foreground transition-[opacity,background-color,color] hover:bg-foreground/8 hover:text-foreground",
            "outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=open]:opacity-100",
            "pointer-coarse:hidden [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100",
            className,
          )}
        >
          <MoreHorizontal className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {ordered.map((action) => (
          <DropdownMenuItem
            key={action.label}
            onSelect={() => runFromMenu("menu", action)}
            variant={action.destructive ? "destructive" : "default"}
          >
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
