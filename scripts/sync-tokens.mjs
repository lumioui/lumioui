// Regenerates the CSS variable blocks in apps/playground/global.css from
// packages/core/src/tokens/colors.ts so the web (NativeWind) theme and
// useTheme().colors can never drift. Run: node scripts/sync-tokens.mjs
import fs from "node:fs";

const src = fs.readFileSync("packages/core/src/tokens/colors.ts", "utf8");

function block(name) {
  const start = src.indexOf(`export const ${name}: ColorTokens = {`);
  const m = start < 0 ? null : [, src.slice(start, src.indexOf("};", start))];
  if (!m) throw new Error(`missing ${name}`);
  return Object.fromEntries([...m[1].matchAll(/(\w+): "([^"]+)"/g)].map((x) => [x[1], x[2]]));
}

function hsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  const d = max - min;
  let h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const kebab = (k) => k.replace(/[A-Z]|\d+/g, (c) => "-" + c.toLowerCase());

function vars(tokens) {
  return Object.entries(tokens)
    .map(([k, v]) => {
      if (v.startsWith("rgba")) {
        const [r, g, b, a] = v.match(/[\d.]+/g).map(Number);
        const h = hsl("#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join(""));
        return `    --overlay: ${h} / ${a};`;
      }
      return `    --${kebab(k)}: ${hsl(v)};`;
    })
    .join("\n");
}

const css = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* GENERATED from packages/core/src/tokens/colors.ts — run \`node scripts/sync-tokens.mjs\`. */
@layer base {
  :root {
${vars(block("lightColors"))}
    --radius: 0.875rem;
  }
  /* NativeWind toggles \`.dark\` on <html> — match it directly. */
  .dark {
${vars(block("darkColors"))}
  }
}
`;
fs.writeFileSync("apps/playground/global.css", css);
console.log("global.css synced");
