---
name: add-haptics
description: Add the right haptic feedback to a React Native or Expo app. It finds tappable controls (buttons, toggles, pickers, sliders, long-press menus, destructive and refused actions), picks the matching haptic for each, and wires it through one small hook that's safe on web and when expo-haptics is missing. Use when the user asks to add haptics, make taps "feel native", or polish the feel of buttons and controls.
---

# Add haptics (React Native)

Haptics are the cheapest way to make an app feel native, and the easiest to overdo. The goal is a quiet, consistent vocabulary: one kind of tick for one kind of moment, never on scroll, never on every frame.

## 1. Check the setup

0. Read the project's own conventions first (AGENTS.md, CONTRIBUTING, a design or motion doc). If they define haptic rules, follow them over this table and say where they differ.
1. Is `expo-haptics` installed (in `package.json`)?
   - Expo project without it: propose `npx expo install expo-haptics` and wait for a yes before installing.
   - Bare React Native without Expo modules: tell the user `expo-haptics` needs `expo-modules-core` (`npx install-expo-modules`). Ask before adding anything, and don't swap in a different haptics library unasked.
2. Does the project already have a haptics helper (search `Haptics.`, `impactAsync`, `useHaptic`, `ReactNativeHapticFeedback`)? If yes, use and extend it instead of adding a second one. Audit it against four checks and report any it fails: failures are swallowed (`.catch`, so a missing haptic engine can't cause an unhandled rejection), silent on web, has an `enabled` flag for a user setting, and returns a memoised object.
3. If there's no helper, add [reference/useHaptic.ts](reference/useHaptic.ts) to the project's hooks folder once `expo-haptics` is installed. It stays silent on web, never throws, and takes an `enabled` flag so a user setting can turn haptics off.

## 2. Find the moments

Search for interaction points:

```bash
rg -n "onPress=|onLongPress=|onValueChange=|onCheckedChange=|onSelect=|onChange=|Gesture\.(Pan|LongPress|Tap)\(|<Switch|<Slider|<Picker|haptic=|haptics=|hapticFeedback" --type-add 'rn:*.{ts,tsx,js,jsx}' -t rn
```

**Before adding a haptic to any control, check whether it already fires one.** Many component libraries take a declarative prop (`haptic="light"`, `haptic={false}`) and fire inside the component. Open the component's source and trace it. Adding `haptic.light()` in `onPress` on top of that fires twice.

Start with shared components (Button, IconButton, Toggle, ListRow, Tabs). One change there covers every screen, but it also changes every consumer: list the call sites a shared-component change affects in your report, and ask first if the component is published to other apps.

## 3. Pick the haptic

| Moment | Haptic | Fire on |
|---|---|---|
| Toggle, switch, checkbox, radio, segment, tab change | `selection` | the value change (after it commits) |
| Picker or wheel step, slider crossing a step, stepper +/- | `selection` | each *new* step, never per frame |
| Primary or secondary button, icon button, list row that navigates | `light` | `onPress` (`onPressIn` for hold-to-act controls) |
| Commit or send button (pay, send money, send a request, post) | `light` on the tap, then `success` or `error` | the tap; then the confirmed outcome (see "results" below) |
| Long press that opens a menu or lifts an item for dragging | `medium` | when the long press activates |
| Drag item dropping into a new slot, pull-to-refresh passing its threshold | `light` | the crossing moment, once |
| Completed purchase, save, send, unlock, task done | `success` | when the result is confirmed (after the request succeeds) |
| Refused tap the user expected to work: over a limit, wrong PIN, invalid form submit | `warning` | the refused tap, with a one-off visual flicker |
| Something happened that the user didn't cause (a payment arrived, a friend joined) | `success`, or nothing | once per event, guarded so a re-render can't repeat it |
| Failed request, destructive confirm (delete) | `error` (failure) or `medium` (destructive confirm) | the outcome or the confirm tap |

**Results.** `success` and `error` belong to the outcome, not the tap. If the code awaits the work, fire after the `await`. If the component only gets a `void` callback (`onRequest`, `onSubmit`) and can't know the outcome, don't fake it: leave the result silent and say so, or suggest the caller fires it. Changing a public prop to return a Promise is an API change, so ask first.

**Disabled is not refused.** A `Pressable` with `disabled` never calls `onPress`. Only use `warning` for taps the user plausibly expected to work. Inert controls (a mode where rows don't apply) and finished ones ("All sent") stay silent. Making a disabled control buzz means removing `disabled` and guarding in the handler, which changes what screen readers announce, so keep `accessibilityState={{ disabled: true }}` if you do.

**Never:**
- on scroll, on keyboard typing, or on every gesture frame;
- on a no-op change, such as tapping the segment, tab or option that's already selected;
- twice for one action (a button that also triggers a success: fire `light` on tap and `success` on the result, but not two taps' worth);
- `heavy` for routine UI;
- `success` before the work has actually succeeded;
- on web.

## 4. Wire it

Typical shapes:

```tsx
const haptic = useHaptic();

// button
<Pressable onPress={() => { haptic.light(); onPress?.(); }} />

// toggle
const toggle = (next: boolean) => { haptic.selection(); setOn(next); };

// slider or picker step from a gesture worklet: cross to JS only when the step changes
const lastStep = useSharedValue(-1);
const pan = Gesture.Pan().onUpdate((e) => {
  const step = Math.round(clamp(e.x / width, 0, 1) * steps);
  if (step !== lastStep.value) { lastStep.value = step; runOnJS(haptic.selection)(); }
});

// refused tap
if (disabled) { haptic.warning(); flicker(); return; }

// confirmed result
await save(); haptic.success();
```

Keep handlers stable (don't recreate the hook result per row). The hook in `reference/` returns a memoised object.

## 5. Report what you changed

Group the report by file, in three parts:
- **Changed:** each control, the haptic it now fires and on which event, with `file:line`; shared-component changes list the call sites they affect.
- **Already correct:** controls that already fire the right haptic, left as they are. On a well-built app this will be most of the list, and that's fine; don't change working code to look busy.
- **Left silent:** what you deliberately didn't touch and why (for example "chat input: typing stays silent").

If the app has a settings screen, suggest a "Haptics" toggle wired to the hook's `enabled` flag.
