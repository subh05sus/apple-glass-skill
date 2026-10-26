# Apple's palette: dark mode done Apple's way

Ready-made CSS for everything here is in `assets/kit/apple-tokens.css`.

## Contents
- How Apple's dark mode works
- System colours (exact, iOS 26 / macOS Tahoe)
- Greys
- Backgrounds, labels, fills, separators (iOS)
- macOS desktop neutrals
- Mapping onto the app's tokens
- The accent colour
- Contrast rules
- Common mistakes

## How Apple's dark mode works

- **Dimmer backgrounds, brighter foregrounds, not an inversion.** Many colours change between modes, but not all of them flip.
- **Base and elevated** (iOS). The base set recedes: the page, which is pure black. The elevated set advances: anything presented on top, such as a sheet, popover or a window in multitasking. Without elevation, a sheet on a black page merges with it.
- **Semantic colours, not values.** Pick a colour by its job (a page background, a grouped cell, secondary text, a separator) and let the token resolve per mode. Never reuse a colour for a different job: a separator colour as text, or a secondary label colour as a background.
- **Contrast.**
  - Minimum 4.5:1 for text up to 17 pt; 3:1 at 18 pt and above, or for bold text.
  - Aim for 7:1 for custom colours behind small text.
  - Check with Increase Contrast and Reduce Transparency on, alone and together.
- **Soften white images in dark mode.** A white-background image glows on black: dim it slightly (`dark:brightness-90`) or give it a dark mat.
- **macOS:** labels are 85% white, never pure white, and backgrounds are graphite (#1E1E1E content, #323232 window), never black.

## System colours

HIG › Color › Specifications. One palette for iOS, iPadOS, macOS and visionOS (visionOS uses the dark values). Format: R G B.

| Colour | Light | Dark | High contrast, light | High contrast, dark |
|---|---|---|---|---|
| Red | 255 56 60 | 255 66 69 | 233 21 45 | 255 97 101 |
| Orange | 255 141 40 | 255 146 48 | 197 83 0 | 255 160 86 |
| Yellow | 255 204 0 | 255 214 0 | 161 106 0 | 254 223 67 |
| Green | 52 199 89 | 48 209 88 | 0 137 50 | 74 217 104 |
| Mint | 0 200 179 | 0 218 195 | 0 133 117 | 84 223 203 |
| Teal | 0 195 208 | 0 210 224 | 0 129 152 | 59 221 236 |
| Cyan | 0 192 232 | 60 211 254 | 0 126 174 | 109 217 255 |
| Blue | 0 136 255 | 0 145 255 | 30 110 244 | 92 184 255 |
| Indigo | 97 85 245 | 109 124 255 | 86 74 222 | 167 170 255 |
| Purple | 203 48 224 | 219 52 242 | 176 47 194 | 234 141 255 |
| Pink | 255 45 85 | 255 55 95 | 231 18 77 | 255 138 196 |
| Brown | 172 127 94 | 183 138 102 | 149 109 81 | 219 166 121 |

Uses:
- **Status:** green = success, orange = warning, red = destructive and errors.
- **Charts, in this order:** blue, green, orange, purple, teal, pink.
- **Settings icon tiles:** a white glyph on a solid colour square.

Never let colour alone carry the meaning: add a label or a glyph.

## Greys (iOS)

| Grey | Light | Dark | High contrast, light | High contrast, dark |
|---|---|---|---|---|
| systemGray | 142 142 147 | 142 142 147 | 108 108 112 | 174 174 178 |
| systemGray2 | 174 174 178 | 99 99 102 | 142 142 147 | 124 124 128 |
| systemGray3 | 199 199 204 | 72 72 74 | 174 174 178 | 84 84 86 |
| systemGray4 | 209 209 214 | 58 58 60 | 188 188 192 | 68 68 70 |
| systemGray5 | 229 229 234 | 44 44 46 | 216 216 220 | 54 54 56 |
| systemGray6 | 242 242 247 | 28 28 30 | 235 235 240 | 36 36 38 |

Apple's greys lean very slightly blue (B is 2 above R and G). Keep custom neutrals on that axis: zinc and slate sit further off.

## Backgrounds, labels, fills, separators (iOS)

These are the values UIKit's dynamic colours resolve to. The HIG names them but doesn't print values.

| Token | Job | Light | Dark |
|---|---|---|---|
| systemBackground | Plain screen | #FFFFFF | #000000 |
| secondarySystemBackground | Grouping inside it | #F2F2F7 | #1C1C1E |
| tertiarySystemBackground | Grouping inside that | #FFFFFF | #2C2C2E |
| systemGroupedBackground | Page behind inset groups | #F2F2F7 | #000000 |
| secondarySystemGroupedBackground | The group (cells) | #FFFFFF | #1C1C1E |
| tertiarySystemGroupedBackground | Inside a cell | #F2F2F7 | #2C2C2E |
| elevated (1 / 2 / 3) | Sheets, popovers and their contents | #FFF / #F2F2F7 / #FFF | #1C1C1E / #2C2C2E / #3A3A3C |
| label | Primary text | #000000 | #FFFFFF |
| secondaryLabel | Subtitles, values | rgb(60 60 67 / .6) | rgb(235 235 245 / .6) |
| tertiaryLabel | Hints, chevrons, disabled | rgb(60 60 67 / .3) | rgb(235 235 245 / .3) |
| quaternaryLabel | Watermarks | rgb(60 60 67 / .18) | rgb(235 235 245 / .18) |
| placeholderText | Placeholders | rgb(60 60 67 / .3) | rgb(235 235 245 / .3) |
| systemFill | Thin shapes: slider track, switch off | rgb(120 120 128 / .2) | rgb(120 120 128 / .36) |
| secondarySystemFill | Medium shapes | rgb(120 120 128 / .16) | rgb(120 120 128 / .32) |
| tertiarySystemFill | Large shapes: search field, segmented track, secondary buttons | rgb(118 118 128 / .12) | rgb(118 118 128 / .24) |
| quaternarySystemFill | Very large areas | rgb(116 116 128 / .08) | rgb(118 118 128 / .18) |
| separator | Hairlines that let content through | rgb(60 60 67 / .29) | rgb(84 84 88 / .6) |
| opaqueSeparator | Hairlines that don't | #C6C6C8 | #38383A |
| link | Links | system blue | system blue |

Fills and labels are translucent on purpose, so one token works on the base, on a cell and on an elevated sheet. Don't flatten them to hex.

## macOS desktop neutrals

AppKit's dynamic colours (macOS 14–15; Tahoe may differ slightly, so verify in Xcode's colour panel › Developer palette):

| Token | Light | Dark |
|---|---|---|
| windowBackgroundColor | #ECECEC | #323232 |
| controlBackgroundColor / textBackgroundColor (content) | #FFFFFF | #1E1E1E |
| underPageBackgroundColor | #969696 | #282828 |
| labelColor | black / .85 | white / .85 |
| secondaryLabelColor | black / .5 | white / .55 |
| tertiaryLabelColor | black / .26 | white / .25 |
| quaternaryLabelColor | black / .1 | white / .1 |
| separatorColor | black / .1 | white / .1 |
| selectedContentBackgroundColor | #0063E1 | #0058D0 |
| unemphasizedSelectedContentBackgroundColor | #DCDCDC | #464646 |

**macOS selection:** a row in a focused list fills with the accent; when the list loses focus, the fill turns grey (unemphasized).

## Mapping onto the app's tokens

shadcn names, all opt-in (commented out in `apple-tokens.css`):

| App token | Apple token | Notes |
|---|---|---|
| `--background` | `--apple-bg` | Black in dark mode on phones |
| `--card` | `--apple-grouped-bg-2` | Grouped cells and cards on the base |
| `--popover` | `--apple-elevated-bg` (dark: `-2`) | Menus and popovers are presented, so they use elevated colours |
| sheet / dialog surface | `--apple-elevated-bg` | `.surface-sheet` must not use `--background` in dark mode |
| `--foreground` | `--apple-label` | |
| `--muted-foreground` | `--apple-label-2` | Secondary text |
| (new) `--subtle-foreground` | `--apple-label-3` | Hints, chevrons, disabled |
| `--secondary`, `--accent` | `--apple-fill-3` | Secondary buttons, hover fills |
| `--muted` | `--apple-fill-4` | Quiet areas, skeletons |
| `--border`, `--input` | `--apple-separator` | |
| `--destructive` / `--success` / `--warning` | red / green / orange | |
| `--chart-1…5` | blue, green, orange, purple, teal | |
| `--primary` | the product's accent | See below |

**Desktop as macOS:** the "graphite on desktop" choice. Under `@media (min-width: 1024px)`, dark mode takes `--mac-content` for the page, a 5% white lift for cards, `--mac-window` for popovers, 85% labels and white/.1 separators. Phones keep iOS black.

## The accent colour

Apple apps keep their own accent (Notes yellow, Music pink), and so should the product. Rules:

- **One accent.** Use it for the primary action's background, selection, links and key icons. Never use it for body text or for decoration.
- **A dark-mode text tint.** A brand fill colour that's right for buttons is often too dark to read as text on black. Keep a separate text variant (SparkMentor: `--primary-text` = moss-400 in dark, so `text-primary` stays legible) and pass it through `--text-color-primary` in Tailwind's `@theme`.
- **Per-tenant colours** (SparkMentis): derive light and dark variants from the one brand colour and contrast-check them (`assets/kit/brand-palette.ts`: 4.5:1 for text, 3:1 for fills, nudged lighter or darker until they pass).
- **On glass,** colour only the primary control's background, and keep labels monochrome.

## Contrast rules

| Text | Minimum |
|---|---|
| Up to 17 px | 4.5:1 |
| 18 px and above | 3:1 |
| Bold, any size | 3:1 |
| Icons that carry meaning, focus rings | 3:1 against what's next to them |

Check secondary labels (white at .6 on #1C1C1E passes for body text) and tertiary labels (.3 fails as text, which is why they are only for hints and disabled states).

## Common mistakes

- A dark sheet using `--background`: invisible on a black page. Use elevated colours.
- Grey text from Tailwind's palette (`text-gray-400`) instead of label alphas: it reads flat and wrong on Apple greys.
- Zinc or slate neutrals: too blue or too warm next to Apple's greys.
- Pure white (#FFF) for desktop body text: macOS uses 85%.
- Coloured icons everywhere: Apple uses colour for icon tiles in Settings and for state, not on every glyph.
- Shadows as separation in dark mode: on black, shadows vanish. Separate with elevation (a lighter surface) and hairlines.
- A brand colour on large backgrounds in dark mode: keep it to controls and small accents.
