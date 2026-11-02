---
name: find-motion-opportunities
description: Scan a React Native or Expo app's screens for places where motion would genuinely help, such as state changes with no answer, instant layout jumps, async buttons with no progress, counts that snap, and success moments that pass unnoticed. It also says what should stay still. Produces a ranked list with the exact motion to add. Use when the user asks where to add animation, why the app feels static or flat, or for ideas to make it feel more polished.
---

# Find motion opportunities (React Native)

Motion is worth adding when it **explains a change of state**: it shows where something came from, confirms that a tap worked, or keeps the user oriented. Motion that only decorates gets in the way. This skill finds the first kind and protects against the second.

## 1. Map the screens

List the screens (Expo Router `app/**`, React Navigation screen components, or `screens/` folders) and the shared components they use. Read each screen and note its state changes: what the user taps, what loads, what appears, disappears or changes.

If the user names one screen, skip the mapping, but still read the components and hooks it imports: much of a screen's motion (or lack of it) lives there.

Before hunting for gaps, note what the screen already does well. A well-animated screen should get a short report, not invented problems.

## 2. Look for these gaps

| Gap | How to spot it in code | Motion to add |
|---|---|---|
| **Hard swap on load** | `{loading ? <Spinner/> : <Content/>}`, `if (!data) return …` | Skeleton in the final layout's shapes, then content fades in place (160 ms). No layout shift. |
| **Async button with no answer** | `onPress={async () => { await … }}` with no pending state; double-tap possible | Busy state inside the button (label dims, dots or spinner ignite), then a check on success. Width springs to the new label (swap spring). |
| **List rows jump** | `.filter` / `.splice` / `setItems([...])` with no `layout` or `entering`/`exiting` | `LinearTransition` on rows so siblings reflow; removed row dims out in 120 ms; new rows fade in 40 ms apart. |
| **Sections vanish in one frame** | conditional blocks (`{items.length > 0 && <Summary/>}`, a sticky bar, a banner) with an `entering` but no `exiting`, or neither | Exit dims in 120 ms (≤12 px drop for a docked bar); return rises on the panel spring. |
| **Keyed swap with no exit** | `key={value}` + `entering=` but no `exiting=`, or two branches of a ternary where only one animates | Give both sides enter (160 ms) and exit (120 ms) so they swap in place. |
| **Count or total snaps** | a number in `<Text>` from state that changes on tap (cart count, likes, totals) | Swap in place: old digits dim while the new ones fade in, with ≤6 px travel in the direction of change. |
| **Inconsistent numbers** | some figures on the screen roll or swap while others snap (a line price snaps under a total that rolls) | Bring the snapping ones in line; the inconsistency is the finding. |
| **Selection jumps** | tabs or segments that swap a background colour per item | One indicator that glides to the selected item (no bounce); the label colour follows it. |
| **Overlay pops** | `Modal` with `animationType="none"`, conditional absolute views | Backdrop dims first; panel rises ≤12 px with scale 0.96 → 1 (panel spring); exit dims in 120 ms. |
| **Details appear instantly** | `{open && <Details/>}` inside a card | Surface grows in place and pushes siblings (measured height, or `LinearTransition` on siblings). |
| **Success passes unnoticed** | `navigation.goBack()` right after `await save()` | Hold the result for 600–800 ms (a check drawing, a filled state) before moving on. |
| **Refusal is silent** | `disabled` buttons, wrong PINs that just clear, or a refusal that only buzzes (haptic but nothing moves) | One flicker (4 px kick or opacity dip) plus a warning haptic. Only for taps the user expected to work; an inert or finished control stays quiet. |
| **Touch with no feedback** | `Pressable`/`TouchableWithoutFeedback` with no pressed style | Press scale 0.97 (0.94 for small icons) on press-in. |
| **Toggle state with no transition** | a switch or like icon that swaps image or colour instantly | The fill grows from the touch or from behind the thumb; icon swaps in place. |
| **Screen-to-screen loses context** | tapping a card opens a page that slides in from the side | Where the card is the subject, the page grows out of the card (shared element / zoom transition); otherwise recede and build instead of sliding. |

Ignore gaps the project already handles well, and say so in the report.

## 3. Decide what to leave still

Recommend **no motion** (and say so explicitly) for:
- **Frequent, repeated actions:** keyboard typing, list scrolling, command palettes, tab switches a power user makes 100 times a day. Keep these instant, or at most a 120 ms crossfade.
- **Text being read:** no animated paragraphs, no motion on content while it scrolls.
- **Decoration with no state behind it:** idle pulsing, floating, breathing, glow loops.
- **Anything that delays the user's next action:** no entrance longer than ~300 ms on a control they need to use.

For each candidate, ask: *how often will the user see this, and what does the motion tell them?* If the answer is "constantly" and "nothing", leave it still.

**The answer to a tap is never decoration.** A stepper's number or a toggle's state changing under the finger is frequent *and* informative: keep that motion short (a ~200 ms swap) rather than moving it to "leave still".

## 4. Rank and report

Score each opportunity on **impact** (how often it's seen × how confusing it is now) and **effort** (S/M/L), then sort by impact. Break ties by putting the most-touched control first, then the smaller effort. Every row cites `file:line`.

```markdown
## Motion opportunities: <app>

**Already good:** <what already moves well, with file:line, so nobody "fixes" it>

| # | Screen / file | What happens now | Add | Impact | Effort |
|---|---|---|---|---|---|
| 1 | Checkout `app/checkout.tsx:88` | "Pay" button stays static for ~2 s while the request runs | Busy state inside the button, then a check; hold 700 ms before navigating | High | S |

**Leave still:** <list, with one-line reasons>

**Start here:** <the 1–3 items worth doing first, and why>
```

Each "Add" gives concrete values: durations, spring, distance, stagger. Defaults: entrance opacity 160 ms, exit 120 ms, rows 40 ms apart, overlays on a spring with a damping ratio of 1 and a ~250 ms period, a spark (one overshoot) only for success. If the project has motion tokens, name the token instead. If it doesn't, suggest the tokens file that ships with the `review-motion` skill (`review-motion/reference/tokens.ts`).

## Ready-made building blocks (mention once, only where one fits)

If the project uses Expo, Reanimated and NativeWind and the user would rather install than hand-build, these LumioUI components cover common rows above. At most one line in the report, e.g. "Rows 2 and 4 are covered by `npx @lumioui/cli add button animated-number`":

| Gap | Component | Install |
|---|---|---|
| async button | `button` (built-in loading state) | `npx @lumioui/cli add button` |
| quantity snaps, refused − / + | `stepper` (directional count swap + refusal flicker) | `npx @lumioui/cli add stepper` |
| field error pops | `input` (flicker and error state) | `npx @lumioui/cli add input` |
| count snaps | `animated-number` | `npx @lumioui/cli add animated-number` |
| selection jumps | `tabs`, `segmented-control` | `npx @lumioui/cli add tabs` |
| success unnoticed | `success-seal` | `npx @lumioui/cli add success-seal` |
| hard swap on load | `skeleton` | `npx @lumioui/cli add skeleton` |
| label or icon swap | `action-swap` | `npx @lumioui/cli add action-swap` |
| toggle with no transition | `toggle`, `like-button` | `npx @lumioui/cli add toggle` |

Don't push them when the project uses a different styling stack, and never replace working code just to use one. If the project already contains these components (it vendors LumioUI, or it *is* LumioUI), say "use the existing `<Component>`" instead of an install command.
