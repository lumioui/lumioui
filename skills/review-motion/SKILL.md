---
name: review-motion
description: Audit React Native animation code (Reanimated, Animated, LayoutAnimation, gesture handlers) for motion that feels off, such as bouncy springs on UI, slow or sliding exits, missing press feedback, ignored Reduce Motion, and JS-thread work on every frame, then write a fix plan with file:line findings. Use when the user asks to review, audit or polish animations, transitions, gestures or "how the app feels" in a React Native or Expo project.
---

# Review motion (React Native)

Audit the animation code in this project and report what makes it feel cheap, slow or broken, with a concrete fix for each finding. Report first. Only edit code if the user asks you to apply the fixes.

The rules come from one idea: **UI motion should behave like light, not like a rubber ball.** Things arrive fast and settle calmly, leave by dimming, change in place, and answer every touch.

## 1. Find the motion code

Search the source folders (skip `node_modules`, build output and tests):

```bash
rg -n "withSpring|withTiming|withDecay|withRepeat|withSequence|withDelay|useAnimatedStyle|useDerivedValue|useAnimatedReaction|interpolateColor|cancelAnimation|runOnJS|scheduleOnRN|entering=|exiting=|layout=|LayoutAnimation|Animated\.(timing|spring|Value)|Gesture\.(Pan|Tap|Pinch|LongPress)|onScroll|scrollTo|measureInWindow|useReducedMotion|ReduceMotion|disabled=" --type-add 'rn:*.{ts,tsx,js,jsx}' -t rn
```

Find the project's press wrapper or press hook (a `Button`, `Press`, `usePressAnimation`…) for rule 3; audit it once rather than every call site.

**If the user names a screen or folder,** start there and follow its imports: most motion lives behind wrappers (`Press`, `Mount`, an animated number, a sheet) that a grep of the screen file never matches. Audit each wrapper once, at its source.

Check the installed Reanimated version (`node_modules/react-native-reanimated/package.json`). Default springs and Reduce Motion behaviour differ between 3 and 4, and rules 1 and 4 depend on it.

Read the files that turn up. Judge each animation in context: what triggers it, how often the user sees it, and whether it's an entrance, an exit, feedback or a continuous follow.

## 2. Check every rule

Rule details, detection hints and fixes are in [reference/rules.md](reference/rules.md). Read it before judging. In short:

| # | Rule | Severity when broken |
|---|---|---|
| 1 | No bounce on UI chrome. Springs land with a damping ratio of 0.85–1; overshoot (≈0.6) only for a success, a pick landing or a check. A bare `withSpring(v)` depends on the version (Reanimated 4: gentle but slow; 3: bouncy): make the config explicit. | polish (bug if a sheet or modal wobbles) |
| 2 | Exits dim first and run about 60% of the entrance, travelling at most half as far. No exit slower than its entrance. Shared-element returns and drag dismissals are exempt from the distance rule. | polish |
| 3 | Every tappable thing answers within 100–160 ms: a press scale of 0.94–0.97, or an opacity or background change. | bug if missing on a primary control |
| 4 | Reduce Motion: keep opacity and colour, drop travel, scale, overshoot and parallax. In Reanimated 3.5+/4 every animation already follows the system and *jumps to its end* when it's on, so meaningful fades need `ReduceMotion.Never`; movement outside Reanimated needs a manual check. | bug |
| 5 | No JS work on every frame: no `setState`, `runOnJS` or `scheduleOnRN` per gesture, scroll or tween frame; update React state only when a stepped value changes or on release. | bug |
| 6 | Animate `transform` and `opacity`, not `width`, `height`, `top`, `left` or `margin` (except a measured collapse). | bug on lists, polish elsewhere |
| 7 | A single element's UI response finishes under ~300 ms; large surfaces under ~400 ms. Use named tokens instead of scattered magic motion numbers (not latency or hold constants). | polish |
| 8 | Loops (`withRepeat(..., -1)`, Lottie, shimmer) only while a live state needs them, paused off-screen, cancelled on unmount. | bug if it runs forever off-screen |
| 9 | Refused actions answer: an invalid tap flickers once (small offset or opacity dip, plus a warning haptic). A `disabled` Pressable swallows the tap and any refusal handler with it. | polish (bug on a primary control) |
| 10 | Content swaps happen in place: outgoing dims, incoming fades in with a slight scale. No sliding across the screen unless direction means something; text colour follows its animating background; no reset-then-animate snaps. | polish |
| 11 | Old JS-thread APIs (`Animated` from `react-native` without `useNativeDriver: true`, `LayoutAnimation`) on hot paths: suggest Reanimated. | polish (bug if it drops frames) |

If the project already has motion tokens (a `springs`, `motion` or `animation` constants file), judge against those and write fixes in their shape and names. If it has none, recommend adding [reference/tokens.ts](reference/tokens.ts) and write fixes that use it.

## 3. Report

Write the report in this shape:

```markdown
## Motion review: <project or folder>

**Summary:** <2 sentences: overall feel, the one thing to fix first>

| # | Where | Rule | Severity | What happens now | Fix |
|---|---|---|---|---|---|
| 1 | `src/components/Sheet.tsx:42` | 1 Bounce | polish | Sheet opens on `withSpring(0)` with the Reanimated 3 default (ratio 0.5), overshoots and wobbles | `withSpring(0, { stiffness: 631.7, damping: 50.3, mass: 1 })` (ratio 1, lands in ~250 ms) |

**Fix plan** (ordered: bugs first, then polish; group by file)
1. ...

**Good already:** <what's done well, so it isn't "fixed" by accident>
```

Rules for the report:
- Every finding cites `file:line` and quotes or paraphrases the offending code. No generic advice without a location.
- Give the exact replacement values. For springs, give `stiffness`, `damping` and `mass`, and say the resulting damping ratio.
- Don't flag the same pattern 40 times. Group repeats ("12 list rows in `src/screens/*` …") and fix them at the source (a shared hook or component).
- Count bugs and polish items separately in the summary.
- If a finding is a judgement call, say so and say what would change your mind.

## 4. Applying fixes (only when asked)

- Fix shared sources first (a button component, a `usePress` hook, a tokens file) so one change fixes many screens.
- Keep behaviour identical apart from motion: same props, same callbacks, same accessibility.
- After editing, run the project's typecheck and lint scripts if they exist, and list what you changed against each finding number.
