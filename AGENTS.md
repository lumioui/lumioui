# LumioUI: guide for contributors and coding agents

Animated React Native components for Expo, built on Reanimated 4 and NativeWind v4 with strict TypeScript. Users install components with `npx @lumioui/cli add <name>`, which copies the source into their app.

## Commands

```bash
pnpm install
pnpm typecheck        # every workspace
pnpm lint
pnpm demos            # regenerate the playground's demo list after adding a component, variant or demo
pnpm sync:tokens      # regenerate apps/playground/global.css after changing packages/core/src/tokens/colors.ts
pnpm playground       # run the playground (Expo); press w for web, i for iOS, a for Android
```

## Layout

- `packages/core/src/`: tokens (colours, motion, spacing, type), `ThemeProvider` and `useTheme`, hooks (`useHaptic`, `usePressAnimation`, `useReducedMotion`…), utils (`cn`, `createVariant`, `a11yProps`, `optionalRequire`) and primitives. No components.
- `packages/ui/src/<name>/`: one folder per component: `<name>.tsx`, `index.ts`, `meta.json`, an optional `demo.tsx` and a `variants/` folder of real, installable examples.
- `packages/ui/src/animated-icons/svg/`: the icon set as plain SVG (static, animated, thin and bold), plus `catalog.json`, `STYLE.md` (the drawing rules) and `gen.mjs`, which regenerates the files from `batches/`.
- `apps/playground/`: an Expo app that lists every component and renders its demo and variants.

## Motion

- Motion behaves like light: ignite, don't bounce; dim to leave; swap in place; flicker for "can't".
- Use the tokens in `packages/core/src/tokens/animation.ts` only (`spring.*`, `timing.*`, `ease.*`). No inline spring configs or one-off durations; if a component needs its own tuning, make it a named const built from `tempo.*` and say why in a comment.
- Gate transform motion behind `useReducedMotion()`. Reduced motion keeps opacity and colour feedback and drops travel, scale and overshoot; set the shared value directly instead of animating.
- Animate Reanimated shared values only, never `LayoutAnimation` or `Animated` from react-native.
- Layout animations use the built-in presets (`FadeInDown.duration(…)`, `FadeOut`, `LinearTransition.springify()`…). Never `new Keyframe(...)` or `.withInitialValues(...)`: on the web they throw and leave panes stacked.
- Exits run about 60% of the entrance and lead with opacity. UI motion stays under about 300 ms; press feedback 100–160 ms.
- Haptics through `useHaptic()` (`selection` for toggles, `light` for buttons, `warning` for a refusal). Never import expo-haptics directly.
- Press feedback through `usePressAnimation()` (default scale 0.97).

## Works on every React Native version users run

The repo pins Expo 54 / React Native 0.81, but users install into whatever `create-expo-app` gives them today. Write code that types on both:

- Refs: `useRef<ComponentRef<typeof View>>` and `forwardRef<ComponentRef<typeof View>, Props>`, never `useRef<View>`.
- A style prop that can receive a `useAnimatedStyle` result is `AnimatedViewStyle` / `AnimatedTextStyle` from `@lumioui/core`.
- Derive event payload types from the prop, e.g. `Parameters<NonNullable<TextInputProps["onKeyPress"]>>[0]`.
- No `StyleSheet.absoluteFillObject`; use `StyleSheet.absoluteFill` or spell out the four edges.
- List slots (`ListHeaderComponent`…) take `undefined`, not `null`, when empty.

## NativeWind identity rule

NativeWind registers components by identity, and `Animated.createAnimatedComponent(X)` returns a new identity each call, so a locally created animated component silently drops `className`.

- Never call `createAnimatedComponent` in a component file. Import `AnimatedPressable` / `AnimatedTextInput` from `@lumioui/core`; `Animated.View/Text/ScrollView/FlatList/Image` are already registered.
- Need another animated primitive? Add one shared registration in `packages/core/src/utils/styled.ts`.

## Code conventions

- Named exports only. Every component accepts `className`, merged with `cn()`. `forwardRef` and `displayName` on every public component.
- Style with NativeWind classes on semantic tokens (`bg-primary`, `text-foreground`, `bg-card`, `border-border`…). Use `useTheme().colors` only where a class can't work (SVG strokes, interpolated colours). No raw hex in classNames, no text under 12 px.
- Variants and sizes through `createVariant`; compound components through `Object.assign(Root, {...})`.
- Larger components support controlled and uncontrolled use (`value`/`defaultValue`/`onChange`, `open`/`onOpenChange`…).
- Accessibility: set `accessibilityRole`, `accessibilityState` and `accessibilityLabel`; touch targets at least 44 pt (use `hitSlop` when the visual is smaller).
- Continuous inputs (sliders, drags) write shared values on the UI thread and update React state only when the stepped value changes or on release.
- Overlays unmount while closed; backdrop and panel are separate layers.
- No new runtime dependencies beyond react-native, reanimated, safe-area-context, react-native-svg and expo-haptics (through `useHaptic`). Components must run in Expo Go.
- Demo content is fictional: invented names, places and brands, photos from Unsplash. Don't use real companies or people.
