// apple-glass kit: copied verbatim from sparkmentor/frontend/components/bottom-nav/bottom-nav.tsx on 2026-10-06. The live file wins; re-copy it when it changes.
"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { MoreSheet } from "@/components/bottom-nav/more-sheet";
import { NavTabRow } from "@/components/bottom-nav/nav-tab-row";
import { NewChatDialog } from "@/components/chat/new-chat-dialog";
import { useBottomNavOrder } from "@/hooks/use-bottom-nav-config";
import {
  getDestination,
  type NavDestination,
} from "@/lib/bottom-nav/destinations";
import { haptic } from "@/lib/motion";
import { setNavDirection } from "@/lib/nav-direction";
import { useGuardedRouter } from "@/lib/navigation/nav-guard";
import { openSearch } from "@/lib/search/open-search";

/** Routes that always live behind More, whatever the user pins. */
const FIXED_MORE_ROUTES = [
  "/billing",
  "/integrations",
  "/settings",
  "/profile",
];

/**
 * iOS-26-style minimise: scrolling down the page collapses the bar to icons,
 * scrolling up (or reaching the top) restores it. Listens to `#page-content`,
 * the authenticated layout's scroller, in the capture phase so nested
 * scrollers inside a page count too. A small dead zone keeps momentum jitter
 * from flickering it.
 */
function useScrollCollapse(resetKey: string | null) {
  const [collapsed, setCollapsed] = useState(false);
  const last = useRef(0);

  // A new page starts expanded.
  // biome-ignore lint/correctness/useExhaustiveDependencies: resetKey is the trigger
  useEffect(() => {
    setCollapsed(false);
    last.current = 0;
  }, [resetKey]);

  useEffect(() => {
    let frame = 0;
    const onScroll = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = target.scrollTop;
        const delta = y - last.current;
        if (y < 40) setCollapsed(false);
        else if (delta > 8) setCollapsed(true);
        else if (delta < -8) setCollapsed(false);
        if (Math.abs(delta) > 8 || y < 40) last.current = y;
      });
    };
    document.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, []);

  return collapsed;
}

/** Idle shine on the + button: first after this long without activity... */
const IDLE_FIRST_MS = 3000;
/** ...then this often while still idle... */
const IDLE_REPEAT_MS = 12000;
/** ...at most this many times, until activity resets the count. */
const IDLE_MAX_PLAYS = 3;

/**
 * Plays the + button's shine when the dashboard sits idle: after 3s with no
 * touch, scroll or key press, then every 12s, three times at most. Any
 * activity restarts the clock and the count. Skipped while a sheet or dialog
 * is open, while the tab is hidden, and under reduced motion.
 */
function useIdleShine(enabled: boolean, blocked: boolean, onShine: () => void) {
  const blockedRef = useRef(blocked);
  blockedRef.current = blocked;
  const onShineRef = useRef(onShine);
  onShineRef.current = onShine;

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let plays = 0;
    let timer = 0;
    const schedule = (ms: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (plays >= IDLE_MAX_PLAYS) return;
        if (!blockedRef.current && document.visibilityState === "visible") {
          plays += 1;
          onShineRef.current();
        }
        schedule(IDLE_REPEAT_MS);
      }, ms);
    };
    const reset = () => {
      plays = 0;
      schedule(IDLE_FIRST_MS);
    };

    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    for (const e of events) {
      window.addEventListener(e, reset, { passive: true });
    }
    // Scroll happens on the layout's scroller, not window: capture it.
    document.addEventListener("scroll", reset, {
      capture: true,
      passive: true,
    });
    reset();
    return () => {
      window.clearTimeout(timer);
      for (const e of events) window.removeEventListener(e, reset);
      document.removeEventListener("scroll", reset, { capture: true });
    };
  }, [enabled]);
}

function matchesRoute(pathname: string | null, url: string) {
  if (!pathname) return false;
  if (pathname === url) return true;
  // `/chat/all` must not claim `/chat/physics`; every other destination owns
  // its subtree.
  if (url === "/chat/all") return false;
  return pathname.startsWith(`${url}/`);
}

export function BottomNav() {
  const pathname = usePathname();
  // A tab that leaves the page asks an active leave guard (a quiz) first.
  const router = useGuardedRouter();
  const t = useTranslations();
  const { order, pinned } = useBottomNavOrder();
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const collapsed = useScrollCollapse(pathname);
  // The bar's live height, published so floating bars above it (the Ask
  // bar, flashcard and quiz bars) sit relative to it and glide down with it
  // when it shrinks on scroll. 62px open, 50px collapsed (nav-tab-row).
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty(
      "--tabbar-live-h",
      collapsed && !moreOpen ? "50px" : "62px",
    );
  }, [collapsed, moreOpen]);
  const [shineSignal, setShineSignal] = useState(0);
  const shine = () => setShineSignal((n) => n + 1);
  useIdleShine(pathname === "/dashboard", newChatOpen || moreOpen, shine);

  // Prefetching what the bar can reach: these are the routes most likely to be
  // tapped next, and the tabs are buttons rather than links so Next has no
  // anchor to prefetch from on its own.
  useEffect(() => {
    for (const id of pinned) {
      const destination = getDestination(id);
      if (destination && !destination.action) router.prefetch(destination.url);
    }
  }, [pinned, router]);

  // Hide inside conversations and full-screen canvases -- they have their own
  // bottom composers / scroll locks (same route check as the layout, which
  // must agree with this one or the scroller reserves the wrong space).
  const isChatDetail =
    pathname?.startsWith("/chat/") && pathname !== "/chat/all";
  const isKnowledgeTreeDetail =
    pathname?.startsWith("/knowledge-tree/") && pathname !== "/knowledge-tree";
  const isNoteEditor = pathname?.startsWith("/notes/");
  if (isChatDetail || isKnowledgeTreeDetail || isNoteEditor) return null;

  const activeId =
    pinned.find((id) => {
      const destination = getDestination(id);
      return destination ? matchesRoute(pathname, destination.url) : false;
    }) ?? null;

  // More lights up for anything it can reach: the fixed routes plus every
  // destination that fell below the cut line.
  const moreRoutes = [
    ...FIXED_MORE_ROUTES,
    ...order
      .filter((id) => !pinned.includes(id))
      .map((id) => getDestination(id)?.url)
      .filter((url): url is string => !!url),
  ];
  const isMoreActive =
    !activeId && moreRoutes.some((url) => matchesRoute(pathname, url));

  const tap = () => haptic("tick");

  const labelFor = (destination: NavDestination) =>
    destination.labelKey ? t(destination.labelKey) : destination.label;

  return (
    <>
      {/* Scroll-edge effect: content fades a little as it slides under the
          glass, so labels stay legible over busy pages without making the
          bar itself any less transparent. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-28 bg-linear-to-t from-background/70 via-background/25 to-transparent md:hidden"
      />
      <motion.nav
        initial={{ y: 120 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        aria-label={t("nav.navigation")}
        // Floats: no edge-to-edge strip, just the glass with air around it.
        // The bottom inset clears the home indicator, with a 12px floor on
        // devices that have none.
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 pr-safe pl-safe md:hidden"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom, 0px), 12px)",
        }}
      >
        <NavTabRow
          className="pointer-events-auto mx-4"
          ids={pinned}
          activeId={activeId}
          collapsed={collapsed && !moreOpen}
          moreActive={isMoreActive || moreOpen}
          labelFor={labelFor}
          moreLabel={t("nav.more")}
          composeLabel={t("nav.new")}
          onNavigate={(destination) => {
            tap();
            // A pinned Search opens the palette rather than a page.
            if (destination.action === "search") {
              openSearch();
              return;
            }
            // Tabs switch in place, like a native tab bar -- never a push.
            setNavDirection("none");
            router.push(destination.url);
          }}
          shineSignal={shineSignal}
          onCompose={() => {
            shine();
            tap();
            setNewChatOpen(true);
          }}
          onMore={() => {
            tap();
            setMoreOpen(true);
          }}
        />
      </motion.nav>

      <NewChatDialog open={newChatOpen} onOpenChange={setNewChatOpen} />
      {/* The full ordering, so the sheet lists the leftovers in the order the
          user dragged them into rather than the registry's default. */}
      <MoreSheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
        order={order}
        pinnedIds={pinned}
      />
    </>
  );
}
