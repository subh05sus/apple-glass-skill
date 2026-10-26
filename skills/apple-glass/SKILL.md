---
name: apple-glass
description: Make a web app look, move and feel like Apple's own apps on iOS 26 and macOS Tahoe, dark mode first. Real Liquid Glass (a lens that bends and magnifies the content toward the edge and a rim that catches the light, not a plain blur) only on the floating controls layer, Apple's exact dark palette (base vs elevated backgrounds, label, fill and separator colours, system colours), San Francisco text styles, 44 pt targets, capsule and concentric shapes, and app-like micro-interactions (press springs, a glass lens sliding between tabs, a slider thumb swelling into glass, a tab bar that shrinks on scroll, self-drawing checks, rolling numbers, swipe rows, iOS push/pop). Ships a working glass kit (a framework-free lens plus React components) and a page-by-page rethink workflow with spacing audits, owner choice rounds and screenshot checks. Use it whenever someone wants an Apple, iOS, macOS or "liquid glass" look, glassmorphism, a native-feeling dark mode, micro-interactions or small animations, "make it feel like an app", a spacing or polish pass over product pages, or a design rethink, even for one page or component.
---

# Apple glass

The goal: someone who lives on an iPhone and a Mac opens the product in dark mode, and it feels like one of Apple's apps. That covers the materials, the colours, the type, the spacing and how everything answers a touch. It is not a costume. The product keeps its own accent colour, words and structure, as Apple's own apps do.

**Sources:**
- SparkMentor (`sparkmentor/frontend`) is the reference implementation, and `assets/kit/` holds its working code. The lens in `assets/kit/liquid-lens.js` is newer than SparkMentor's copy.
- Apple's Human Interface Guidelines are the rulebook, distilled in `references/`.

Read each reference when its step comes up:

| When | Read |
|---|---|
| Planning a pass over pages, asking the owner, verifying | `references/rethink-workflow.md` |
| Anything translucent: bars, floating buttons, sheets, the sidebar | `references/materials.md` |
| Colours, dark mode, accent, contrast | `references/dark-palette.md` |
| Type, spacing, margins, shapes, targets, phone vs desktop | `references/type-layout.md` |
| Building a component (tab bar, sidebar, toolbar, list, sheet, menu…) | `references/components.md` |
| Animation and feedback | `references/micro-interactions.md` |
| Installing or reusing the code | `assets/kit/README.md` |

## The model

```
 functional layer: Liquid Glass (floats, translucent, monochrome, few)
   tab bar · toolbar buttons · floating action bar · floating search · composer
   desktop sidebar slab · segmented thumb · slider thumb (only while held)
 ─────────────────────────────────────────────────────────────────────────────
 content layer: solid (opaque surfaces, standard materials at most)
   page (black base) · grouped cells (#1C1C1E) · cards · rows · charts
   menus · popovers · sheets · dialogs → solid ELEVATED surfaces, Apple's shape
```

## Rules that make it read as Apple

1. **Glass is only for controls that float above content.** Never use it for cards, rows, panels or page backgrounds.
   - Menus, popovers, sheets and dialogs hold text over busy content, so they stay solid (`.surface-menu`, `.surface-sheet`) in Apple's shape.
   - Why: Apple puts controls on a separate glass layer above the content. Glass everywhere erases that hierarchy, hurts legibility and costs GPU time.
2. **Liquid Glass bends light. A blur alone is frosted plastic.** The pane is a thick slab with a rounded edge:
   - At the rim, the content behind bends and magnifies toward the edge, and the curved edge catches the light as a bright line (lit side brighter, a dimmer catch opposite). The face stays flat and clear enough to see through.
   - On Chromium, `GlassSurface` / `attachLiquidGlass` (`assets/kit/liquid-lens.js`) do this for real: Snell's-law refraction through a squircle edge, a specular rim map and a slight colour fringe. Keep it on for the hero controls (tab bar, toolbar buttons, floating bars).
   - Safari, iOS and Firefox can't filter a backdrop through SVG, so they get the frosted layers plus the bevel (`--glass-rim`). That path must look intentional on its own.
   - Frost lightly (2 px inside the lens for regular glass, under 1 px for clear) and let the tint carry legibility. A heavy blur hides the bend, which is the whole point.
3. **Never put glass on glass.** Inside a pane, use fills (`bg-foreground/6`), the lens (`.liquid-lens`) or label colours, never a second pane.
4. **Keep glass neutral, and use colour only where it means something.**
   - Labels on glass are monochrome.
   - Tint the background of the single primary action (Done, Send) or a destructive one (End call).
   - Never tint several controls in one bar.
5. **Dark mode is its own palette, not an inversion.**
   - Base backgrounds recede: pure black on phones.
   - Anything presented above the base is elevated (#1C1C1E → #2C2C2E → #3A3A3C).
   - Foregrounds get brighter, and text uses Apple's label alphas.
   - Contrast must be at least 4.5:1, or 3:1 for text at 18 px and above or in bold. Aim for 7:1 on small text.
6. **Hierarchy comes from type and space, not boxes.**
   - San Francisco via the system font stack, with Apple's text styles.
   - About four sizes per screen, on a 4 px grid.
   - 16 px margins on phones. Targets of 44 px on touch and 28 px on desktop, never below 20.
7. **Shapes nest.** There are three kinds:
   - Fixed radius.
   - Capsule: radius is half the height. Use it for touch controls and for buttons that stand alone or sit in a row.
   - Concentric: inner radius = outer radius − padding. For example, a sheet with a 28 px radius and 16 px padding holds 12 px controls.
8. **Motion follows the finger and settles without bouncing.**
   - Critically damped springs everywhere; keep overshoot for earned moments.
   - Exits run faster than entrances.
   - Nobody ever waits for an animation.
   - Reduced motion is honoured everywhere.
9. **Every material degrades gracefully.** All of these must look intentional:
   - The path, in order: Clear (with the refraction lens on Chromium) → Soft (frosted, no lens; also the default under Reduce Transparency) → Solid (opaque).
   - No `backdrop-filter` support → solid.
   - Increase Contrast → solid with an outline.
10. **Frozen pieces stay frozen.** In SparkMentor the owner signed off the glass slider thumb (`.liquid-bead`), the tab bar lens and the segmented lens. Reuse them as they are; ask before retuning.
11. **The phone is iOS and the desktop is macOS.**
    - Phone: floating tab bar, large titles, bottom sheets, swipe actions.
    - Desktop: sidebar slab, toolbars, denser rows, right-click menus, ⌘K.
    - Both share one set of tokens and components.

## How to run a pass

Follow `references/rethink-workflow.md`. In short:

1. **Scope.** Pick the product, the pages (start with the functional pages people use daily) and the form factors.
2. **Look first.** Take screenshots of every page in scope, dark, at 390 and 1440 px, using `scripts/shoot.mjs --audit` (local or test hosts and test accounts only). The audit flags off-grid spacing, small targets, tiny text, low contrast, glass on glass and sideways scroll. Look at the images before reading code.
3. **Audit.** For each page, check:
   - the job and the primary action
   - spacing rhythm
   - which layer each element belongs to
   - components that should be Apple components (inset groups, segmented controls, sheets, swipe rows)
   - taps without feedback
   - states
   - dark mode and accessibility

   Write it down in `docs/design/apple-glass/audit.md`, or the project's revamp folder.
4. **Ask.** Run rounds of choices with the AskUserQuestion tool: the recommended option first, ASCII previews for layouts, up to four questions per round. The question bank is in the workflow reference. Record answers at once in `decisions.md` and never ask twice.
5. **Foundations, once.** Tokens (palette, type, radius), the kit, and Settings › Appearance (Theme, Surface style, Text size). If the project already has them (SparkMentor, SparkMentis), extend them rather than fork.
6. **Pages, one flow at a time.**
   - Make the smallest change that reaches the look.
   - Reuse kit components.
   - Fix spacing as part of each page, not as a separate pass.
7. **Verify and ship.**
   - Run the type-check, lint and tests.
   - Take screenshots: dark and light, phone and desktop, Clear, Soft and Solid, reduced motion and increased contrast.
   - Look at them yourself, then commit to `main`.

## Cheat sheet

**Dark palette, iOS** (all values: `references/dark-palette.md`)
- **Backgrounds:** base #000000 · grouped cell #1C1C1E · elevated #1C1C1E / #2C2C2E / #3A3A3C.
- **Labels:** #FFFFFF · then rgb(235 235 245) at .6 / .3 / .18.
- **Separators:** rgb(84 84 88 / .6) · opaque #38383A.
- **Fills:** rgb(120 120 128) at .36 / .32 · rgb(118 118 128) at .24 / .18.
- **System colours, dark:** blue #0091FF · green #30D158 · red #FF4245 · orange #FF9230 · yellow #FFD600 · teal #00D2E0 · indigo #6D7CFF · purple #DB34F2 · pink #FF375F.
- **macOS desktop, dark:** window #323232 · content #1E1E1E · labels at 85% white.

**Type, phone (iOS)**
- Large Title 34/41 · Title 1 28/34 · Title 2 22/28 · Title 3 20/25.
- Headline 17/22 semibold · Body 17/22 · Callout 16/21 · Subhead 15/20.
- Footnote 13/18 · Caption 1 12/16 · Caption 2 11/13.

**Type, desktop (macOS)**
- Large Title 26/32 · Title 1 22/26 · Title 2 17/22 · Title 3 15/20.
- Headline 13/16 bold · Body 13/16 · Callout 12/15 · Subhead 11/14 · Footnote and captions 10/13.

**Metrics**
- Phone margins 16 px. Rows at least 44 px; inset-group rows 52.
- Targets 44×44 on touch, 28 on desktop (minimum 20).
- Floating tab bar: 62 px, 50 when minimised, 16 px from the sides, `max(safe-area, 12px)` from the bottom.
- Sheet corners 28 px. Grabber 36×5.

**Motion** (`motion/react`)
- **Springs:** taps `SPRING_SNAPPY` (520/40, about 200 ms) · panels `SPRING_DEFAULT` (380/38, about 300 ms) · pages `SPRING_PAGE` (300/34) · earned moments `SPRING_REWARD` (320/22).
- **Exits:** 160 ms ease-in.
- **Press scale:** 0.97; icons 0.9; tabs 0.92.
- **Stagger:** 40 ms, capped at 8 items.
- **CSS curve:** `cubic-bezier(0.2, 0, 0, 1)`. iOS push: 380 ms `cubic-bezier(0.32, 0.72, 0, 1)`.

**Glass, dark, regular**
- Tint rgb(36 36 42 / .46) · blur 14 px · saturate 150% · brightness .85 (the frosted path).
- Lens (Chromium): bezel 42% of the short side · push 0.75 × bezel, max 30 px · frost 2 px · fringe 0.06 · rim magnifies at most 3×. Clear: bezel 48% · push 0.8 × bezel, max 48 · frost 0.6.
- Hairline: white .30 at the top, .06 down the sides, .09 at the bottom.
- Shadow: 0 12px 30px -10px rgb(0 0 0 / .65).
- **Variants:**
  - `clear`: over media only, with a 35% dim behind it.
  - `milky`: bars that hold text.
  - `dense`: typed text.
  - `destructive`.
  - `lens`: the selected tab.

## Done means

- The squint test reads as a few clear blocks. One primary action per screen. Spacing sits on the 4 px grid, with the same gaps for the same relationships.
- No glass in the content layer, none on top of glass, and colour only where it means something.
- Dark mode uses base and elevated surfaces correctly, text contrast passes, and nothing looks like an inverted light theme.
- Every tap answers within 100 ms. Nothing moves without a reason, and reduced motion leaves a calm, complete UI.
- Both themes, both sizes and all three surface styles look intentional in screenshots you have actually opened.
