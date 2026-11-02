import * as React from "react";
import { Pressable, View } from "react-native";
import { ROW_STAGGER, useHaptic } from "@lumioui/core";
import { Separator } from "../separator";
import { Icon, type IconName } from "../../icon/icon";
import { Text } from "../../text/text";

type Tool = { icon: IconName; label: string; toggle?: boolean };

const GROUPS: Tool[][] = [
  [
    { icon: "type", label: "Text style" },
    { icon: "list", label: "Bulleted list", toggle: true },
    { icon: "check-circle", label: "Checklist", toggle: true },
  ],
  [
    { icon: "image", label: "Insert photo" },
    { icon: "paperclip", label: "Attach file" },
  ],
  [{ icon: "mic", label: "Dictate", toggle: true }],
];

function ToolButton({ tool, on, onPress }: { tool: Tool; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      // 44pt where the row has room; on a narrow phone the buttons share the
      // width instead of running off the edge.
      className={`h-11 w-11 min-w-0 shrink items-center justify-center rounded-xl ${on ? "bg-secondary" : ""}`}
      accessibilityRole="button"
      accessibilityLabel={tool.label}
      accessibilityState={tool.toggle ? { selected: on } : undefined}
    >
      <Icon name={tool.icon} size="md" color={on ? "foreground" : "mutedForeground"} />
    </Pressable>
  );
}

/** SeparatorVertical — vertical rules splitting a note editor's formatting
 *  bar into groups (format · insert · voice), the notes keyboard-bar
 *  idiom. The group rules draw top-down as the bar arrives, 40ms apart.
 *  List and checklist are mutually exclusive toggles. */
export function SeparatorVertical() {
  const haptics = useHaptic();
  const [active, setActive] = React.useState<string[]>(["Checklist"]);
  const press = (t: Tool) => {
    haptics.selection();
    if (!t.toggle) return;
    setActive((a) => {
      if (a.includes(t.label)) return a.filter((x) => x !== t.label);
      const rest = a.filter((x) => x !== "Bulleted list" && x !== "Checklist");
      return t.label === "Dictate" ? [...a, t.label] : [...rest, t.label];
    });
  };
  const checklist = active.includes("Checklist");
  const bullets = active.includes("Bulleted list");
  const items = ["Confirm caterer headcount (34)", "Book the Ridgeline cabins", "Print name badges"];
  return (
    <View className="w-full overflow-hidden rounded-3xl bg-card">
      <View className="gap-3 p-5">
        <Text className="text-2xl font-bold tracking-tight">Team offsite</Text>
        <Text variant="muted">Edited just now</Text>
        <View className="gap-2 pt-1">
          {items.map((it, i) => (
            <View key={it} className="flex-row items-center gap-3">
              {checklist ? (
                <View
                  className={`h-5 w-5 items-center justify-center rounded-full ${
                    i === 0 ? "bg-primary" : "border border-input"
                  }`}
                >
                  {i === 0 ? <Icon name="check" size="sm" color="primaryForeground" strokeWidth={3} /> : null}
                </View>
              ) : bullets ? (
                <View className="mx-2 h-1 w-1 rounded-full bg-foreground" />
              ) : null}
              <Text
                className={`flex-1 text-base ${checklist && i === 0 ? "text-muted-foreground line-through" : ""}`}
              >
                {it}
              </Text>
            </View>
          ))}
        </View>
        {active.includes("Dictate") ? (
          <Text className="text-sm text-primary-text">Listening…</Text>
        ) : null}
      </View>

      <View className="flex-row items-center gap-1 border-t border-border px-2 py-1">
        {GROUPS.map((group, gi) => (
          <React.Fragment key={gi}>
            {gi > 0 ? <Separator orientation="vertical" draw drawDelay={gi * ROW_STAGGER} className="mx-1 h-6" /> : null}
            {group.map((t) => (
              <ToolButton key={t.label} tool={t} on={active.includes(t.label)} onPress={() => press(t)} />
            ))}
          </React.Fragment>
        ))}
        <View className="flex-1" />
        <ToolButton tool={{ icon: "chevron-down", label: "Hide keyboard" }} on={false} onPress={() => haptics.light()} />
      </View>
    </View>
  );
}
