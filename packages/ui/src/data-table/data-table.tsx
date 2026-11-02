import * as React from "react";
import { forwardRef } from "react";
import { Pressable, Text, View, type ViewProps } from "react-native";
import Animated, {
  Easing,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  cn,
  ease,
  rowDelay,
  Sheen,
  spring,
  SwitchOn,
  tempo,
  timing,
  useHaptic,
  usePressAnimation,
  useReducedMotion,
  useTheme,
  AnimatedPressable,
} from "@lumioui/core";
import { Icon } from "../icon";

export type DataTableSortDirection = "asc" | "desc";

export interface DataTableSort {
  key: string;
  direction: DataTableSortDirection;
}

export interface DataTableColumn {
  /** Key into each row's record. */
  key: string;
  /** Column header label. */
  title: string;
  /** Cell alignment — defaults to left. */
  align?: "left" | "center" | "right";
  /** Width share within the row — defaults to 1 per column. */
  flex?: number;
  /** Makes the header tappable to sort by this column. Needs `sortValue`
   *  when the cell isn't a plain string/number. */
  sortable?: boolean;
  /** Sort key for a row — required for rich (element) cells. */
  sortValue?: (row: Record<string, React.ReactNode>) => string | number;
  /** Spoken value for a rich (element) cell in the row announcement. */
  a11yValue?: (row: Record<string, React.ReactNode>) => string;
}

export interface DataTableProps extends Omit<ViewProps, "className"> {
  columns: DataTableColumn[];
  /** Cell values keyed by column.key. Strings render as text; pass elements
   *  (Badge, Chip, price Text) for richer cells. */
  rows: Record<string, React.ReactNode>[];
  /** Makes rows pressable with ink + haptic. */
  onRowPress?: (row: Record<string, React.ReactNode>, index: number) => void;
  /** Index (into `rows`) of the selected row — it carries a lit band. */
  selectedIndex?: number | null;
  /** Label appended to each row's a11y announcement, e.g. "transaction". */
  rowLabel?: string;
  /** Controlled sort. Omit for uncontrolled (see `defaultSort`). */
  sort?: DataTableSort | null;
  /** Initial sort for uncontrolled use. */
  defaultSort?: DataTableSort | null;
  onSortChange?: (sort: DataTableSort) => void;
  /** Shown when `rows` is empty. Default "Nothing here yet". */
  emptyLabel?: string;
  className?: string;
}

const ALIGN = {
  left: "items-start",
  center: "items-center",
  right: "items-end",
} as const;

/** Columns that aren't the sort key dim to this — readable, but the sorted column leads. */
const COLUMN_DIM = 0.6;
/** Accent wash on the selected row's lit band. */
const BAND_WASH = 0.06;
/** Rows switch on once the first-load sheen has crossed the top of the table. */
const ROWS_AFTER_SHEEN = tempo.settle;

/** Rows settle into their new order on spring.layout when a sort lands. */
const { stiffness: REFLOW_K = 0, damping: REFLOW_C = 0, mass: REFLOW_M = 1 } = spring.layout;
const ROW_REFLOW = LinearTransition.springify().stiffness(REFLOW_K).damping(REFLOW_C).mass(REFLOW_M);

function cellText(cell: React.ReactNode): string | null {
  return typeof cell === "string" || typeof cell === "number" ? String(cell) : null;
}

/** A cell that brightens when its column leads (or its row is lit) and dims otherwise. */
function LitCell({ on, flex, className, children }: { on: boolean; flex: number; className: string; children: React.ReactNode }) {
  const light = useSharedValue(on ? 1 : COLUMN_DIM);
  React.useEffect(() => {
    light.value = on
      ? withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) })
      : withTiming(COLUMN_DIM, { ...timing.normal, easing: Easing.bezier(...ease.inOut) });
  }, [on, light]);
  const style = useAnimatedStyle(() => ({ opacity: light.value }));
  return (
    <Animated.View style={[{ flex }, style]} className={className}>
      {children}
    </Animated.View>
  );
}

/** Header sort arrow — one chevron that turns on the indicator spring, never an icon swap. */
function SortArrow({ active, asc }: { active: boolean; asc: boolean }) {
  const reduce = useReducedMotion();
  const turn = useSharedValue(active && asc ? 1 : 0);
  const on = useSharedValue(active ? 1 : 0);
  React.useEffect(() => {
    const t = active && asc ? 1 : 0;
    turn.value = reduce ? t : withSpring(t, spring.indicator);
    on.value = withTiming(active ? 1 : 0, active ? timing.fast : timing.recede);
  }, [active, asc, reduce, turn, on]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.5 + on.value * 0.5,
    transform: [{ rotate: `${turn.value * 180}deg` }],
  }));
  return (
    <Animated.View style={style}>
      <Icon name="chevron-down" size="sm" color={active ? "foreground" : "mutedForeground"} />
    </Animated.View>
  );
}

const TableRow = React.memo(function TableRow({
  row,
  index,
  columns,
  onPress,
  rowLabel,
  sortKey,
  selected,
}: {
  row: Record<string, React.ReactNode>;
  index: number;
  columns: DataTableColumn[];
  onPress?: DataTableProps["onRowPress"];
  rowLabel?: string;
  sortKey: string | null;
  selected: boolean;
}) {
  const haptics = useHaptic();
  const press = usePressAnimation({ pressedScale: 0.99, pressedOpacity: 0.7 });
  const band = useSharedValue(selected ? 1 : 0);
  React.useEffect(() => {
    band.value = selected
      ? withTiming(1, { ...timing.fast, easing: Easing.bezier(...ease.out) })
      : withTiming(0, { ...timing.recede, easing: Easing.bezier(...ease.in) });
  }, [selected, band]);
  const bandStyle = useAnimatedStyle(() => ({ opacity: band.value * BAND_WASH }));

  const cells = columns.map((col, ci) => {
    const cell = row[col.key];
    const text = cellText(cell);
    // With a sort active, the sorted column leads; a lit row is full ink throughout.
    const lit = selected || !sortKey || sortKey === col.key;
    return (
      <LitCell
        key={col.key}
        on={lit}
        flex={col.flex ?? 1}
        className={cn("justify-center", ALIGN[col.align ?? "left"])}
      >
        {text !== null ? (
          <Text
            numberOfLines={1}
            className={cn(
              "text-[15px] text-foreground",
              // First column names the row; numeric right columns stay tabular.
              ci === 0 && "font-medium",
              col.align === "right" && "font-medium tabular-nums"
            )}
          >
            {text}
          </Text>
        ) : (
          cell
        )}
      </LitCell>
    );
  });

  // One announcement per row built from its readable cells, e.g.
  // "Invoice 1042, Paid, $1,280.00, transaction".
  const a11yLabel = [
    ...columns.map((c) => {
      const t = c.a11yValue ? c.a11yValue(row) : cellText(row[c.key]);
      return t === null ? null : `${c.title} ${t}`;
    }),
    rowLabel,
  ]
    .filter(Boolean)
    .join(", ");

  const wash = (
    <Animated.View pointerEvents="none" style={bandStyle} className="absolute bottom-0 left-0 right-0 top-0 bg-primary" />
  );

  if (!onPress) {
    return (
      <View
        className="min-h-[52px] flex-row items-center gap-3 px-4 py-3"
        accessible
        accessibilityLabel={a11yLabel}
        accessibilityState={{ selected }}
      >
        {wash}
        {cells}
      </View>
    );
  }

  return (
    <AnimatedPressable
      onPress={() => {
        haptics.selection();
        onPress(row, index);
      }}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={press.animatedStyle}
      className="min-h-[52px] flex-row items-center gap-3 px-4 py-3"
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ selected }}
    >
      {wash}
      {cells}
    </AnimatedPressable>
  );
});

/**
 * DataTable — compact card-bound table for finance/productivity screens:
 * a quiet sentence-case header, 52pt rows, optional pressable rows and
 * tap-to-sort columns. Cells are strings by default; drop in Badge/Chip/Text
 * for status or money columns (give those columns a `sortValue`).
 *
 * Light does the work: on first load the rows sit dim in their exact layout,
 * one sheen crosses the table and the rows switch on 40ms apart. A sort
 * reflows the rows on spring.layout while the sorted column brightens and
 * the others dim; the header arrow turns on spring.indicator. The selected
 * row (`selectedIndex`) carries a lit band — an accent wash in full ink.
 */
export const DataTable = forwardRef<React.ElementRef<typeof View>, DataTableProps>(
  function DataTable(
    {
      columns,
      rows,
      onRowPress,
      selectedIndex = null,
      rowLabel,
      sort: controlledSort,
      defaultSort = null,
      onSortChange,
      emptyLabel = "Nothing here yet",
      className,
      ...props
    },
    ref
  ) {
    const haptics = useHaptic();
    const reduce = useReducedMotion();
    const { colors } = useTheme();
    const [innerSort, setInnerSort] = React.useState<DataTableSort | null>(defaultSort);
    const sort = controlledSort !== undefined ? controlledSort : innerSort;
    // First load: one sheen pass over the dim rows. It fires once, never again.
    const [sheen, setSheen] = React.useState(0);
    React.useEffect(() => {
      setSheen(1);
    }, []);

    const toggleSort = (col: DataTableColumn) => {
      haptics.selection();
      const next: DataTableSort =
        sort?.key === col.key
          ? { key: col.key, direction: sort.direction === "asc" ? "desc" : "asc" }
          : // Numbers usually want biggest first; text A→Z.
            { key: col.key, direction: col.align === "right" ? "desc" : "asc" };
      if (controlledSort === undefined) setInnerSort(next);
      onSortChange?.(next);
    };

    // Sorted view, resolved during render. Original indices ride along so
    // onRowPress still reports the caller's index.
    const ordered = React.useMemo(() => {
      const list = rows.map((row, i) => ({ row, i }));
      if (!sort) return list;
      const col = columns.find((c) => c.key === sort.key);
      if (!col) return list;
      const get = (r: Record<string, React.ReactNode>) => {
        if (col.sortValue) return col.sortValue(r);
        const v = r[col.key];
        return typeof v === "number" ? v : cellText(v) ?? "";
      };
      const dir = sort.direction === "asc" ? 1 : -1;
      return list.sort((a, b) => {
        const x = get(a.row);
        const y = get(b.row);
        if (typeof x === "number" && typeof y === "number") return (x - y) * dir;
        return String(x).localeCompare(String(y)) * dir;
      });
    }, [rows, columns, sort]);

    const sortKey = sort && columns.some((c) => c.key === sort.key) ? sort.key : null;

    return (
      <View
        ref={ref}
        className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}
        {...props}
      >
        <View className="flex-row gap-3 border-b border-border px-4 py-3" accessibilityRole="header">
          {columns.map((col) => {
            const active = sort?.key === col.key;
            const label = (
              <Text
                numberOfLines={1}
                className={cn(
                  "text-[13px] font-medium",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {col.title}
              </Text>
            );
            const justify =
              col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : "justify-start";
            if (!col.sortable) {
              return (
                <View key={col.key} style={{ flex: col.flex ?? 1 }} className={cn("flex-row", justify)}>
                  {label}
                </View>
              );
            }
            return (
              <Pressable
                key={col.key}
                style={{ flex: col.flex ?? 1 }}
                className={cn("-my-3 min-h-[44px] flex-row items-center gap-1", justify)}
                onPress={() => toggleSort(col)}
                accessibilityRole="button"
                accessibilityLabel={`Sort by ${col.title}`}
                accessibilityState={{ selected: active }}
                accessibilityValue={
                  active ? { text: sort?.direction === "asc" ? "ascending" : "descending" } : undefined
                }
              >
                {label}
                <SortArrow active={active} asc={sort?.direction === "asc"} />
              </Pressable>
            );
          })}
        </View>
        {ordered.length === 0 ? (
          <View className="min-h-[96px] items-center justify-center px-4 py-6">
            <Text className="text-[15px] text-muted-foreground">{emptyLabel}</Text>
          </View>
        ) : (
          <View>
            {ordered.map(({ row, i }, pos) => (
              <Animated.View key={i} layout={reduce ? undefined : ROW_REFLOW}>
                <SwitchOn delay={ROWS_AFTER_SHEEN + rowDelay(pos)}>
                  {pos > 0 ? <View pointerEvents="none" className="absolute left-4 right-0 top-0 h-px bg-border" /> : null}
                  <TableRow
                    row={row}
                    index={i}
                    columns={columns}
                    onPress={onRowPress}
                    rowLabel={rowLabel}
                    sortKey={sortKey}
                    selected={selectedIndex === i}
                  />
                </SwitchOn>
              </Animated.View>
            ))}
            <Sheen run={sheen} color={colors.primary} strength={0.1} />
          </View>
        )}
      </View>
    );
  }
);

DataTable.displayName = "DataTable";
