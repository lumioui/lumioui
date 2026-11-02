import * as React from "react";
import { Pressable, View } from "react-native";
import { useHaptic } from "@lumioui/core";
import { Badge, type BadgeProps } from "../badge";
import { Text } from "../../text/text";

/** Pipeline order — tapping a row advances it one stage. */
const STAGES: { label: string; variant: NonNullable<BadgeProps["variant"]> }[] = [
  { label: "Saved", variant: "outline" },
  { label: "Applied", variant: "secondary" },
  { label: "Take-home due", variant: "warning" },
  { label: "Interview", variant: "info" },
  { label: "Offer", variant: "success" },
  { label: "Accepted", variant: "default" },
  { label: "Rejected", variant: "destructive" },
];

const JOBS = [
  { id: "a", role: "Senior Product Designer", company: "Fieldwork · Remote", stage: 4 },
  { id: "b", role: "Design Engineer", company: "Parcel · Toronto", stage: 3 },
  { id: "c", role: "Staff Designer, Payments", company: "Ledgerly · NYC", stage: 2 },
  { id: "d", role: "Product Designer II", company: "Trailhead Maps · Denver", stage: 1 },
  { id: "e", role: "UX Designer", company: "Oatmeal Health · Austin", stage: 6 },
  { id: "f", role: "Visual Designer", company: "Brightline Audio", stage: 0 },
];

/** BadgeVariants — a job-search tracker where every colourway is the stage
 *  it means. Tap an application to move it along; the badge swaps in place. */
export function BadgeVariants() {
  const haptics = useHaptic();
  const [stages, setStages] = React.useState<Record<string, number>>(() =>
    Object.fromEntries(JOBS.map((j) => [j.id, j.stage]))
  );
  return (
    <View className="w-full gap-3">
      <View className="flex-row items-baseline justify-between px-1">
        <Text className="text-2xl font-bold tracking-tight">Applications</Text>
        <Text variant="muted">{JOBS.length} active</Text>
      </View>
      <View className="w-full overflow-hidden rounded-2xl bg-card">
        {JOBS.map((j, i) => {
          const stage = STAGES[stages[j.id] ?? 0]!;
          return (
            <Pressable
              key={j.id}
              onPress={() => {
                haptics.selection();
                setStages((s) => ({ ...s, [j.id]: ((s[j.id] ?? 0) + 1) % STAGES.length }));
              }}
              className={`min-h-16 flex-row items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}
              accessibilityRole="button"
              accessibilityLabel={`${j.role}, ${stage.label}. Tap to advance`}
            >
              <View className="flex-1">
                <Text className="text-base font-medium" numberOfLines={1}>{j.role}</Text>
                <Text variant="muted" numberOfLines={1}>{j.company}</Text>
              </View>
              <Badge variant={stage.variant} icon={null} contentKey={stage.label}>
                {stage.label}
              </Badge>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
