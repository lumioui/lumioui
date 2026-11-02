/* Path smoothing post-pass for emitted geometry.
 *
 * Batch-authored icons sometimes draw curved silhouettes as dense polylines —
 * dozens of short straight segments whose every joint reads as a hard point
 * sticking out. This rebuilds those faceted runs with midpoint-quadratic
 * corner cutting (the curve passes through segment midpoints, vertices act as
 * controls), so every gentle joint rounds while mass stays put.
 * Real corners — deflection above DEFL — stay sharp. */

const DEFL = 62; // degrees: vertices bending less than this are facet kinks

const f = (v) => {
  const r = Math.abs(v) < 5e-7 ? 0 : +v.toFixed(2);
  return r === 0 ? "0" : String(r);
};

/** Tokenize `d` into absolute-coord commands (H/V normalize to L). */
function parse(d) {
  const tok = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
  const out = [];
  let i = 0, x = 0, y = 0, sx = 0, sy = 0, cmd = null;
  const num = () => +tok[i++];
  const ap = (nx, ny) => (cmd >= "a" && cmd <= "z" ? [x + nx, y + ny] : [nx, ny]);
  while (i < tok.length) {
    if (/[A-Za-z]/.test(tok[i])) cmd = tok[i++];
    if (!cmd) break;
    const C = cmd.toUpperCase();
    if (C === "M") { const p = ap(num(), num()); x = p[0]; y = p[1]; sx = x; sy = y; out.push({ c: "M", pts: [p] });
      // spec: extra coordinate pairs after M are implicit lineto, not moveto
      cmd = cmd === "m" ? "l" : "L"; }
    else if (C === "L") { const p = ap(num(), num()); x = p[0]; y = p[1]; out.push({ c: "L", pts: [p] }); }
    else if (C === "H") { const nx = num(); const p = cmd === "h" ? [x + nx, y] : [nx, y]; x = p[0]; y = p[1]; out.push({ c: "L", pts: [p] }); }
    else if (C === "V") { const ny = num(); const p = cmd === "v" ? [x, y + ny] : [x, ny]; x = p[0]; y = p[1]; out.push({ c: "L", pts: [p] }); }
    else if (C === "C") { const c1 = ap(num(), num()), c2 = ap(num(), num()), p = ap(num(), num()); x = p[0]; y = p[1]; out.push({ c: "C", pts: [c1, c2, p] }); }
    else if (C === "S") { const c2 = ap(num(), num()), p = ap(num(), num()); x = p[0]; y = p[1]; out.push({ c: "S", pts: [c2, p] }); }
    else if (C === "Q") { const q = ap(num(), num()), p = ap(num(), num()); x = p[0]; y = p[1]; out.push({ c: "Q", pts: [q, p] }); }
    else if (C === "T") { const p = ap(num(), num()); x = p[0]; y = p[1]; out.push({ c: "T", pts: [p] }); }
    else if (C === "A") {
      const rx = num(), ry = num(), rot = num(), laf = num(), swf = num();
      const p = ap(num(), num()); x = p[0]; y = p[1];
      out.push({ c: "A", arc: { rx, ry, rot, laf, swf, to: p }, pts: [p] });
    } else if (C === "Z") { x = sx; y = sy; out.push({ c: "Z" }); cmd = null; }
    else break;
  }
  return out;
}

const segEnd = (k) => (k.c === "A" ? k.arc.to : k.c === "Z" ? null : k.pts[k.pts.length - 1]);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const udir = (a, b) => { const d = dist(a, b); return d < 1e-9 ? null : [(b[0] - a[0]) / d, (b[1] - a[1]) / d]; };

/** Deflection (°) at vertex v: 0 = straight through, 90 = corner, 180 = hairpin. */
function deflection(prev, v, next) {
  const a = udir(prev, v), b = udir(v, next);
  if (!a || !b) return 0;
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1]));
  return (Math.acos(dot) * 180) / Math.PI;
}

const raw = (k) => {
  if (k.c === "L") return `L${f(k.pts[0][0])} ${f(k.pts[0][1])}`;
  if (k.c === "C") return `C${f(k.pts[0][0])} ${f(k.pts[0][1])} ${f(k.pts[1][0])} ${f(k.pts[1][1])} ${f(k.pts[2][0])} ${f(k.pts[2][1])}`;
  if (k.c === "S") return `S${f(k.pts[0][0])} ${f(k.pts[0][1])} ${f(k.pts[1][0])} ${f(k.pts[1][1])}`;
  if (k.c === "Q") return `Q${f(k.pts[0][0])} ${f(k.pts[0][1])} ${f(k.pts[1][0])} ${f(k.pts[1][1])}`;
  if (k.c === "T") return `T${f(k.pts[0][0])} ${f(k.pts[0][1])}`;
  if (k.c === "A") return `A${f(k.arc.rx)} ${f(k.arc.ry)} ${f(k.arc.rot)} ${k.arc.laf} ${k.arc.swf} ${f(k.arc.to[0])} ${f(k.arc.to[1])}`;
  return "Z";
};

/** Midpoint-quadratic smoothing: the rebuilt curve passes through segment
 *  midpoints with the original vertices as controls — every gentle joint
 *  rounds, faceted tips soften into the polyline instead of poking out.
 *  Closed rings return a full `M…Z`; open runs return `L/Q…` pieces that
 *  keep both endpoint anchors exact. */
function roundRun(pts, closed) {
  const n = pts.length;
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  if (closed) {
    const m0 = mid(pts[n - 1], pts[0]);
    const seg = [`M${f(m0[0])} ${f(m0[1])}`];
    for (let i = 0; i < n; i++) {
      const m = mid(pts[i], pts[(i + 1) % n]);
      seg.push(`Q${f(pts[i][0])} ${f(pts[i][1])} ${f(m[0])} ${f(m[1])}`);
    }
    return seg.join("") + "Z";
  }
  const seg = [`L${f(mid(pts[0], pts[1])[0])} ${f(mid(pts[0], pts[1])[1])}`];
  for (let i = 1; i < n - 1; i++) {
    const m = mid(pts[i], pts[i + 1]);
    seg.push(`Q${f(pts[i][0])} ${f(pts[i][1])} ${f(m[0])} ${f(m[1])}`);
  }
  seg.push(`L${f(pts[n - 1][0])} ${f(pts[n - 1][1])}`);
  return seg.join("");
}

/** Smooth one subpath and return it as `M…[Z]` markup.
 *  segs: [{c, from, to, cmd}]; closed = the source subpath ended with Z. */
function smoothSubpath(segs, closed) {
  const n = segs.length;
  if (!n) return "";
  const p = [segs[0].from, ...segs.map((s) => s.to)]; // n+1 points
  const M = (pt) => `M${f(pt[0])} ${f(pt[1])}`;
  if (n < 2) return M(p[0]) + segs.map((s) => raw(s.cmd)).join("") + (closed ? "Z" : "");

  if (closed) {
    // ring: vertex i at p[i] sits between seg (i-1+n)%n and seg i
    const gentle = [];
    for (let i = 0; i < n; i++) {
      const a = segs[(i - 1 + n) % n], b = segs[i];
      gentle[i] =
        a.c === "L" && b.c === "L" &&
        dist(p[i], p[(i - 1 + n) % n]) >= 0.05 && dist(p[i], p[(i + 1) % n]) >= 0.05 &&
        deflection(p[(i - 1 + n) % n], p[i], p[(i + 1) % n]) < DEFL;
    }
    const hard = gentle.map((g, i) => [g, i]).filter(([g]) => !g).map(([, i]) => i);
    if (!hard.length) return roundRun(p.slice(0, n), true);
    // emit segs starting at a hard vertex so runs never wrap mid-walk
    const start = hard[0];
    const out = [M(p[start])];
    let i = 0;
    while (i < n) {
      const si = (start + i) % n;
      const e = (si + 1) % n; // vertex at end of seg si
      if (segs[si].c === "L" && gentle[e]) {
        // smoothed cluster: segs si..b-1 where vertices si+1..b-1 are gentle
        let b = e;
        while (gentle[b]) b = (b + 1) % n;
        const pts = [p[si]];
        for (let q = si; ; q = (q + 1) % n) {
          pts.push(p[(q + 1) % n]);
          if ((q + 1) % n === b) break;
        }
        out.push(roundRun(pts, false));
        const consumed = ((b - si + n) % n) || n; // b===si wraps the whole ring
        i += consumed;
        continue;
      }
      out.push(raw(segs[si].cmd));
      i++;
    }
    return out.join("") + "Z";
  }

  // open: interior vertices p_1..p_{n-1}; vertex k between seg k-1 and seg k
  const gentle = new Array(n).fill(false); // gentle[k] refers to vertex p_k
  for (let k = 1; k < n; k++) {
    if (segs[k - 1].c !== "L" || segs[k].c !== "L") continue;
    if (dist(p[k], p[k - 1]) < 0.05 || dist(p[k], p[k + 1]) < 0.05) continue;
    if (deflection(p[k - 1], p[k], p[k + 1]) < DEFL) gentle[k] = true;
  }
  const out = [M(p[0])];
  let k = 0;
  while (k < n) {
    if (gentle[k + 1] && segs[k].c === "L" && segs[k + 1].c === "L") {
      // start of a gentle run at vertex k+1
      let j = k + 1;
      const run = [];
      while (j < n && gentle[j]) { run.push(p[j]); j++; }
      // run covers vertices p_{k+1}..p_{j-1}; bounded by p_k and p_j
      out.push(roundRun([p[k], ...run, p[j]], false));
      k = j;
    } else {
      out.push(raw(segs[k].cmd));
      k++;
    }
  }
  return out.join("");
}

/** Rebuild a full `d`, smoothing each subpath. */
export function smoothD(d) {
  const cmds = parse(d);
  let out = "", i = 0;
  while (i < cmds.length) {
    const c = cmds[i];
    if (c.c === "M") {
      i++;
      const segs = [];
      let cur = c.pts[0];
      let closed = false;
      while (i < cmds.length && cmds[i].c !== "M") {
        const k = cmds[i];
        if (k.c === "Z") { closed = true; i++; break; }
        segs.push({ c: k.c, from: cur, to: segEnd(k), cmd: k });
        cur = segEnd(k);
        i++;
      }
      if (!segs.length) out += `M${f(c.pts[0][0])} ${f(c.pts[0][1])}`;
      else out += smoothSubpath(segs, closed);
    } else if (c.c === "Z") { out += "Z"; i++; }
    else i++;
  }
  return out;
}
