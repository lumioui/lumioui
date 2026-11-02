import * as React from "react";
import { forwardRef, Children } from "react";
import { View, type ViewProps } from "react-native";
import { cn, rowDelay, SwitchOn } from "@lumioui/core";

/**
 * Grid — simple responsive grid via flexbox wrap.
 *   <Grid columns={3} gap={12}>
 *     <Card /><Card /><Card />
 *   </Grid>
 * Children are auto-wrapped in equal-width cells.
 *
 * Opt-in `cascade`: cells start dim (still readable) and switch on in
 * reading order on the tile rhythm (40ms apart, capped at 300ms) with a
 * 6px rise — Lumio's "things switch on". Reduced motion keeps the light,
 * drops the rise. Without it the grid renders plain, exactly as before.
 */

export interface GridProps extends ViewProps {
  /** Number of columns. Default 2. */
  columns?: number;
  /** Gap between cells in px. */
  gap?: number;
  className?: string;
  /** Extra classes for each cell wrapper. */
  cellClassName?: string;
  /** Cells switch on in reading order at mount (dim → on, 40ms apart). Default false. */
  cascade?: boolean;
  /** Wait before the first cell switches on, in ms — to follow a header band. Default 0. */
  cascadeDelay?: number;
  children?: React.ReactNode;
}

export const Grid = forwardRef<React.ElementRef<typeof View>, GridProps>(
  function Grid(
    { columns = 2, gap = 0, className, cellClassName, cascade = false, cascadeDelay = 0, children, style, ...props },
    ref
  ) {
    const cols = Number.isFinite(columns) ? Math.max(1, Math.floor(columns)) : 2;
    const items = Children.toArray(children);
    // Each cell takes an equal share of the row minus its share of the gap.
    const cellWidth = `${100 / cols}%` as const;

    return (
      <View
        ref={ref}
        // accessibilityRole lacks "grid"/"gridcell" — the `role` prop is the
        // typed path (RNW forwards it as the ARIA role). "cell" is RN's
        // closest mapping for gridcell.
        role="grid"
        className={cn("w-full flex-row flex-wrap", className)}
        // Explicit `gap` prop wins over a className gap-*: `gap: 0` in the
        // style array neutralizes the class (style prop > className in
        // NativeWind precedence) so spacing never doubles up.
        style={[gap > 0 && { margin: -gap / 2, gap: 0 }, style]}
        {...props}
      >
        {items.map((child, i) => {
          const cellStyle = [
            { width: cellWidth, flexGrow: 0, flexShrink: 0 },
            gap > 0 && { padding: gap / 2 },
          ];
          return cascade ? (
            <SwitchOn
              key={i}
              role="cell"
              delay={cascadeDelay + rowDelay(i)}
              className={cn(cellClassName)}
              style={cellStyle}
            >
              {child}
            </SwitchOn>
          ) : (
            <View key={i} role="cell" className={cn(cellClassName)} style={cellStyle}>
              {child}
            </View>
          );
        })}
      </View>
    );
  }
);

Grid.displayName = "Grid";
