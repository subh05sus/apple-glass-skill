# apple-glass kit

Working code behind SparkMentor's Liquid Glass look and its app-like motion, copied from the live repos on 2026-10-06. Each file starts with a comment naming its source. **The live file wins:** if the source has changed since, copy it again instead of editing the copy here. The exception is the lens (`liquid-lens.js`, `glass.tsx`, the `--glass-rim` bevel in `liquid-glass.css`), rebuilt here on 2026-10-26. It is newer than SparkMentor's copy, so port it the other way.

Stack it expects: React 19, Next.js (App Router), Tailwind CSS v4.1+ (`pointer-coarse:`, `bg-linear-to-*`), `motion` 12+ (`motion/react`), shadcn/Radix primitives, `lucide-react`, and a `cn()` helper (`clsx` + `tailwind-merge`) at `@/lib/utils`. Imports use SparkMentor's paths (`@/components/ui/*`, `@/lib/*`, `@/hooks/*`); change them to match the project.

## Files

| File | What it is | Needs |
|---|---|---|
| `liquid-glass.css` | The material: `.liquid-glass` and its variants (clear, milky, dense, on-dark, destructive), `.liquid-lens`, `.liquid-dim`, solid `.surface-menu` / `.surface-sheet`, scroll-edge fades, `.material-bar`, the three surface styles (`data-glass` = on / frosted / off), Reduce Transparency, Increase Contrast and no-`backdrop-filter` fallbacks, and the frozen slider bead | `--background`, `--foreground`, `--popover` tokens; `.dark` class theme |
| `liquid-lens.js`, `liquid-lens.d.ts` | The Liquid Glass lens, framework-free: Snell's-law refraction through a squircle edge, a fold-free rim, a specular rim map and a colour fringe, as an SVG backdrop filter sized to each element. `attachLiquidGlass(el)` for plain HTML, `lensFor()` for frameworks | — |
| `glass.tsx` | `GlassSurface` (the material plus the lens on Chromium) and `GlassButton` (round glass icon button, 36/40/44/60 px) | `liquid-lens.js` at `@/lib/liquid-lens`, `glass-preference.ts`, `motion.ts` |
| `glass-preference.ts`, `glass-boot.ts` | The Surface style setting: per-browser choice, `data-glass` on `<html>` before first paint, OS Reduce Transparency until chosen | boot script in `<head>` |
| `glass-segmented.tsx` | iOS 26 segmented control: soft track, glass lens thumb that slides and swells; tabs mode with arrow keys | `motion` |
| `glass-slider.tsx` | Slider whose white thumb swells into clear glass while held, value bubble, haptic per step. **Look frozen by the owner.** | `glass.tsx` |
| `nav-tab-row.tsx`, `bottom-nav.tsx`, `compose-shine.tsx` | The phone's floating glass tab bar: lens on the current tab, minimise on scroll, detached compose button with a droplet wobble and shine. `bottom-nav.tsx` holds `useScrollCollapse` and the idle shine | SparkMentor's nav registry (`@/lib/bottom-nav/*`), `next-intl`; adapt |
| `floating-action-bar.tsx` | Primary actions pinned above the tab bar in glass panes, aligned to the content column, rise-in / fade-out | `glass.tsx` |
| `search-field.tsx` | Capsule search; `tinted` on a page, `glass` when it floats | `next-intl` (swap for plain strings) |
| `inset-group.tsx` | iOS Settings-style grouped list: caption, rounded panel, 52 px rows, inset hairlines, chevrons, footnote | — |
| `row-actions.tsx` | Swipe-to-reveal row actions on touch (72 px threshold, haptic), the same actions in a ⋯ / right-click menu on desktop | shadcn context-menu and dropdown-menu; drop the `track` analytics lines if unused |
| `responsive-sheet.tsx`, `dialog.tsx`, `drawer.tsx` | Bottom sheet on phones (grabber 36×5, drag to dismiss, sticky footer), centred 28 px dialog on desktop, both solid `surface-sheet` | `vaul`, Radix dialog |
| `switch.tsx`, `save-switch.tsx` | iOS-proportioned switch whose thumb stretches while pressed; a switch that saves on flip with "Saved ✓" or slides back on failure | Radix switch |
| `check-draw.tsx` | Completion check: disc scales in, tick draws itself | `motion` |
| `button.tsx`, `use-async-action.ts` | Press scale 0.97, 44 pt touch target via `::after`, `loading` (spinner, width kept) and `success` (check pops) | `focus-ring.css` |
| `animated-number.tsx` | Odometer roll for changing numbers, "+N" delta float, `CountUp` for a one-time reveal | `motion` |
| `motion.ts`, `motion-provider.tsx` | Spring and timing tokens, press scales, stagger, `haptic()`; one app-wide reduced-motion switch | `motion` |
| `page-transition.tsx`, `nav-direction.ts`, `page-transitions.css` | iOS push / pop on phones (none between tabs), fade-and-rise on desktop, one cross-fade for theme switches; React `<ViewTransition>` | React 19.2+ / Next 16.3+ (no flag) |
| `focus-ring.css` | One 2 px keyboard focus ring, 2 px off the control | `--ring` |
| `apple-tokens.css` | **New, not yet adopted anywhere:** Apple's exact light/dark/high-contrast colours as `--apple-*` and `--mac-*` tokens, with a commented shadcn mapping | — |
| `brand-palette.ts` | SparkMentis: one school colour → accessible `--brand-*` tokens for light and dark (contrast-checked) | — |

## Install (new project)

1. Put `liquid-glass.css`, `page-transitions.css` and `focus-ring.css` into the global stylesheet after the theme tokens (keep `liquid-glass.css` inside `@layer components`, as it is). Tailwind v4 needs `@custom-variant dark (&:is(.dark *));` for the `.dark` class.
2. Rename the storage key in `glass-boot.ts` (`<product>:glass`) and add the boot script as the first thing in `<head>`:
   `<script dangerouslySetInnerHTML={{ __html: GLASS_BOOT_SCRIPT }} />`
3. Copy `liquid-lens.js` and `liquid-lens.d.ts` to `lib/`, then `glass-preference.ts`, `glass.tsx`, `motion.ts`, `motion-provider.tsx`; wrap the app in `<MotionProvider>`. Without React, only the CSS and `liquid-lens.js` are needed: `attachLiquidGlass(el)`.
4. Add Settings › Appearance › Surface style: a `GlassSegmented` with Clear / Soft / Solid calling `setGlassMode("on" | "frosted" | "off")`.
5. Take the components the pages need. Adopt `apple-tokens.css` only after the owner picks the palette (see `references/dark-palette.md`).
6. Verify with `scripts/shoot.mjs`: dark and light, 390 and 1440 px, all three surface styles, plus reduced motion and increased contrast.

## Known issue: phone tab switches (found 2026-10-06)

- **The problem.** `page-transitions.css` disables the phone animation for sideways moves with `html:not([data-nav="forward"]):not([data-nav="back"])::view-transition-old(.page-exit)`. Tailwind v4's minifier (lightningcss) can't parse a `:not()` chain in front of a view-transition pseudo-element with a class argument. It **drops the rule in production builds**: SparkMentor's built CSS doesn't contain it. So on phones, tab switches get the desktop fade instead of switching in place. SparkMentis has the same rule.
- **The fix** (not yet applied in either app): inside the phone media query, put the plain rule first,

  ```css
  ::view-transition-old(.page-exit), ::view-transition-new(.page-enter) { animation: none; }
  ```

  and keep the `html[data-nav="forward"|"back"]` rules after it. Those are more specific and still win.
- **Rule of thumb.** Never write `:not()` before `::view-transition-*()`. Check the built CSS for view-transition rules after a build.

## Do not retune

- `.liquid-bead` (the slider thumb) keeps a frozen copy of an older recipe on purpose. Leave it alone.
- The tab bar's lens and the segmented control's lens are signed off. Reuse them as they are.
- New variants go next to the existing ones as new classes. Don't change shared custom properties, because that silently restyles every pane.
