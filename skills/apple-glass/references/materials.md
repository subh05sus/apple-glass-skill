# Materials: Liquid Glass and the solid surfaces

## Contents
- Apple's model (HIG, Materials and Color, 2025)
- The web recipe, layer by layer
- Variants and tokens
- Where glass goes, and where it never goes
- The refraction lens
- Surface styles and accessibility fallbacks
- Scroll edges and bar materials
- Tuning closer to Apple (owner decision)

## Apple's model

Source: developer.apple.com/design/human-interface-guidelines/materials, plus the Color, Layout, Toolbars, Tab bars and Sidebars pages.

- **Two kinds of material.**
  - **Liquid Glass** is a functional layer for controls and navigation (tab bars, toolbars, sidebars) that floats above the content and lets it peek through.
  - **Standard materials** (ultra-thin, thin, regular, thick blurs) give structure inside the content layer.
- **No Liquid Glass in the content layer.** It muddles the hierarchy. The one exception is a content-layer control with a transient interactive part, such as a slider or toggle, which may turn to glass while someone is using it.
- **Use it sparingly.** Limit it to the most important functional elements. Overused glass distracts from the content it is meant to serve.
- **Regular vs clear.**
  - Regular blurs and shifts the luminosity of what is behind it to keep labels legible. Most components use it, including anything text-heavy such as alerts, sidebars and popovers.
  - Clear is highly translucent and only for controls over visually rich media such as photos or video. When the media is bright, put a dark dimming layer of about 35% behind it.
- **Glass adapts.**
  - Small elements (toolbars, tab bars) flip between a light and a dark look depending on what's beneath them, and their symbols and labels stay monochrome, darker over light content and lighter over dark.
  - Large elements (sidebars) are more opaque, so richer content stays legible.
- **Colour.**
  - Glass has no colour of its own; it takes colour from what's behind it.
  - Tint sparingly. To emphasise a primary action, colour its background, not its symbol.
  - Don't tint the backgrounds of several controls.
  - Over colourful content, keep bar labels monochrome.
- **Scroll edge effects replace solid bar backgrounds.** Content blurs and fades as it slides under a floating bar, which keeps the bar's labels legible without making the bar opaque.
- **Standard materials in content.**
  - Thicker materials suit text with fine detail; thinner ones keep context visible.
  - Put label colours (secondary, tertiary) on materials rather than greys like `systemGray3`, which disappear.
- **Accessibility settings change glass.**
  - Reduce Transparency makes it frostier and more opaque.
  - Increase Contrast makes it mostly solid with a contrasting border.
  - Reduce Motion tones the effects down and removes the elastic behaviour.

## The web recipe

From `assets/kit/liquid-glass.css`, `liquid-lens.js` and `glass.tsx`, bottom layer first:

1. **Backdrop.** `backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate)) brightness(var(--glass-luma))` turns what's behind into soft colour. Brightness goes up in light mode (1.05) and down in dark mode (0.85): Apple's "luminosity shift".
2. **Fill.** `background: var(--glass-tint)`, a translucent neutral.
3. **Glow** (`::before`). Light pooled just under the top edge, a vertical gradient over about the first 20 px. It reads as the pane's thickness.
4. **Specular hairline** (`::after`). A 1 px ring drawn as a masked gradient (`mask-composite: exclude`) so it follows any radius:
   - brightest along the top
   - fading down the sides
   - a faint catch-light at the bottom

   Never use a uniform border. That is what makes web glass look cheap.
5. **Bevel** (`--glass-rim`). Inset light along the curved edge: a bright 1 px catch on the top-left, a dimmer one bottom-right, a faint inner glow. On the frosted path (Safari, Firefox) this is what still reads as a thick edge.
6. **Lift.** A soft, deep shadow: `0 12px 30px -10px` at 65% in dark mode.
7. **Lens** (Chromium only). `GlassSurface` (or `attachLiquidGlass` without React) swaps the backdrop filter for `saturate brightness url(#lens)`. This is the part that makes it Liquid Glass. See the next section but one.

Put `.liquid-glass` in `@layer components` so Tailwind utilities (`absolute`, `rounded-full`, `bg-*`) can still override it, and give it `position: relative; isolation: isolate` so the pseudo-layers stay under its children.

## Variants and tokens

| Class / prop | Use | Light tint | Dark tint |
|---|---|---|---|
| `.liquid-glass` (regular) | Default for floating controls and bars | white / .42, blur 12 | rgb(36 36 42 / .46), blur 14, luma .85 |
| `+ .liquid-glass-milky` | Bars that hold text: tab bar, floating action bars, composer | white / .62 | rgb(40 40 46 / .62) |
| `+ .liquid-glass-dense` | Fields with typed text (Ask bar), landing navbar | white / .74, blur 20 | rgb(36 36 42 / .74) |
| `+ .liquid-on-dark` (with dense) | Dense glass over a known-dark section, whatever the theme | — | rgb(22 22 26 / .58) |
| `variant="clear"` | Controls over photos and video only; add `.liquid-dim` / `.liquid-dim-top` (35% gradient) when the media is bright | white / .30, blur 3 | white / .15 |
| `tone="destructive"` | The single coloured pane: End call | rgb(220 38 38 / .85) | / .80 |
| `.liquid-lens` | The selected tab or segment inside a bar, a smaller denser pane | white / .35 + inset glow | white / .14 |

Every value is a custom property:
- `--glass-tint`, `--glass-blur`, `--glass-saturate`, `--glass-luma`, `--glass-rim`
- `--glass-edge-top`, `--glass-edge-side`, `--glass-edge-low`, `--glass-edge-bottom`
- `--glass-glow`, `--glass-shadow`, `--glass-veil`
- `--glass-solid`, `--glass-solid-edge`

So a new variant is a new class that sets properties. Never edit the shared ones.

## Where glass goes

| Glass | Never glass |
|---|---|
| Phone tab bar (milky) and its compose button | Cards, list rows, inset groups, panels |
| Toolbar and header icon buttons (`GlassButton`, 44 px on phones) | Page backgrounds, section headers |
| Floating action bars above the tab bar | Menus, context menus, popovers, selects (solid `.surface-menu`) |
| Search field when it floats over content | Dialogs, sheets, drawers (solid `.surface-sheet`, elevated) |
| Chat composer and "Jump to latest" | Toasts (solid dark pill) |
| Desktop sidebar as a floating slab (if chosen) | Tables, charts, form fields on a page |
| Segmented control thumb (`.liquid-lens`); slider thumb while held | A pane inside another pane (glass on glass) |
| Controls over media (clear + dim) | Anything purely decorative |

Count the panes on a screen. More than about six visible at once usually means some belong in the content layer.

## The refraction lens

Apple's Liquid Glass is a thick, clear slab with rounded edges, not a frosted sheet. Its look comes from the rim:
- **Lensing.** Light through the curved edge bends inward, so the content behind is pulled toward the rim and magnified there. Stripes and text curve as they pass under the edge. The flat face stays clear.
- **Specular rim.** The curved edge catches the light as a thin bright line, brightest on the side facing the light and dimmer opposite.
- **A little dispersion.** Colour fringes faintly where the bend is strongest.

A blur with a hairline border has none of this, which is why it reads as generic glassmorphism.

**How `liquid-lens.js` builds it** (Chromium):
1. **Edge profile.** A convex squircle, `h(x) = (1 − (1 − x)^4)^(1/4)`: vertical at the rim, flat where the bezel meets the face, like Apple's continuous curves.
2. **Refraction.** A ray looking straight down meets the surface at that profile's slope and refracts by Snell's law (n = 1.5). Its sideways travel through the glass beneath is the push.
3. **No folding.** The optical push drops steeply at the very rim, which would fold the content into stretched streaks and a mirror image. The profile is flattened so the sample position keeps rising: the rim magnifies at most 3× (`MAX_MAGNIFY`) and never folds.
4. **Maps.** A displacement map (red = x, green = y, 128 = none) and a specular map (white, alpha = rim light) are drawn for the element's exact width, height and radius.
5. **Filter.** Frost lightly → displace each RGB channel slightly differently (the fringe) → screen them back together → lay the specular map over the result. `saturate()` and `brightness()` run *before* the filter so the rim light isn't dimmed.
   - `feDisplacementMap` moves pixels by `scale × (value − 0.5)`, so a full-strength map value moves `scale / 2`. The code sets `scale = 2 × push`.

**Defaults**

| | Regular | Clear |
|---|---|---|
| Bezel (share of the short side that curves) | 42%, max 26 px | 48%, max 40 px |
| Push at the rim | 0.75 × bezel, max 30 px | 0.8 × bezel, max 48 px |
| Slab thickness (× bezel) | 0.9 | 1.2 |
| Frost before the bend | 2 px | 0.6 px |
| Colour fringe | 0.06 | 0.07 |
| Specular strength | 0.85 | 1 |

Override any of them per pane: `GlassSurface` props `bezel`, `depth` (the push), `blur` (the frost), `chroma`, `specular`.

**Usage**
- **On by default** for `GlassSurface` and for `GlassButton` at md/lg sizes. Turn it off (`refract={false}`) for small or dense panes, panes repeated in lists, and anything that resizes continuously.
- **Without React:** `attachLiquidGlass(el, { variant: "regular" | "clear", radius })` on an element with `.liquid-glass`. It returns a function that removes the lens. `demo/index.html` in the repo shows it over busy content.
- **Support.** Only Chromium applies an SVG filter inside `backdrop-filter`. Safari (every iOS browser) and Firefox get the frosted layers and the bevel. Judge the design in Soft mode too.
- **Cost.**
  - Two per-pixel canvases and data URLs per pane, rebuilt only when the size settles (160 ms after the last resize), never per frame. The refraction profile is computed once per strength and cached.
  - Each rebuild gets a fresh filter id, because some engines cache filter output by id.
  - Keep it to a handful of hero controls per screen.
- **Checking it.** Put the pane over text and stripes, then compare with the lens on and off. Stripes should curve into the rim, the edge text should look magnified, the middle should stay readable, and nothing should look smeared or mirrored. If it does, lower the push or raise the bezel.

## Surface styles and fallbacks

Settings › Appearance › Surface style is stored per browser and applied as `data-glass` on `<html>` before first paint:

| Style | `data-glass` | What happens |
|---|---|---|
| Clear (default) | `on` / none | Glass, with the lens where supported |
| Soft | `frosted` | +10 px blur, a veil over the tint (`--glass-veil`), no lens; steadier and cheaper |
| Solid | `off` | Opaque `--glass-solid` with a neutral hairline; no blur, glow or lens; other `backdrop-blur` surfaces go opaque too |

**Automatic fallbacks:**
- **Reduce Transparency** (`prefers-reduced-transparency`) gets Soft until a style is chosen, not Solid. Windows sends this signal for its "Transparency effects" switch, and many people turn that off without wanting an opaque app.
- **No `backdrop-filter`** (`@supports not`) goes solid, because a translucent fill with nothing blurred behind it only looks broken.
- **Increase Contrast** (`prefers-contrast: more`) always follows the OS: a solid background with a 1 px outline in the foreground colour, a black clear variant, and a 2 px outline instead of the lens.

## Scroll edges and bar materials

- `.scroll-edge-top` / `.scroll-edge-bottom` are gradient strips (background → 65% → transparent) placed under a floating bar.
- The phone tab bar uses `bg-linear-to-t from-background/70 via-background/25 to-transparent`, 112 px tall, behind the bar.
- `.material-bar` is full-width chrome (a desktop header, the status-bar scrim): the page colour at 80% over `blur(16px) saturate(180%)`. It follows the surface style too.
- Sticky section headers inside content can use `bg-background/80 backdrop-blur`. The Solid style turns these opaque automatically, by attribute selector.

## Tuning closer to Apple (owner decision)

The current recipe is signed off. Raise these as choices, never as silent changes:

- **Neutral dark tint.** Apple's dark greys carry a +2 blue cast (28,28,30 · 44,44,46). The current dark tint, 36,36,42, is cooler. A stricter match is `--glass-tint: rgb(30 30 32 / .5)` with `--glass-luma: .8`. Test it over busy content and over plain black before proposing it.
- **Appearance flip for small bars.** Apple flips small bars light or dark depending on what's behind them. The web can't read the backdrop's pixels, but it can read the colour of the elements under the bar. SparkMentor's landing navbar does this (`useOverDark` in `components/landing/Navbar.tsx`):
  - On scroll (once per frame), it takes three points across the bar and calls `document.elementsFromPoint`.
  - It walks up to the first opaque background and computes its luminance; below 0.18 counts as dark.
  - When most points are dark, it adds `.liquid-on-dark` and switches the labels to white.

  Use it only where the page really alternates between light and dark sections.
- **Desktop sidebar as glass.** It only reads as glass if something sits behind it. On a flat page, either give the window a very subtle brand-tinted backdrop (about 6% radial) or keep the sidebar solid. Ask.
