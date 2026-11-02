<p align="center">
  <a href="https://lumioui.com"><img src="https://github.com/lumioui.png" width="96" height="96" alt="LumioUI"></a>
</p>

<h1 align="center">LumioUI</h1>

<p align="center">
  Animated React Native components and 3,072 icons for Expo, copied into your app as source you own.
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-BEF04C?labelColor=0B0B0F" alt="MIT license"></a>
  <a href="https://www.npmjs.com/package/@lumioui/cli"><img src="https://img.shields.io/npm/v/@lumioui/cli?label=cli&color=BEF04C&labelColor=0B0B0F" alt="CLI on npm"></a>
  <a href="https://github.com/lumioui/lumioui/actions/workflows/ci.yml"><img src="https://github.com/lumioui/lumioui/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
</p>

<p align="center">
  <a href="https://lumioui.com/components">Live demos</a> · <a href="https://lumioui.com/icons">Icons</a> · <a href="https://lumioui.com/docs/installation">Docs</a>
</p>

## Use it

```bash
npx @lumioui/cli init           # NativeWind, the theme and a ThemeProvider in your Expo app
npx @lumioui/cli add button     # copies the component's source into ./components/ui
```

Every component is plain source in your project: read it, change it, keep it. They run in Expo Go on iOS, Android and the web, follow light and dark mode, and come with haptics, reduced-motion handling and accessibility props.

## What's here

**74 components:** [Accordion](https://lumioui.com/components/accordion) · [Action Sheet](https://lumioui.com/components/action-sheet) · [Action Swap](https://lumioui.com/components/action-swap) · [Alert](https://lumioui.com/components/alert) · [Animated Number](https://lumioui.com/components/animated-number) · [App Bar](https://lumioui.com/components/app-bar) · [Autocomplete](https://lumioui.com/components/autocomplete) · [Avatar](https://lumioui.com/components/avatar) · [Avatar Group](https://lumioui.com/components/avatar-group) · [Badge](https://lumioui.com/components/badge) · [Breadcrumb](https://lumioui.com/components/breadcrumb) · [Button](https://lumioui.com/components/button) · [Button Group](https://lumioui.com/components/button-group) · [Card](https://lumioui.com/components/card) · [Character](https://lumioui.com/components/character) · [Checkbox](https://lumioui.com/components/checkbox) · [Chip](https://lumioui.com/components/chip) · [Circle Reveal](https://lumioui.com/components/circle-reveal) · [Collapsible](https://lumioui.com/components/collapsible) · [Copy Field](https://lumioui.com/components/copy-field) · [Data Table](https://lumioui.com/components/data-table) · [Dialog](https://lumioui.com/components/dialog) · [Divider](https://lumioui.com/components/divider) · [Drawer](https://lumioui.com/components/drawer) · [Dropdown Menu](https://lumioui.com/components/dropdown-menu) · [Empty State](https://lumioui.com/components/empty-state) · [Error State](https://lumioui.com/components/error-state) · [Fab](https://lumioui.com/components/fab) · [Form](https://lumioui.com/components/form) · [Glass](https://lumioui.com/components/glass) · [Grid](https://lumioui.com/components/grid) · [Icon](https://lumioui.com/components/icon) · [Image](https://lumioui.com/components/image) · [Input](https://lumioui.com/components/input) · [Keyboard Avoiding](https://lumioui.com/components/keyboard-avoiding) · [Label](https://lumioui.com/components/label) · [Like Button](https://lumioui.com/components/like-button) · [List](https://lumioui.com/components/list) · [Loader](https://lumioui.com/components/loader) · [Number Input](https://lumioui.com/components/number-input) · [Pagination](https://lumioui.com/components/pagination) · [Paper Clip](https://lumioui.com/components/paper-clip) · [Password Strength](https://lumioui.com/components/password-strength) · [Polaroid](https://lumioui.com/components/polaroid) · [Popover](https://lumioui.com/components/popover) · [Postage Stamp](https://lumioui.com/components/postage-stamp) · [Progress](https://lumioui.com/components/progress) · [Progress Ring](https://lumioui.com/components/progress-ring) · [Radio Group](https://lumioui.com/components/radio-group) · [Search Input](https://lumioui.com/components/search-input) · [Section Header](https://lumioui.com/components/section-header) · [Segmented Control](https://lumioui.com/components/segmented-control) · [Select](https://lumioui.com/components/select) · [Separator](https://lumioui.com/components/separator) · [Skeleton](https://lumioui.com/components/skeleton) · [Slider](https://lumioui.com/components/slider) · [Stack](https://lumioui.com/components/stack) · [Status Dot](https://lumioui.com/components/status-dot) · [Stepper](https://lumioui.com/components/stepper) · [Sticker](https://lumioui.com/components/sticker) · [Success Seal](https://lumioui.com/components/success-seal) · [Switch](https://lumioui.com/components/switch) · [Tabs](https://lumioui.com/components/tabs) · [Tag Input](https://lumioui.com/components/tag-input) · [Tape](https://lumioui.com/components/tape) · [Text](https://lumioui.com/components/text) · [Textarea](https://lumioui.com/components/textarea) · [Theme Toggle](https://lumioui.com/components/theme-toggle) · [Toast](https://lumioui.com/components/toast) · [Toggle](https://lumioui.com/components/toggle) · [Toggle Group](https://lumioui.com/components/toggle-group) · [Toolbar](https://lumioui.com/components/toolbar) · [Tooltip](https://lumioui.com/components/tooltip) · [Typing Indicator](https://lumioui.com/components/typing-indicator).

**Icons:** [3,072 icons](https://lumioui.com/icons) drawn on one 24 px grid in regular, thin and bold, each with an animated version. Use them in React Native through `npx @lumioui/cli add animated-icons`, or as plain SVG from [`packages/ui/src/animated-icons/svg`](./packages/ui/src/animated-icons/svg).

**Agent skills:** [`skills/`](./skills) teaches coding agents to review motion, add haptics and find places that need motion.

## Repository

| Path | What |
| --- | --- |
| `packages/core` | Theme, colour and motion tokens, hooks (`useHaptic`, `usePressAnimation`, `useReducedMotion`…) and shared primitives |
| `packages/ui` | One folder per component: source, `meta.json`, demo and installable variants |
| `apps/playground` | An Expo app that previews every component and variant |

```bash
pnpm install
pnpm playground     # press w for web, i for iOS, a for Android
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) to fix or add something, and [AGENTS.md](./AGENTS.md) for the motion and code conventions.

## License

[MIT](./LICENSE). The LumioUI name and mark aren't covered; see [TRADEMARK.md](./TRADEMARK.md).
