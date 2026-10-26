# The rethink pass, page by page

This is how to take a product's functional pages to the Apple glass look without breaking them. It is the same loop SparkMentor went through: look, audit, ask, build the foundations once, change pages one flow at a time, verify with screenshots.

## Contents
1. Scope
2. Look first: screenshots and the automatic audit
3. Audit each page (template)
4. Ask the owner (question bank)
5. Foundations
6. Pages
7. Verify (matrix) and ship

---

## 1. Scope

- **Pages.** List the routes (`app/**/page.tsx`) and pick the functional pages people use every day: dashboards, the main lists, the main detail pages, create and edit flows, settings. Leave marketing pages, legal pages and rarely used admin pages for later.
- **Group them into flows** (for example, "exams: list → detail → grade → results"). Change a flow at a time, so related pages never disagree.
- **Form factors.** Phone (390 px) gets iOS; desktop (1440 px) gets macOS. Tablets follow the desktop layout with touch targets.
- **What already exists.** Tokens, a glass layer, motion tokens, an Appearance setting. Reuse and extend them rather than fork. In SparkMentor and SparkMentis, most of the kit is already in place.
- **Frozen pieces.** Ask the owner what's signed off and must not change. In SparkMentor: the glass slider thumb, the glass tab bar and segmented lens, the achievement unlock animation.

## 2. Look first

Take screenshots before reading code. You'll catch more by looking than by reading JSX.

```bash
# Local dev server or a test host only, with a test account. Never production or real accounts.
node <skill>/scripts/shoot.mjs \
  --base http://localhost:3000 \
  --out docs/design/apple-glass/before \
  --themes dark,light --viewports phone,desktop \
  --audit \
  /dashboard /exams /exams/123 /settings
```

- **Signing in:** `--login /login --user-field "#email" --pass-field "#password"`. Credentials come from the `SHOOT_USER` / `SHOOT_PASSWORD` environment variables and are never printed.
- **Other options:**
  - `--theme-key` / `--glass-key`: the localStorage keys for theme and surface style.
  - `--surfaces on,frosted,off`: shoot all three surface styles.
  - `--reduced-motion`, `--contrast more`, `--reduced-transparency`: emulate the OS settings.
- **`--audit`** writes `audit.json` and `audit.md` with leads (not verdicts) per page and viewport:
  - off-grid spacing values (odd px)
  - tap targets under 44 px on the phone or 24 px on the desktop (counting `::after` hit-area expansion)
  - text under 11 px
  - low-contrast text, estimated against the nearest opaque background
  - glass inside glass
  - large glass panes in the content layer
  - sideways page scroll
  - more than 7 distinct font sizes on a screen

Open the screenshots. For each page, write down in one sentence what feels un-Apple.

## 3. Audit each page

Copy this per page into `docs/design/apple-glass/audit.md` (or the project's revamp folder):

```markdown
## /exams/[id] — Teacher — "see where this exam stands and do the next thing"
Screens: before/exams_123-dark-phone.png, before/exams_123-dark-desktop.png
- **Job & primary action:** … (is the one primary action obvious? is it the right one?)
- **Hierarchy:** … (what's biggest? squint test; how many text sizes?)
- **Spacing:** … (audit leads + what you see: uneven gaps, cramped rows, margins ≠ 16/32)
- **Layers:** … (what's glass, what should be; glass in content; glass on glass; solid bars that should float)
- **Apple components to swap in:** … (cards → inset group; tabs → segmented; modal → sheet; buttons in rows → swipe/⋯)
- **Feedback & motion:** … (taps with no response; jumps instead of transitions; spinners on blank pages)
- **States:** loading / empty / error / offline / long text / zero / many
- **Dark mode:** … (base vs elevated; raw colours; contrast fails; shadows used for separation)
- **Accessibility:** … (targets, labels, focus, reduced motion)
- **Proposed changes (smallest first):**
  1. …
```

Show the owner a short summary first: the five biggest problems, with screenshots. The full audit can wait.

## 4. Ask the owner

Use the AskUserQuestion tool in rounds:
- Up to four questions per round, two to four options each.
- The recommended option first, labelled "(Recommended)", with the reason in its description.
- ASCII previews for anything about layout.
- Multi-select for lists.

Plain words: say what people will see, not how it's built. Record every answer at once in `decisions.md` (the owner's words, dated) and never ask a decided question again. Skip questions the project has already answered. Small scopes need 2–3 rounds, a whole app 5–6.

**Round 1: direction**

| Question | Options (recommended first) |
|---|---|
| How Apple should dark mode be? | **iOS black on phones, macOS graphite on desktop** (most faithful) · iOS black everywhere · Keep our dark colours, add glass and motion only |
| How much glass? | **Apple's rule: floating controls only** (tab bar, toolbar buttons, floating bars, search) · Also the desktop sidebar as a glass slab · Minimal: tab bar and floating buttons |
| Desktop density? | **Comfortable: macOS hierarchy, 15 px body, 36–40 px rows** · macOS exact: 13 px body, 28 px rows · Same as phone |
| Which pages first? (multi) | The daily flows per role, from the scope list |

**Round 2: navigation and chrome**

| Question | Options |
|---|---|
| Phone navigation | **Floating glass tab bar that shrinks on scroll** · Fixed bar · Menu button |
| Page titles | **Large title that collapses into the top bar (phone); one title size on desktop** · Always small |
| Desktop sidebar | **Collapsible sidebar with an icon rail (⌘B)** · Glass slab floating over a subtle backdrop · Top navigation |
| Search | **⌘K palette on desktop + capsule field on phones** · Field in the header only |

**Round 3: components**

| Question | Options |
|---|---|
| Lists | **Inset groups for settings-like pages, flat rows for content** · Cards everywhere · Flat everywhere |
| Row actions | **Swipe on phones, ⋯ and right-click on desktop** · Always-visible buttons |
| Pop-ups | **Bottom sheets on phones, centred dialogs on desktop** · Dialogs everywhere |
| Confirming | **Undo for reversible actions, an alert only for destructive ones** · Always ask first |

**Round 4: motion and feedback**

| Question | Options |
|---|---|
| Motion level | **Calm, like Apple: quick springs, no bounce** · Livelier: more springs and flourishes · Minimal: fades only |
| Earned moments (multi) | Finishing a task / Goal reached / Streak / Payment done / None |
| Page transitions | **iOS push and pop on phones, a short fade on desktop** · Fade everywhere · None |
| Vibration on Android | **Light ticks on toggles, tabs and success** · Off |

**Round 5: colour**

| Question | Options |
|---|---|
| Accent | **Keep our brand colour as the accent** · Apple blue · Per-school colour (multi-tenant) |
| Status and chart colours | **Apple's system colours** · Keep ours |
| Settings icon tiles | **Coloured tiles like iOS Settings** · Monochrome icons |

**Round 6: settings and accessibility**

| Question | Options |
|---|---|
| Appearance settings | **Theme + Surface style (Clear / Soft / Solid) + Text size** · Theme only |
| Default theme | **Follow the device (Apple's guidance), with an override** · Light · Dark |
| Glass default | **Clear, with Reduce Transparency honoured as Soft** · Soft for everyone · Solid |

Example preview for a layout question:

```
Floating glass tab bar                  Fixed bar
┌──────────────────────────┐            ┌──────────────────────────┐
│ Exams                    │            │ Exams                    │
│ ┌──────────────────────┐ │            │ ┌──────────────────────┐ │
│ │ Unit test · Physics  │ │            │ │ Unit test · Physics  │ │
│ └──────────────────────┘ │            │ └──────────────────────┘ │
│                          │            │                          │
│ ╭──────────────────╮ ╭─╮ │            │                          │
│ │ ⌂   ▤   ✎   ···  │ │+│ │            ├──────────────────────────┤
│ ╰──────────────────╯ ╰─╯ │            │  ⌂     ▤     ✎     ···   │
└──────────────────────────┘            └──────────────────────────┘
```

## 5. Foundations (once)

Settle these in order, each a small commit:
1. **Tokens.** The palette decision (`apple-tokens.css` mapping), type tokens, radius and spacing. Check every page still renders.
2. **The glass layer.** `liquid-glass.css`, `glass.tsx`, `glass-preference.ts` + boot script, `motion.ts` + `MotionProvider`, `focus-ring.css`.
3. **Appearance settings.** Theme, Surface style, Text size, applied before first paint.
4. **The shell.** Tab bar, sidebar, header, page transitions, ⌘K.

## 6. Pages

For each flow, with the owner's decisions in hand:
- Make the **smallest change that reaches the look.** Restructure only when the audit shows the structure is the problem.
- **Fix spacing in the same change** as the redesign (grid values, margins, row heights, group gaps), never as a separate sweep that touches every file.
- **Swap in Apple components:**
  - inset groups for settings-like content
  - a segmented control for 2–5 views
  - sheets for pop-ups on phones
  - swipe or ⋯ for row actions
  - a large title with collapse
  - `SaveSwitch` for instant settings
  - `AnimatedNumber` for counts that change
  - `CheckDraw` for completion
  - `Button` `loading`/`success` for async actions
- **Design every state.** Skeletons shaped like the content, empty states with one action, a plain error with Retry.
- **Keep the words plain:** sentence case, buttons that say what happens.
- **When something is unclear,** ask a single question, or pick the safer option and write it down for the owner.

## 7. Verify and ship

**The verification matrix.** Use `shoot.mjs` with the flags shown, then actually open the images:

| Pass | Flags |
|---|---|
| Dark, phone and desktop | `--themes dark --viewports phone,desktop` |
| Light, phone and desktop | `--themes light` |
| Surface styles | `--surfaces on,frosted,off` (Soft is what every Safari user sees: no lens) |
| Reduced motion | `--reduced-motion` (and click through: nothing should slide) |
| Increase contrast | `--contrast more` |
| Text size Larger | set the text-size key to `larger` (`--set-storage key=value`) |

**Checks before committing:**
- The audit has no new issues on the changed pages.
- Every tap answers. Press each control on a phone viewport (`--viewports phone`, then use the browser).
- No raw hex or `gray-*` added (`git diff | grep -E "#[0-9a-fA-F]{3,6}|gray-[0-9]"` on the changed files).
- Type-check, lint and tests pass.
- Compare before and after side by side and show the owner the pairs.

**Ship** from `main` with a conventional message (`feat(design): …`). Deploy the way the project deploys, then tell the owner what changed, what is live and what is still to do.
