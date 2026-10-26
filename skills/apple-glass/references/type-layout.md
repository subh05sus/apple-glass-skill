# Type, spacing, shapes and targets

## Contents
- Font
- Text styles: phone (iOS) and desktop (macOS)
- Text size setting (Dynamic Type on the web)
- Spacing and the grid
- Margins, columns and safe areas
- Shapes: fixed, capsule, concentric
- Targets
- Phone vs desktop at a glance

## Font

```css
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
--font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
```

- **Apple devices get San Francisco** with automatic optical sizes (Text below 20 pt, Display above). Other systems get their own UI font, which is right: the app should feel native there too.
- **Don't ship SF Pro as a web font.** Its licence covers Apple platforms and mock-ups, not web embedding.
- **Weights:** Regular 400, Medium 500, Semibold 600, Bold 700. Never use Ultralight, Thin or Light for UI text.
- **Tracking.** San Francisco tracks itself per size, so leave body text at `letter-spacing: normal`. The HIG table (+0.06 pt at 11, −0.43 at 17, −0.26 at 22, +0.40 at 34) is for matching mock-ups drawn with a static font. On the web, `tracking-tight` (−0.01 to −0.02em) only on large titles is as far as it should go.
- **Numbers that change** (timers, counts, prices) get `tabular-nums` so they don't jitter.

## Text styles

**Phone (iOS, default size "Large").** Apple's minimum on iOS is 11 pt; never go below it.

| Style | Size / leading (px) | Weight | Emphasised | Web use |
|---|---|---|---|---|
| Large Title | 34 / 41 | Regular (Apple apps use Bold) | Bold | Page title at the top of a scroll view |
| Title 1 | 28 / 34 | Regular | Bold | Hero numbers, onboarding |
| Title 2 | 22 / 28 | Regular | Bold | Section heroes, sheet titles |
| Title 3 | 20 / 25 | Regular | Semibold | Card titles |
| Headline | 17 / 22 | Semibold | Semibold | Row titles that lead, list headers |
| Body | 17 / 22 | Regular | Semibold | Body text, row titles, inputs (16 px minimum on inputs stops iOS zooming) |
| Callout | 16 / 21 | Regular | Semibold | Supporting copy |
| Subheadline | 15 / 20 | Regular | Semibold | Row subtitles, secondary text |
| Footnote | 13 / 18 | Regular | Semibold | Group captions and footnotes, meta |
| Caption 1 | 12 / 16 | Regular | Semibold | Timestamps, badges |
| Caption 2 | 11 / 13 | Regular | Semibold | Tab bar labels (SparkMentor uses 10.5), tiny meta |

**Desktop (macOS).** Default 13 pt, minimum 10 pt. 1 CSS px = 1 pt on a Mac at 100%.

| Style | Size / leading | Weight | Emphasised |
|---|---|---|---|
| Large Title | 26 / 32 | Regular | Bold |
| Title 1 | 22 / 26 | Regular | Bold |
| Title 2 | 17 / 22 | Regular | Bold |
| Title 3 | 15 / 20 | Regular | Semibold |
| Headline | 13 / 16 | Bold | Heavy |
| Body | 13 / 16 | Regular | Semibold |
| Callout | 12 / 15 | Regular | Semibold |
| Subheadline | 11 / 14 | Regular | Semibold |
| Footnote | 10 / 13 | Regular | Semibold |
| Caption 1 / 2 | 10 / 13 | Regular / Medium | Medium / Semibold |

**Desktop density is an owner choice.**
- **macOS-exact:** 13 px body, 28 px rows. Faithful, and dense.
- **Comfortable** (the usual recommendation for web products used by students or schools on Windows laptops): 15 px body, 20 px leading, 36–40 px rows. The hierarchy stays macOS: same ratios, same weights.

**Hierarchy:**
- About four sizes per screen.
- Separate levels with weight and colour (label, then secondary label) before size.
- Bold and left-aligned for big moments: alerts, onboarding and empty states.

**As Tailwind v4 tokens,** scaled by the text-size setting:

```css
@theme {
  --text-large-title: calc(2.125rem * var(--text-scale, 1));   /* 34 */
  --text-large-title--line-height: 1.206;                        /* 41 */
  --text-title-1: calc(1.75rem * var(--text-scale, 1));         /* 28 / 34 */
  --text-title-1--line-height: 1.214;
  --text-title-2: calc(1.375rem * var(--text-scale, 1));        /* 22 / 28 */
  --text-title-2--line-height: 1.273;
  --text-title-3: calc(1.25rem * var(--text-scale, 1));         /* 20 / 25 */
  --text-title-3--line-height: 1.25;
  --text-body: calc(1.0625rem * var(--text-scale, 1));          /* 17 / 22 */
  --text-body--line-height: 1.294;
  --text-callout: calc(1rem * var(--text-scale, 1));            /* 16 / 21 */
  --text-callout--line-height: 1.3125;
  --text-subhead: calc(0.9375rem * var(--text-scale, 1));       /* 15 / 20 */
  --text-subhead--line-height: 1.333;
  --text-footnote: calc(0.8125rem * var(--text-scale, 1));      /* 13 / 18 */
  --text-footnote--line-height: 1.385;
  --text-caption-1: calc(0.75rem * var(--text-scale, 1));       /* 12 / 16 */
  --text-caption-1--line-height: 1.333;
  --text-caption-2: calc(0.6875rem * var(--text-scale, 1));     /* 11 / 13 */
  --text-caption-2--line-height: 1.182;
}
```

These give `text-body`, `text-footnote` and so on. If the project already has a numeric scale (SparkMentor's `text-13`, `text-15`, `text-17`), map onto it instead of adding a second one.

## Text size setting

Dynamic Type on the web is a per-browser Text size setting: Default ×1, Large ×1.12, Larger ×1.24.
- Apply it as `data-text-size` on `<html>`, which sets `--text-scale`, before first paint (boot script). Every type token multiplies by it.
- Inputs stay at least 16 px so iOS doesn't zoom.
- **At Larger:** rows grow instead of truncating, icon-and-text rows stack, and important content stays at the top.
- Marketing pages can opt out (`MARKETING_PATHS`).

## Spacing and the grid

- **A 4 px grid.** Use 2 px only for hairline offsets and icon nudges.
  - The steps: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64.
  - Odd values (5, 7, 13 px) and arbitrary `p-[13px]` are bugs unless optically justified, with a comment.
- **Same relationship, same gap:**

| Relationship | Gap |
|---|---|
| Icon to its label | 8 (12 in rows with icon tiles) |
| Title to its subtitle | 2–4 |
| Inline items (chips, buttons in a row) | 8 |
| Inside a row | 12–16 horizontal, 11–14 vertical (52 px rows) |
| Group caption to its group | 6–8 |
| Group to its footnote | 6–8 |
| Group to group (phone) | 24–32 |
| Section to section (desktop) | 32–40 |
| Page title to first content | 16–24 |
| Bottom of content above a floating tab bar | bar height + 12 + safe area (`--tabbar-live-h`) |

- **Rhythm beats boxes.** Separate with space and hairlines (`--apple-separator`, inset to start after the icon), not borders around everything.
- **Readable width.** Text blocks max about 65–75 characters (`max-w-prose`). Desktop content columns max about 720–960 px, centred in the space beside the sidebar.

## Margins, columns, safe areas

| Context | Side margin |
|---|---|
| Phone | 16 px (20 on wide phones is acceptable) |
| Inset group on a phone | 16 px from the screen edge; rows pad 16 inside |
| Tablet / small laptop | 24 px |
| Desktop content | 32 px (or 24 next to a sidebar) |

- **Safe areas:** use `env(safe-area-inset-*)` for anything fixed (tab bars, sheets, floating bars) with a minimum: `max(env(safe-area-inset-bottom), 12px)`. Add `viewport-fit=cover` to the viewport meta.
- **Extend content under bars.** Full-bleed media and backgrounds run under the tab bar and toolbars; controls float on glass above them.

## Shapes

WWDC25, "Get to know the new design system":
- **Fixed:** a constant radius. Use it for cards and images.
- **Capsule:** radius = half the height (`rounded-full`). Use it for buttons, segmented controls, tab bars, search fields, chips, switches and sliders: everything on touch screens.
- **Concentric:** inner radius = outer radius − padding (minimum about 4 px). Use it for anything nested in a rounded container.

| Element | Radius |
|---|---|
| Phone sheet, desktop dialog | 28 |
| Inset group panel | 12–16 (concentric with what holds it) |
| Card | 16 (12 for small cards) |
| Settings icon tile (29 px) | 7 |
| Menu / popover | 12–14; rows inside are concentric (8–10) |
| Button standalone / in a horizontal row | capsule |
| Buttons stacked vertically | rounded rect (12) |
| macOS small and medium controls | rounded rect (5–6); large controls are capsules |

Check concentricity: draw the outer and inner curves and confirm they run parallel. A 28 px sheet with 16 px padding gives 12 px inner controls.

## Targets

| Platform | Default | Minimum |
|---|---|---|
| iOS / touch | 44 × 44 | 28 × 28 |
| macOS / pointer | 28 × 28 | 20 × 20 |

Hit areas can grow without changing the look. The kit's buttons, switches and segments add an invisible `::after` on `pointer-coarse` screens (`pointer-coarse:after:-inset-y-2`). Small visual controls are fine if their hit area is 44.

## Phone vs desktop at a glance

| | Phone (iOS) | Desktop (macOS) |
|---|---|---|
| Navigation | Floating glass tab bar (3–4 + More), minimises on scroll | Sidebar (glass slab or solid), collapsible to an icon rail |
| Titles | Large title that collapses into an inline title | Title in the toolbar or at the top of content, 22–26 px |
| Actions | Round 44 px glass buttons in the corners; floating action bar | Toolbar capsule groups (at most three groups); ⋯ menus; right-click |
| Rows | 44–52 px, swipe for actions | 28–40 px, hover fill, right-click menu |
| Modals | Bottom sheet with grabber, detents, swipe down | Centred dialog, 28 px radius, Esc |
| Search | Capsule field; floating at the bottom or in the tab bar | ⌘K palette (Spotlight-like) plus an inline field |
| Feedback | Press scale, haptics (Android), push/pop | Hover, press, fade transitions |
