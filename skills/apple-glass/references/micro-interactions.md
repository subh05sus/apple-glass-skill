# Micro-interactions: how it answers a touch

What made SparkMentor feel like an app was not one animation. It was a consistent answer to every touch: things press, slide, settle and confirm the same way everywhere. Use this catalog; don't invent a new spring per component.

## Contents
- Principles (HIG › Motion, plus what worked)
- Tokens
- The catalog: press · selection · scroll · input controls · confirmation · numbers · lists · gestures · surfaces · navigation · appearance · earned moments · desktop-only
- Reduced motion and haptics
- Performance

## Principles

1. **Purposeful.** Motion shows what changed, where something went, or that a touch registered. If it explains nothing, cut it.
2. **Brief and precise.**
   - Taps settle in about 200 ms and panels in about 300 ms.
   - Exits run at about two thirds of the entrance (160 ms).
   - Frequent interactions get the subtlest motion.
3. **Realistic.** Follow the finger 1:1 while dragging, then hand over to a spring carrying the release velocity. Something revealed by sliding down goes away by sliding up.
4. **Never blocking.** People can act mid-animation, and nothing waits on a flourish.
5. **Optional.** Under reduced motion, keep opacity and drop travel, scale and springs. Nothing is communicated only by motion: pair it with text, colour or a haptic.
6. **Critically damped by default.** Things land without bouncing. A touch of overshoot is only for earned moments.

## Tokens (`assets/kit/motion.ts`)

| Token | Value | For |
|---|---|---|
| `SPRING_SNAPPY` | stiffness 520, damping 40 (~200 ms) | Taps, toggles, small state changes |
| `SPRING_DEFAULT` | 380 / 38 (~300 ms) | Panels, sheets, cards entering |
| `SPRING_PAGE` | 300 / 34 (~350 ms) | Full-screen pushes and pops |
| `SPRING_REWARD` | 320 / 22 (damping ratio ~0.6) | Earned moments only |
| `EASE_EXIT` | tween 160 ms, `[0.4, 0, 1, 1]` | Exits |
| `EASE_OUT_CSS` | `cubic-bezier(0.2, 0, 0, 1)` | CSS transitions paired with springs |
| iOS push curve | `cubic-bezier(0.32, 0.72, 0, 1)`, 380 / 340 ms | Page push / pop (CSS) |
| `PRESS_SCALE` / `_ICON` | 0.97 / 0.9 (tabs 0.92) | Press feedback |
| `STAGGER` / `STAGGER_CAP` | 40 ms / 8 items | List entrances |
| `haptic(kind)` | selection 4 ms · tick 8 · success [8,40,12] · warning [12,60,12] | Android vibration; no-op on iOS and desktop |

## The catalog

### Press
| Interaction | Recipe | Kit |
|---|---|---|
| Button press | CSS `active:scale-[0.97]` on `EASE_OUT_CSS` 150 ms; `motion-reduce:active:scale-100` | `button.tsx` |
| Icon button / glass button | `whileTap={{ scale: 0.9 }}` with `SPRING_SNAPPY` | `glass.tsx` |
| Tab | `whileTap={{ scale: 0.92 }}` + `haptic("tick")` | `nav-tab-row.tsx` |
| Row / list item | Background fill on press (`active:bg-[--apple-fill-4]`), **no scale**. Scaling rows makes lists wobble | `inset-group.tsx` |
| Card that opens something | Scale 0.98 + slightly deeper shadow on press; release springs back | — |
| Long press (touch) | Hold scales to 0.97 over 300 ms, then the context menu grows from the item, with a `tick` haptic | — |

### Selection
| Interaction | Recipe | Kit |
|---|---|---|
| Sliding lens | The selected indicator is one shared element (`layoutId`) that travels to the new option (spring 420/34 or 480/34), never two indicators cross-fading | `nav-tab-row.tsx`, `glass-segmented.tsx` |
| Lens swell | An inner span re-keyed per value: `initial={{ scaleX: 1.14, scaleY: 1.08 }} → 1`, spring 520/20. The carrier does the travel, the child the swell, so two transforms never fight | `glass-segmented.tsx` |
| Checkbox / done | `CheckDraw`: disc scales 0.4 → 1 (snappy), tick `pathLength` 0 → 1 over 220 ms after 80 ms. Animates on change only, never on first render | `check-draw.tsx` |
| Chips / filters | Selected chip fills (accent at 15%, accent text); a count badge rolls (`AnimatedNumber`) | — |

### Scroll
| Interaction | Recipe | Kit |
|---|---|---|
| Tab bar minimise | Scroll down more than 8 px: collapse (62 → 50 px, labels `grid-rows-[0fr]`, 300 ms). Scroll up more than 8 px, or within 40 px of the top: expand. Listen in the capture phase so nested scrollers count | `bottom-nav.tsx` |
| Large title → inline | IntersectionObserver on the large title; the inline title fades in over 150 ms with the scroll-edge strip | — (pattern below) |
| Scroll edge | A gradient strip under floating bars; static, not animated | `liquid-glass.css` |
| Floating bars follow the tab bar | Read `--tabbar-live-h` in `bottom`, with `transition: bottom 300ms` | `floating-action-bar.tsx` |

```tsx
// Large title that hands over to an inline title.
const titleRef = useRef<HTMLHeadingElement>(null);
const [scrolled, setScrolled] = useState(false);
useEffect(() => {
  const el = titleRef.current;
  if (!el) return;
  const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting), {
    rootMargin: "-44px 0px 0px 0px", // the top bar's height
  });
  io.observe(el);
  return () => io.disconnect();
}, []);
// <header data-scrolled={scrolled}> … <span className="opacity-0 transition-opacity duration-150 data-[scrolled=true]:opacity-100">{title}</span>
// <h1 ref={titleRef} className="text-large-title font-bold">{title}</h1>
```

### Input controls
| Interaction | Recipe | Kit |
|---|---|---|
| Switch | The knob widens 22 → 26 while pressed (`group-active`), 200 ms | `switch.tsx` |
| Save on flip | Moves at once, then "Saved ✓" fades in for 1.4 s; on failure it slides back with "Couldn't save" for 2.6 s and a `warning` haptic | `save-switch.tsx` |
| Slider | The thumb follows the finger 1:1 (motion value); the value snaps underneath with a `selection` haptic per step; a spring onto the step on release; while held, the thumb swells into clear glass and the value bubble pops up (spring 520/30) | `glass-slider.tsx` |
| Text field focus | Ring fades in over 150 ms; the label stays put. Clear button scales in when there's text | `search-field.tsx` |
| Invalid input | Inline message slides down 4 px and fades in; field border red. For a wrong code or password only: a shake (3 cycles, ±6 px, 300 ms) + `warning` haptic | — |

### Confirmation
| Interaction | Recipe | Kit |
|---|---|---|
| Async button | Spinner replaces the label and the width is kept; success: a check pops (`zoom-in-50`, 200 ms) for about 1 s, then back. `useAsyncAction` drives it | `button.tsx`, `use-async-action.ts` |
| Copy | The icon morphs copy → check (crossfade with scale 0.8 → 1), back after 1.2 s; "Copied" tooltip | — |
| Saved inline | "Saved ✓" fades in beside the control, never a toast | `save-switch.tsx` |
| Toast | A pill slides from the top with `SPRING_DEFAULT`; swipe to dismiss; one at a time | — |

### Numbers
| Interaction | Recipe | Kit |
|---|---|---|
| Changing count or balance | `AnimatedNumber`: an odometer roll, up when it grows and down when it shrinks, `SPRING_SNAPPY`, `tabular-nums` | `animated-number.tsx` |
| Gain | `showDelta`: "+N" rises 18 px and fades over 1.4 s in green, with a `success` haptic; never on first render | same |
| One-time result | `CountUp`: 0 → value over 0.9 s, decelerating | same |

### Lists
| Interaction | Recipe | Kit |
|---|---|---|
| Entrance | Fade + rise 8 px, `STAGGER` 40 ms, capped at 8 items, so long lists never drag. Only on first load, not on every refetch | `motion.ts` (`staggerDelay`) |
| Insert | `AnimatePresence` + `layout`: the new row expands from height 0 and fades in; neighbours glide (`SPRING_DEFAULT`) | — |
| Delete | The row collapses (height → 0, 160 ms) and fades out; undo toast | — |
| Reorder | Drag lifts the row (scale 1.02, shadow); others glide out of the way with `layout`; `tick` haptic on each slot change | — |
| Pull to refresh | Rubber-band pull (resistance), a threshold tick, a spinner held while loading, a spring back | *SparkMentor `components/pull-to-refresh/`* |

```tsx
<AnimatePresence initial={false}>
  {items.map((item) => (
    <motion.li
      key={item.id}
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0, transition: EASE_EXIT }}
      transition={SPRING_DEFAULT}
    >
      <Row item={item} />
    </motion.li>
  ))}
</AnimatePresence>
```

### Gestures
| Interaction | Recipe | Kit |
|---|---|---|
| Swipe row | Drag on x with a rubber band; actions reveal under the row; past 72 px a `tick` haptic, and release completes; otherwise a spring back | `row-actions.tsx` |
| Sheet drag | Follows the finger; release with velocity picks the detent or dismisses; the backdrop fades with progress | `drawer.tsx` (vaul) |
| Back swipe (phone) | Leave it to the browser's own edge swipe; don't fight it with custom handlers | — |

### Surfaces
| Interaction | Recipe | Kit |
|---|---|---|
| Sheet open | Rises with `SPRING_DEFAULT`; backdrop fades to 40% black (dark: 60%) | `drawer.tsx` |
| Dialog | Fade + zoom 0.95 → 1, 200 ms; exit faster | `dialog.tsx` |
| Menu / popover | Grows from the trigger's corner (`transform-origin` from Radix), scale 0.96 → 1, about 150 ms | — |
| Floating bar | Rises in (y 24 → 0 + fade); its content cross-fades on `barKey` | `floating-action-bar.tsx` |

### Navigation
| Interaction | Recipe | Kit |
|---|---|---|
| Drill-down (phone) | iOS push: new page slides in from the right (380 ms, `0.32,0.72,0,1`) over the old one, which shifts −28% and dims to 0.94; back = pop (340 ms) | `page-transitions.css`, `page-transition.tsx`, `nav-direction.ts` |
| Tab switch | No animation, like a native tab bar | same |
| Desktop page change | Old page fades out (120 ms), new one fades in and rises 8 px (220 ms) | same |
| Shared element | `view-transition-name` on the tapped card and the detail hero morphs one into the other; use it for one hero per flow at most | — |

Gotcha: never put `:not()` before `::view-transition-*()`. Tailwind v4's minifier drops that selector in production builds, and nothing warns you. Write the default rule plainly, then override it with `html[data-nav="…"]` rules. Details in the kit README.

### Appearance
| Interaction | Recipe | Kit |
|---|---|---|
| Theme / text size switch | One whole-page cross-fade (view transition, 280 ms), with CSS transitions disabled during the swap so elements don't animate at their own pace | `page-transitions.css`; SparkMentis `lib/appearance.ts` `switchAppearance` |

### Earned moments
Rare by design; they are worth more because the rest is calm.

| Interaction | Recipe | Kit |
|---|---|---|
| Droplet wobble + shine | The pane squishes like a droplet (scaleX/scaleY keyframes keeping volume), a band of light sweeps across, a bloom with a faint rainbow fringe. Idle hint for the one creating action: after 3 s idle, every 12 s, at most 3 times | `compose-shine.tsx`, `bottom-nav.tsx` |
| Goal reached / badge unlocked | `SPRING_REWARD` scale-in, a `success` haptic, the number counting up; confetti only for the biggest moments | SparkMentor achievement unlock (keep as is) |

### Desktop-only
- **Hover:** a background fill in 120 ms (`hover:bg-foreground/5`). Tailwind v4's `hover:` only applies on devices that can hover, so touch never gets sticky hovers.
- **Tooltips:** after 500 ms, then instant while moving between items. Text only, short.
- **Keyboard focus:** a 2 px ring 2 px off the control (`focus-ring.css`). No animation.
- **Right-click** opens the same actions as swipe or ⋯.

## Reduced motion and haptics

- **One switch:** `<MotionProvider>` (`MotionConfig reducedMotion="user"`). Motion components then keep opacity and drop transforms and layout animation.
- Components with a better fallback read `useReducedMotion()`. Examples: the slider without its swell, `CountUp` showing the final value, the shine never playing.
- CSS animations: `motion-reduce:` utilities and the `prefers-reduced-motion` block in `page-transitions.css`.
- **Haptics:** Android only (`navigator.vibrate`). iOS Safari has none, so a haptic can never be the only signal.

## Performance

- Animate `transform` and `opacity` only. Height animations are fine for single rows (insert/delete), never for big lists or the page.
- Measure-free layouts: grid-rows `0fr/1fr` for collapsing labels; whole-segment transforms for equal segmented controls.
- No per-frame work in React state. Motion values and `requestAnimationFrame` handle drags.
- Glass: limit the refraction lens to a few panes, rebuild maps only when sizes settle, and never put the lens on something that resizes every frame.
- Test with Chrome's 4× CPU throttling on a phone viewport. A dropped frame on a press is a bug.
