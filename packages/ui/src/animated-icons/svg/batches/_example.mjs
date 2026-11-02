const path = (d, a = {}) => ({ e: "path", a: { d, ...a } });
const circle = (cx, cy, r, a = {}) => ({ e: "circle", a: { cx, cy, r, ...a } });
const line = (x1, y1, x2, y2, a = {}) => ({ e: "line", a: { x1, y1, x2, y2, ...a } });
const fill = (color = "currentColor") => ({ fill: color, stroke: "none" });

export const icons = {
  "smoke-test-anchor": {
    parts: [
      circle(12, 5.6, 1.9),
      path("M12 7.5v9.5c0 2.2-1.8 4-4 4H5.5c-.8 0-1.1-1-.6-1.5L7.5 17"),
      path("M12 16.5c0 2.2 1.8 4 4 4h2.5c.8 0 1.1-1 .6-1.5l-2.6-2.5"),
    ],
  },
  "smoke-test-badge": {
    parts: [
      path("M12 3.4l2.1 1.6 2.6-.3.9 2.5 2.5.9-.3 2.6 1.6 2.1-1.6 2.1.3 2.6-2.5.9-.9 2.5-2.6-.3-2.1 1.6-2.1-1.6-2.6.3-.9-2.5-2.5-.9.3-2.6-1.6-2.1 1.6-2.1-.3-2.6 2.5-.9.9-2.5 2.6.3z"),
      circle(12, 12, 3.4, fill()),
    ],
  },
};
