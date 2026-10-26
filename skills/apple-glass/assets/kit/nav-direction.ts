// apple-glass kit: copied verbatim from sparkmentor/frontend/lib/nav-direction.ts on 2026-10-06. The live file wins; re-copy it when it changes.
/**
 * Which way the next page change moves, for the phone push/pop transition.
 *
 * The direction lives on `<html data-nav="forward|back|none">` because the
 * view-transition pseudo-elements hang off the document element, so plain
 * CSS can pick the animation (see "Page transitions" in globals.css). It has
 * to be set *before* React captures the old page, which is why links are
 * read in the capture phase of the click and code paths that navigate
 * imperatively call `setNavDirection` first.
 *
 *   forward  deeper in the app (Dashboard -> Subject -> Chat): push
 *   back     shallower (the reverse): pop
 *   none     sideways (tab to tab, query changes): no slide on phones
 */
export type NavDirection = "forward" | "back" | "none";

/**
 * How deep a route sits. Tab roots are 0; a list's item is one deeper. Chat
 * conversations sit under their subject hub, so Subject -> Chat pushes too.
 */
export function routeRank(pathname: string): number {
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (path === "/chat/all") return 0;
  const segments = path.split("/").filter(Boolean);
  if (segments[0] === "chat" && segments.length >= 2) return 2;
  return Math.max(0, segments.length - 1);
}

export function directionBetween(from: string, to: string): NavDirection {
  if (from === to) return "none";
  const a = routeRank(from);
  const b = routeRank(to);
  if (b > a) return "forward";
  if (b < a) return "back";
  return "none";
}

let explicitAt = 0;

/** Set the direction for the navigation about to start. */
export function setNavDirection(direction: NavDirection, explicit = true) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.nav = direction;
  if (explicit) explicitAt = Date.now();
}

/** True when code chose a direction in the last moment (a popstate it caused). */
export function hasRecentExplicitDirection(windowMs = 400) {
  return Date.now() - explicitAt < windowMs;
}

/**
 * iOS Safari (in the browser, not installed) animates its own edge-swipe
 * back gesture; sliding again on top of it would play the motion twice.
 */
export function nativeBackGestureAnimates() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS =
    /iP(hone|ad|od)/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (!iOS) return false;
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return !standalone;
}
