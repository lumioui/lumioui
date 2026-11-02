/** "search-input" → "Search Input". */
export const title = (name: string) =>
  name.split("-").map((w) => (w[0] ?? "").toUpperCase() + w.slice(1)).join(" ");
