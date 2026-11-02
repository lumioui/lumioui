import * as React from "react";
import { View } from "react-native";
import { Stepper } from "../stepper";
import { Text } from "../../text/text";

/** One grouped-list row: label left, live value + compact stepper right. */
function StepperRow({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <View className="min-h-12 flex-row items-center gap-3 px-4 py-2">
      <Text className="flex-1 text-base" numberOfLines={1}>{label}</Text>
      <Text className="text-base tabular-nums text-muted-foreground">{value}</Text>
      {children}
    </View>
  );
}

/** StepperCompact — a print sheet, the compact segment pair's natural home.
 *  Value text sits beside the control (it has none of its own), the page
 *  range clamps at the document's 12 pages (and "To" can't drop below
 *  "From") with a warning flicker, and the sheet count below follows every
 *  step. Ink, no accent. */
export function StepperCompact() {
  const [copies, setCopies] = React.useState(2);
  const [from, setFrom] = React.useState(1);
  const [to, setTo] = React.useState(12);
  const [scale, setScale] = React.useState(100);
  return (
    <View className="w-full gap-6">
      <View className="items-center gap-1">
        <Text className="text-[17px] font-semibold">Print options</Text>
        <Text variant="muted">Laser printer, 3rd floor · Lease_Draft_v4.pdf</Text>
      </View>

      <View className="overflow-hidden rounded-2xl bg-card">
        <StepperRow label="Copies" value={String(copies)}>
          <Stepper value={copies} onValueChange={setCopies} min={1} max={99} showValue={false} />
        </StepperRow>
        <View className="ml-4 h-px bg-border" />
        <StepperRow label="From page" value={String(from)}>
          <Stepper value={from} onValueChange={(v) => { setFrom(v); if (v > to) setTo(v); }} min={1} max={12} showValue={false} />
        </StepperRow>
        <View className="ml-4 h-px bg-border" />
        <StepperRow label="To page" value={String(to)}>
          <Stepper value={to} onValueChange={setTo} min={from} max={12} showValue={false} />
        </StepperRow>
      </View>

      <View className="gap-2">
        <View className="overflow-hidden rounded-2xl bg-card">
          <StepperRow label="Scale" value={`${scale}%`}>
            <Stepper value={scale} onValueChange={setScale} min={50} max={200} step={10} showValue={false} />
          </StepperRow>
        </View>
        <Text variant="muted" className="px-4">
          {to - from + 1} {to - from === 0 ? "page" : "pages"} × {copies} = {(to - from + 1) * copies} sheets, single-sided.
        </Text>
      </View>
    </View>
  );
}
