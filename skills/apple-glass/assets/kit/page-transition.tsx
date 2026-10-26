// apple-glass kit: copied verbatim from sparkmentor/frontend/components/navigation/page-transition.tsx on 2026-10-06. The live file wins; re-copy it when it changes.
"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef, ViewTransition } from "react";
import { useIsPhone } from "@/hooks/use-media-query";
import {
  directionBetween,
  hasRecentExplicitDirection,
  nativeBackGestureAnimates,
  setNavDirection,
} from "@/lib/nav-direction";

/**
 * Animates page changes inside the app shell.
 *
 * A `<ViewTransition>` keyed by the route: when the route changes, the old
 * page exits and the new one enters as one view transition. The sidebar,
 * header and tab bar sit outside it and stay still. `update="none"` matters:
 * without it every in-page transition (a filter, a search) would animate the
 * whole page.
 *
 * What the animation looks like is pure CSS ("Page transitions" in
 * globals.css): an iOS push/pop on phones, chosen by `<html data-nav>`, and a
 * short fade on larger screens. Reduced motion turns it off.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const phone = useIsPhone();
  useNavDirection(pathname);

  // On larger screens Settings keeps its sidebar while sections change, so
  // the whole of /settings is one transition scope there (the pane animates
  // itself); on phones every settings screen pushes like any other page.
  const scope =
    !phone && pathname.startsWith("/settings") ? "/settings" : pathname;

  return (
    <ViewTransition
      key={scope}
      enter="page-enter"
      exit="page-exit"
      update="none"
      default="none"
    >
      {children}
    </ViewTransition>
  );
}

/**
 * Keeps `<html data-nav>` pointing the right way for the navigation about to
 * happen: links are read in the capture phase of the click (before Next
 * starts the transition), the browser's back/forward in `popstate`.
 */
function useNavDirection(pathname: string) {
  const current = useRef(pathname);

  useEffect(() => {
    current.current = pathname;
    // Clear once the transition has had time to run, so a later navigation
    // that nobody labelled does not reuse a stale direction.
    const timer = window.setTimeout(() => setNavDirection("none", false), 700);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // A held click (a leave guard asking first) navigates later, if at
      // all, and labels its own direction then.
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      setNavDirection(directionBetween(current.current, url.pathname), false);
    };

    const onPopState = () => {
      // An in-app back button already said "back" before calling history.
      if (hasRecentExplicitDirection()) return;
      const next = window.location.pathname;
      const direction = nativeBackGestureAnimates()
        ? "none"
        : directionBetween(current.current, next);
      setNavDirection(direction, false);
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);
}
