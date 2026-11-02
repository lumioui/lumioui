# Contributing

Thanks for helping. Bug reports, fixes and new variants are all welcome.

## Set up

Needs Node 20+ and pnpm (Corepack picks the right version: `corepack enable`).

```bash
pnpm install
pnpm playground     # opens the Expo dev server; press w for web, i for iOS, a for Android
```

The playground lists every component. Open one to see its demo and switch between its variants.

## Changing a component

1. Edit `packages/ui/src/<name>/<name>.tsx`. Follow [AGENTS.md](./AGENTS.md): motion tokens, reduced motion, haptics, accessibility, and code that types on current React Native.
2. Check it in the playground on the web and, if you can, on a device, in light and dark mode.
3. Run `pnpm typecheck && pnpm lint`.

## Adding a variant

A variant is a real example a user can install, e.g. `button-glass`. Add `packages/ui/src/<name>/variants/<slug>.tsx` with one named export, list it in that folder's `meta.json` under `variants`, then run `pnpm demos` so the playground picks it up.

## Pull requests

- Keep each PR to one change, and say what it fixes or adds and how you checked it (a short clip or screenshot helps for anything visual).
- The maintainers build LumioUI in a private repository and publish this one from it, so an accepted PR is applied there and arrives here with the next sync. You'll be credited as co-author.
- Don't add real brands, people or copyrighted images to demos.

By contributing you agree that your contribution is licensed under the [MIT License](./LICENSE).
