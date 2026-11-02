# Motion rules: detection and fixes

Spring maths used throughout: with mass `m`, stiffness `k` and damping `c`, the **damping ratio** is `c / (2·√(k·m))`. A ratio of 1 lands dead on, 0.85–0.9 settles with a settle you feel rather than see, about 0.6 gives one visible overshoot, and below 0.5 it wobbles. The **period** is `2π·√(m/k)` seconds: roughly how long the move takes to look finished.

Reference springs (mass 1), all from [tokens.ts](tokens.ts):

| Use | stiffness | damping | ratio | period |
|---|---|---|---|---|
| press feedback | 987 | 56.5 | 0.9 | 200 ms |
| in-place swap (label, icon, width) | 987 | 62.8 | 1 | 200 ms |
| overlay panel (sheet, modal, menu) | 631.7 | 50.3 | 1 | 250 ms |
| surface move or grow (card, list layout) | 397.9 | 35.1 | 0.88 | 315 ms |
| selection glide (segment, tab, thumb) | 397.9 | 39.9 | 1 | 315 ms |
| spark (success check, pick landing) | 397.9 | 25.5 | 0.64 | 315 ms |
| refusal flicker (start from a 4 px offset) | 1542.1 | 23.6 | 0.3 | 160 ms |

Timings: 80 ms barely-there, **120 ms exit (dim)**, **160 ms entrance opacity (ignite)**, 250 ms crossfade, 390 ms large surface. Easing: entrances `Easing.bezier(0.2, 0.85, 0.25, 1)`, exits `Easing.bezier(0.45, 0, 0.8, 0.4)`, in-place changes `Easing.bezier(0.6, 0.05, 0.2, 1)`.

---

## 1. No bounce on UI chrome

**Look for:**
- Configs with a damping ratio under 0.8 on sheets, modals, menus, tabs, toggles, cards, list rows, or anything the user sees many times a day.
- A bare `withSpring(x)` with no config. **Check the installed Reanimated version first** (`node_modules/react-native-reanimated/package.json`): Reanimated 4 defaults to a gentle spring (stiffness 900, damping 120, mass 4, ratio 1, about 420 ms), which doesn't bounce but is slow for a press or a swap (rule 7). Reanimated 3 defaults to stiffness 100, damping 10 (ratio 0.5), which visibly wobbles. Either way, an explicit config makes the intent readable.
- `Reanimated3DefaultSpringConfig` used on chrome, `Animated.spring` with a low `friction` or a high `bounciness`.
- Layout presets with `.springify()` and a low damping on chrome (`LinearTransition.springify()` for list reflow is fine; a wobbling `ZoomIn.springify()` menu is not).

**Allowed:** one visible overshoot (ratio ≈ 0.6) for moments that earn it: a success check, a badge earned, a dragged thumb landing on a value.

**Fix:** replace with the matching reference spring above, and quote the before and after ratios.

## 2. Exits dim first, run shorter and travel less

**Look for:**
- `exiting={SlideOutDown}`, `FadeOutDown.duration(400)` and similar, where the exit is as long as or longer than the entrance.
- Exits that slide content off-screen in a flow with no spatial meaning (step 1 → step 2 of a form).
- Keyed swaps (`key={value}`) or conditional blocks with an `entering` but no `exiting`: the old content vanishes in one frame.
- Overlays whose backdrop clears before the panel has gone.

**Fix:** exit about 60% of the entrance (an entrance of 250 ms gets an exit of 150 ms; dismissals of small things use 120 ms), lead with opacity on the exit easing, travel at most half the entrance distance (or recede to scale 0.96 instead), and clear the backdrop *after* the panel. Example: `exiting={FadeOut.duration(120)}`, paired with `entering={FadeInDown.duration(200)}`.

**Exempt:** shared-element returns (a photo flying back to its tile has to travel the full way) and exits that continue a drag (they follow the finger, then spring). Judge these only on "shorter than the entrance" and "no bounce".

## 3. Every tap answers within 100–160 ms

**Look for:** first find the project's press wrapper or press hook (most codebases have one) and audit it once at the source, including its disabled and reduced-motion branches. Then look for controls that bypass it:
- `Pressable` with no `style={({ pressed }) => …}`, no `android_ripple` and no animated scale.
- `TouchableWithoutFeedback` on a visible control.
- Press animations slower than 200 ms, or scaling below 0.9 (reads as a squash).
- Feedback only on `onPress` (fires on release) for controls held down, such as hold-to-record.
- A press hook whose reduced-motion branch drops the scale *and* gives no opacity change: under Reduce Motion the control no longer answers at all. Keep an opacity dip (to about 0.7).

**Fix:** scale to 0.97 (large buttons) down to 0.94 (small icon buttons) on press-in, back on release, using the press spring. Put it in one shared hook or button component, not per screen. A minimal Reanimated version:

```tsx
const scale = useSharedValue(1);
const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
const press = { stiffness: 987, damping: 56.5, mass: 1 };
<Pressable
  onPressIn={() => { scale.value = reduced ? 1 : withSpring(0.97, press); }}
  onPressOut={() => { scale.value = withSpring(1, press); }}
>
  <Animated.View style={style}>{children}</Animated.View>
</Pressable>
```

## 4. Reduce Motion

**How Reanimated behaves (check the version):** in Reanimated 3.5+ and 4, any `withTiming`, `withSpring`, `withDecay` or layout animation *without* a `reduceMotion` setting follows the system: when Reduce Motion is on, it jumps straight to its end value. That skips movement correctly, but it also hard-cuts meaningful opacity and colour fades. Older Reanimated, `Animated` from `react-native` and Lottie don't do this.

**Look for:**
- Opacity or colour feedback that carries meaning (a fill crossfade, an error appearing, a swap dimming) with no `reduceMotion: ReduceMotion.Never` (or `.reduceMotion(ReduceMotion.Never)` on a layout preset): under Reduce Motion it snaps.
- The opposite: `reduceMotion: ReduceMotion.Never` on animations that move, scale or rotate, which forces travel on people who asked for none.
- Movement driven outside Reanimated (`Animated`, Lottie, `ScrollView.scrollTo({ animated: true })`, carousels, parallax) with no check of `useReducedMotion()` or `AccessibilityInfo.isReduceMotionEnabled()`.
- A reduced-motion hook built on `AccessibilityInfo` that returns `false` on the first render and resolves later. Initial values computed from it (`useSharedValue(reduce ? 1 : 0)`) see the wrong answer. Reanimated's `useReducedMotion()` is synchronous.

**Fix:** keep opacity and colour (they carry meaning) by marking those animations `ReduceMotion.Never`. Let movement, scale, rotation, overshoot and parallax follow the system, or set the end value directly where you drive motion yourself:

```tsx
import { ReduceMotion, useReducedMotion, withTiming } from "react-native-reanimated";

fill.value = withTiming(1, { duration: 160, reduceMotion: ReduceMotion.Never }); // meaning: keep
const reduced = useReducedMotion();
listRef.current?.scrollToIndex({ index, animated: !reduced });                 // travel: drop
```

Autoplaying loops (carousels, marquees, shimmer) stop or become a slow opacity breath.

## 5. No JS work on every frame

**Look for:**
- `setState` inside `onScroll`, `Gesture.Pan().onUpdate`, `onChange` or `useAnimatedScrollHandler`, or `runOnJS(setSomething)` / `scheduleOnRN(setSomething)` (the Reanimated 4 / worklets name) called on every frame.
- The same hop with no gesture: a count-up or value tween whose reaction calls back to React on nearly every frame (a high-precision number animating through thousands of steps).
- Sliders that call `onValueChange` with React state on every move.
- `Animated.event` without `useNativeDriver: true`.

**Fix:** write shared values in the worklet. Cross to JS only when a stepped value changes (keep the last step in a shared value and compare), at a coarser step, or on `.onEnd`. Derive visuals with `useAnimatedStyle` or `useDerivedValue`.

## 6. Animate transform and opacity

**Look for:** animated `width`, `height`, `top`, `left`, `margin`, `padding` or `borderWidth` in `useAnimatedStyle`, or `Animated.Value` driving layout props, especially inside list rows.

**Fix:** use `translateX`/`translateY`/`scale`/`opacity`. For expand and collapse, measure once (`onLayout` or a hidden measuring copy), then animate the height between known values, or use `LinearTransition` on the siblings so they reflow.

## 7. Durations and tokens

**Look for:** a single element's UI response taking longer than ~300 ms (fades, presses, toggles), large surfaces over ~400 ms, and many different magic motion numbers (`duration: 237`, `damping: 13`) spread across files.

**Scope it:** judge per element, not a staggered page entrance as a whole. Accept slow tokens the project documents on purpose (an odometer roll, a hold after success). Only sweep motion values: simulated latency, timeouts and hold constants are not motion durations.

**Fix:** move to named tokens and map each magic number to the nearest one. Write fixes in the *project's* token shape (for example `Easing.bezier(...ease.out)` if its easings are tuples); use [tokens.ts](tokens.ts) only when the project has none. Entrance opacity takes 160 ms; content exits take 120 ms.

## 8. Loops only while something is live

**Look for:** `withRepeat(..., -1)`, infinite Lottie, shimmer or pulse effects with no stop condition; loops that keep running when the screen is blurred or the item has scrolled away; and no `cancelAnimation` on unmount.

**Fix:** tie each loop to a real state (loading, recording, live). Stop it with `cancelAnimation(sv)` when the state ends or the screen blurs (`useIsFocused`), and pause it off-screen (list `viewabilityConfig`). Purely decorative ambient loops get removed or slowed until they're below notice.

## 9. Refused actions answer

**Look for:** disabled buttons that swallow taps silently, wrong PINs or codes that just clear, and validation that only shows text with no motion.

A `disabled` prop on a Pressable removes the press feedback *and* stops `onPress`, so any refusal handler in it (a warning haptic, an error) never runs. On a primary control (pay, submit, the main CTA) this is a **bug**, not polish.

**Fix:** one flicker. Kick 4 px sideways (or dip the opacity to 0.6) and release into the flicker spring, plus a warning haptic. Never loop it. Keep `accessibilityState={{ disabled: true }}` so screen readers announce it.

## 10. Swap in place

**Look for:**
- a label, icon, count or step changing by sliding the whole thing across the screen, or an instant hard swap with no transition at all;
- text colour switched through `className` or a style prop while its background animates: for the length of the fade the text sits on the wrong colour (drive both from the same value with `interpolateColor`);
- an animation that resets its shared value before animating again (`sv.value = from; sv.value = withSpring(to)`), which snaps when interrupted (start from where it is);
- the same number animating two different ways on one screen (one rolls, one counts).

**Fix:** the outgoing element dims (120 ms, to scale 0.96) while the incoming one fades in (160 ms on the entrance easing, scale 0.96 → 1 on the swap spring). Use directional travel (at most 6 px) only when direction means something, such as a count going up or down.

## 11. JS-thread animation APIs

**Look for:** `Animated` from `react-native` without `useNativeDriver: true`; `LayoutAnimation.configureNext` on screens with heavy renders or lists.

**Fix:** suggest Reanimated (`useSharedValue` + `withTiming`/`withSpring`, `entering`/`exiting`/`layout` props). If the project doesn't use Reanimated, at least add `useNativeDriver: true` where the animated props allow it. Don't push a migration if animations are rare and smooth.
