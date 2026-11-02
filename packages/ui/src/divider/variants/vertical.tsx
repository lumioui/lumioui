import * as React from "react";
import { View } from "react-native";
import { Divider } from "../divider";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const FACTS: { top: string; value: string; bottom: string }[] = [
  { top: "4.8K ratings", value: "4.7", bottom: "★★★★★" },
  { top: "Age", value: "4+", bottom: "Years old" },
  { top: "Chart", value: "#6", bottom: "Productivity" },
  { top: "Size", value: "38", bottom: "MB" },
];

/** DividerVertical — vertical rules between the facts strip under an app
 *  listing, the app-store idiom. Get flips to an async install. Neutral
 *  ink for the store CTA. */
export function DividerVertical() {
  const [got, setGot] = React.useState(false);
  const get = async () => {
    await new Promise((r) => setTimeout(r, 1200));
    setGot(true);
  };
  return (
    <View className="w-full">
      <View className="w-full gap-5 rounded-3xl bg-card p-5">
        <View className="flex-row items-center gap-4">
          <View className="h-20 w-20 items-center justify-center rounded-2xl bg-tint-orange">
            <Icon name="calendar" size="lg" color="#FFFFFF" />
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-xl font-semibold">Cadence Planner</Text>
            <Text variant="muted" numberOfLines={1}>Calendar and tasks in one week view</Text>
            <View className="flex-row pt-1">
              <Button size="sm" className="min-w-[80px]" onPress={got ? undefined : get}>
                {got ? "Open" : "Get"}
              </Button>
            </View>
          </View>
        </View>

        <View className="flex-row items-center border-t border-border pt-4">
          {FACTS.map((f, i) => (
            <React.Fragment key={f.top}>
              {i > 0 ? <Divider orientation="vertical" className="h-10" /> : null}
              <View className="flex-1 items-center gap-1">
                <Text className="text-xs text-muted-foreground">{f.top}</Text>
                <Text className="text-xl font-semibold tabular-nums text-muted-foreground">{f.value}</Text>
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>{f.bottom}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>
    </View>
  );
}
