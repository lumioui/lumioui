# Motion skills for React Native

Free agent skills that teach your AI coding agent how motion should feel in a React Native or Expo app, and help it find and fix what feels off.

| Skill | What it does |
|---|---|
| [`review-motion`](review-motion/SKILL.md) | Audits your animation code (Reanimated, Animated, gestures, layout animations) against eleven motion rules and writes a fix plan with `file:line` findings: bouncy springs on UI, slow sliding exits, missing press feedback, ignored Reduce Motion, `setState` on every frame. |
| [`add-haptics`](add-haptics/SKILL.md) | Finds your buttons, toggles, pickers, long presses and refused taps, picks the right haptic for each, and wires them through one small hook. Never on scroll, never per frame. |
| [`find-motion-opportunities`](find-motion-opportunities/SKILL.md) | Scans your screens for places motion would genuinely help (hard swaps on load, async buttons with no answer, counts that snap, success moments that pass unnoticed) and says what should stay still. |

The rules behind them, in one line: **UI motion should behave like light.** Things arrive fast and settle calmly, leave by dimming, change in place, and answer every touch. Overshoot is saved for the moments that earn it.

## Install

Each skill is a folder with a `SKILL.md`. Copy the folders into your agent's skills directory.

**Claude Code** (this project only):

```bash
mkdir -p .claude/skills
cp -R review-motion add-haptics find-motion-opportunities .claude/skills/
```

Use `~/.claude/skills/` instead to make them available in every project.

**Codex:** copy the folders into `~/.codex/skills/`.

**Cursor and other agents** that read `SKILL.md` folders: copy them into the skills folder your tool's docs name. Agents without skill support can still use them: point the agent at the `SKILL.md` file ("follow skills/review-motion/SKILL.md").

## Use

Ask in plain words. The agent picks the skill from its description:

- "Review the motion in `src/screens/Checkout.tsx`"
- "Add haptics to our buttons and toggles"
- "Where should this app have animation?"

Or name it directly: `/review-motion`, `/add-haptics`, `/find-motion-opportunities` (in Claude Code).

`review-motion` reports first and only edits when you ask. `add-haptics` asks before installing `expo-haptics`.

## What's inside

- `review-motion/reference/rules.md`: every rule, what to search for and how to fix it, with exact spring values.
- `review-motion/reference/tokens.ts`: a drop-in motion tokens file (springs, timings, easings) for Reanimated.
- `add-haptics/reference/useHaptic.ts`: a small haptics hook built on `expo-haptics`, silent on web.

They work in any React Native project. They come from the motion system behind [LumioUI](https://lumioui.com), a library of animated React Native components you copy into your app with `npx @lumioui/cli add <name>`.

MIT licensed.
