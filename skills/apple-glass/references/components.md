# Components: Apple's behaviour, the web recipe and the kit file

Each entry covers what Apple's component does, how to build it on the web, and which kit file already does it. Kit files are in `assets/kit/`. Paths in *italics* live in SparkMentor's repo only.

## Contents
Tab bar · Desktop sidebar · Toolbar and header buttons · Large title header · Inset grouped list · Content rows and swipe actions · Sheets and dialogs · Menus, context menus, popovers · Alerts and confirmations · Segmented control · Switch · Slider · Search and ⌘K · Buttons · Floating action bar · Toasts · Empty, loading and error states · Icons · Badges and status

---

### Tab bar (phone)
**Apple:**
- A capsule of glass floating above content at the bottom, with content peeking through.
- It minimises when you scroll down (to icons, or to the selected tab plus an accessory) and comes back when you scroll up or tap.
- Labels and symbols are monochrome; Search can sit apart at the trailing end.

**Web:**
- `milky` glass capsule, 62 px tall (50 minimised), 16 px side margins, `max(safe-area, 12px)` from the bottom.
- 3 destinations + More in a 4-column grid with 5 px padding. Icons 22 px; labels 10.5 px medium.
- The current tab sits on a `.liquid-lens` that slides between tabs (`layoutId`, spring 420/34). The lens marks the tab, not a colour.
- On minimise, labels collapse with a `grid-rows-[1fr]→[0fr]` transition (no measuring).
- A detached round glass button at the trailing end for the one creating action.
- A scroll-edge fade behind it. Tabs switch in place: no push animation.
- Publish the live height as `--tabbar-live-h` so floating bars above glide with it.
- Hide it in full-screen flows (chat, editors, exams).

**Kit:** `nav-tab-row.tsx`, `bottom-nav.tsx` (`useScrollCollapse`: 8 px dead zone, always expanded in the top 40 px), `compose-shine.tsx`.

### Desktop sidebar (macOS)
**Apple (Tahoe):** a floating slab of glass inset from the window edges, with content extending beneath it. Rows are compact, with leading symbols, section headers in small secondary text, and a rounded selection fill.

**Web:**
- **Option A, glass slab:** fixed, inset 8 px, radius 16–18, width 240–264, `liquid-glass liquid-glass-dense`. It needs something behind it to read as glass (see materials › Tuning).
- **Option B, solid:** flush, `--apple-bg-2`, with a hairline divider.
- Rows: 32 px (comfortable 36), 13–14 px labels, 16–18 px icons, 8 px radius.
- Selected row: `bg-foreground/10` with the label in `--foreground` (accent fill only if the owner wants macOS key-window styling).
- Section headers: 11 px semibold, `--apple-label-3`.
- Collapsible to an icon rail with ⌘B; tooltips on the rail.

**Kit / reference:** SparkMentis `components/shell/app-sidebar.tsx` (shadcn Sidebar), *SparkMentor `components/sidebar/app-sidebar.tsx`* and `components/ui/sidebar.tsx`.

### Toolbar and header buttons
**Apple:**
- Controls float in glass at the top corners.
- Related actions group into one capsule (at most three groups).
- The primary action (Done, Send) is a tinted glass capsule.
- Back is a round glass chevron.

**Web:**
- Phone: `GlassButton size="md"` (44 px). Desktop toolbars: `size="toolbar"` (40 on phone, 36 on desktop) or `sm` (36).
- Icons 18–20 px, monochrome.
- Group with one `GlassSurface` holding several plain buttons (`rounded-full`, inner presses scale 0.9), not one pane per icon. Hairline dividers inside a group (`w-px bg-foreground/10`).

**Kit:** `glass.tsx` (`GlassButton` sizes: sm 36 · toolbar 40/36 · md 44 · lg 60).

### Large title header
**Apple:** the page title sits large (34 bold) at the top of the scrolling content. As it scrolls away, a small inline title (17 semibold) fades into the top bar.

**Web:**
- Render the large title in the content.
- An IntersectionObserver on it toggles `data-scrolled` on the header, which fades in the inline title (150 ms) and the scroll-edge strip.
- Desktop: one title size (22–26), no collapse.
- Under the title, one line of secondary text, at most. The primary action sits at the trailing end, with secondary actions in a ⋯ menu.

**Kit / reference:** *SparkMentor `components/mobile/mobile-page-header.tsx`*, SparkMentis `components/shell/page-header.tsx`.

### Inset grouped list (settings-like pages)
**Apple:** grouped rows in rounded panels on a grouped background:
- an optional caption above (13, secondary)
- rows with an icon tile, label, value and chevron
- inset hairlines that start after the icon
- an optional footnote below (13, secondary)

**Web:**
- The panel is `--apple-grouped-bg-2` (dark #1C1C1E) on `--apple-grouped-bg` (#000), radius 12–16, no border, no shadow.
- Rows are at least 52 px:
  - icon tile 29 px, radius 7, white glyph on a system colour
  - label: body text
  - value: secondary label
  - chevron: tertiary label, 14 px
- Pressing a row fills it with `--apple-fill-4`. Never scale a row.
- Toggles, values and navigation rows sit at the trailing end. Destructive rows are red text, centred, in their own group.

**Kit:** `inset-group.tsx`.

### Content rows and swipe actions
**Apple:** plain lists have full-width rows and hairlines. Swipe left reveals actions (destructive last, red), and a full swipe triggers the first one. A long press opens a context menu.

**Web:**
- Flat rows with `min-w-0` on every text column.
- The whole row is a link through an `::after` overlay on the primary link, never a click handler on a wrapper that also holds buttons.
- On touch: swipe to reveal, with a 72 px threshold, a rubber band past it and a haptic tick at the threshold.
- On desktop: the same actions in a ⋯ menu and on right-click.

**Kit:** `row-actions.tsx`, *SparkMentor `components/ui/list.tsx`*.

### Sheets and dialogs
**Apple:**
- iPhone sheets rise from the bottom, with medium and large detents and a grabber (36×5).
- Swipe down to dismiss; confirm first if there are unsaved changes.
- Cancel or close sits at the leading or trailing corner; Done is the tinted primary.
- macOS sheets are cards floating over a dimmed parent window.

**Web:**
- Phones: a `vaul` drawer (bottom sheet):
  - top radius 28, grabber, sticky footer with actions above the safe area
  - `.surface-sheet` with the elevated background in dark mode
- Desktop: a centred dialog, radius 28, padding 24, max 32 rem, a round close disc (32 px) at the top trailing corner, Esc to close.
- One component chooses between them by viewport. Lock dismissal while something must finish (an upload, a create).

**Kit:** `responsive-sheet.tsx`, `drawer.tsx`, `dialog.tsx`.

### Menus, context menus, popovers
**Apple:**
- iOS context menus grow out of the item; rows show the symbol at the trailing end.
- Groups are split by thicker dividers; destructive items are red and last.
- macOS menus are compact (22–24 px rows) with leading symbols and keyboard shortcuts at the trailing end.

**Web:**
- Solid `.surface-menu` (elevated): radius 12–14, padding 6. Never glass.
- Rows: 44 px on touch, 32 on desktop; radius 8 (concentric).
- Icons trailing on phones, leading on desktop.
- Shortcuts on the right in `--apple-label-3` (`Kbd`).
- Open: scale 0.96 → 1 plus fade from the trigger's corner, about 150 ms. Close: about 100 ms.
- z-index above dialogs (menus 200 > dialogs 150).

### Alerts and confirmations
**Apple (iOS 26):** alerts are short, with bolder left-aligned titles and capsule buttons. Use them rarely: for destructive or irreversible choices, never for information.

**Web:**
- **Reversible actions:** do it, then show an undo toast. No dialog.
- **Destructive actions:** an alert dialog with a title that states the consequence ("Delete 3 exams?"), one line of detail, a red destructive button and Cancel.
- **Irreversible actions with scale:** typed confirmation.
- Never use `window.confirm`.

### Segmented control
**Apple:** two to five options. In iOS 26, the track is a soft fill and the thumb behaves like glass while it moves.

**Web:**
- Track `bg-foreground/6` (on colour: `bg-black/15 ring-white/20`), `p-1`, capsule.
- Segments 32 px (`sm` 28); labels 14 (`sm` 12) medium.
- The `.liquid-lens` thumb slides (spring 480/34) and swells as it lands (scaleX 1.14 → 1, spring 520/20).
- `equal` mode slides the thumb by whole segment widths: a pure transform, no measuring.
- Tabs mode is `role="tablist"` with arrow keys.

**Kit:** `glass-segmented.tsx` (the lens is signed off).

### Switch
**Apple:** a pill switch whose knob stretches while pressed. In iOS Settings, flipping it applies at once, with no Save button.

**Web:**
- 44×26 with a 22 px knob. On: the accent. Off: `bg-foreground/15` (`/25` in dark mode).
- The knob widens to 26 while pressed. 200 ms on `cubic-bezier(.2,0,0,1)`.
- `SaveSwitch` persists on flip:
  - It moves at once and stays put while saving.
  - On success, "Saved ✓" fades in beside it.
  - On failure, it slides back with a short inline "Couldn't save" and a warning haptic.

**Kit:** `switch.tsx`, `save-switch.tsx`.

### Slider
**Apple:** the thumb turns into glass while dragged; that's the HIG's one allowance for glass in content.

**Web:**
- Track 6 px with a gradient fill in the accent.
- The thumb is a white capsule (40×24) at rest. When grabbed it swells (1.55 × 1.3), the white fades out and clear glass shows the track bending through it.
- The value floats above in a solid bubble.
- It snaps per step with a haptic tick; arrows, PageUp/Down, Home and End work.

**Kit:** `glass-slider.tsx` (look frozen).

### Search and ⌘K
**Apple:** search is a capsule field. iOS 26 often places it at the bottom, or as a separate tab in the tab bar. The Mac has Spotlight.

**Web:**
- Phone: a capsule field, 36–44 px.
  - `tinted` (`--apple-fill-3`) on a page; `glass` when floating.
  - Clear button when it has text; Cancel slides in while focused.
- Desktop: a ⌘K palette (Spotlight-like):
  - centred near the top, 560–640 wide, solid elevated surface, 18–20 px input
  - results grouped with headers, keyboard-first, recent items when empty
- Results: most relevant first, grouped by type.

**Kit:** `search-field.tsx`; palette reference: SparkMentis `components/shell/command-palette.tsx` (cmdk).

### Buttons
**Apple:**
- Capsules for standalone buttons and horizontal rows; rounded rectangles in vertical stacks.
- Prominent = accent background (tinted). Secondary = gray fill. Plain = text only.
- Sizes on iOS 26: large controls about 50 px tall; regular 44; small 34 or less.

**Web:**
- Prominent: `bg-primary text-primary-foreground`.
- Secondary: `bg-foreground/8` (or `--apple-fill-3`).
- Plain: `text-primary`.
- Heights: 50 (phone primary CTA, full width in sheets), 44 (phone), 36 (desktop), 32 (dense).
- Press: scale 0.97.
- Loading: the spinner replaces the content and the width is kept. Success: a check pops for about a second.
- One prominent button per view.

**Kit:** `button.tsx`, `use-async-action.ts`.

### Floating action bar
**Apple:** primary actions within thumb reach at the bottom, on glass, above the tab bar.

**Web:**
- Fixed above the tab bar and aligned to the content column, not the window.
- A spacer of its height stays in the flow, so the last line isn't hidden.
- Changing its contents (`barKey`) cross-fades.
- Keep it mounted and toggle `open`, so the exit can play.

**Kit:** `floating-action-bar.tsx`.

### Toasts
**Apple:** the system uses compact pills ("Copied", AirPods) and Live Activities; never stacks of cards.

**Web:**
- A solid dark pill (light pill in light mode), about 44 px tall: one icon (success green / error red), one short line, an optional single action.
- Top centre on phones (clear of the notch), bottom centre or top right on desktop. About 4 s; swipe to dismiss.
- Only for results of async actions. Validation is shown inline.
- z-index above sheets (300).

**Reference:** SparkMentis `components/ui/sonner.tsx` (styled sonner); SparkMentor uses sileo.

### Empty, loading and error states
- **Empty:**
  - a symbol in a soft circle (`--apple-fill-4`, 56 px, glyph in `--apple-label-3`)
  - a title (17 semibold) and one line (15, secondary)
  - one action
- **Loading:** skeletons shaped like the content, in `--apple-fill-4`, without shimmer (Apple uses quiet placeholders). For short waits, show nothing for the first 150 ms, then the skeleton.
- **Error:** a plain sentence and Retry. Details go to logs, not the screen.

### Icons
- Lucide at stroke 1.75–2 matches San Francisco's regular weight. Match icon weight to the adjacent text weight.
- Tab bar 22 px; rows 18–20; inline 16.
- Use filled variants for a selected tab where the set has them.
- Monochrome by default. Colour only for state and Settings-style tiles.

### Badges and status
- Small capsules with a tinted fill at 15% and text in the system colour (`bg-[--apple-green]/15 text-[--apple-green]`), or a 6–8 px dot plus a label.
- Counts on icons: a red capsule, 11 px semibold white, minimum 18 px.
