import * as React from "react";
import { Pressable, View } from "react-native";
import { Accent } from "@lumioui/core";
import { EmptyState } from "../empty-state";
import { Button } from "../../button/button";
import { Icon } from "../../icon/icon";
import { Text } from "../../text/text";

const SUGGESTED = ["Renew parking permit", "Call the vet about Miso", "Send Q3 deck to Rahul"];

/** EmptyStateVariants — a task app's Today list. Clearing the last task lands
 *  the empty state in the list's place; its action brings work back. Tap a
 *  task's circle to complete it. */
export function EmptyStateVariants() {
  const [tasks, setTasks] = React.useState<string[]>([]);

  return (
    <Accent color="orange" className="w-full">
      <View className="w-full gap-3">
        <View className="gap-1 px-1">
          <Text className="text-3xl font-bold tracking-tight">Today</Text>
          <Text variant="muted">Wednesday, 8 October</Text>
        </View>

        {tasks.length === 0 ? (
          <View className="w-full overflow-hidden rounded-2xl bg-card">
            <EmptyState
              icon={<Icon name="check" size="xl" color="primary" strokeWidth={2.5} />}
              title="All clear for today"
              description="Nothing due. Enjoy the quiet, or plan something for tomorrow."
              action={
                <Button size="md" onPress={() => setTasks(SUGGESTED)}>
                  Add a task
                </Button>
              }
              className="px-6 py-12"
            />
          </View>
        ) : (
          <View className="overflow-hidden rounded-2xl bg-card">
            {tasks.map((t, i) => (
              <Pressable
                key={t}
                onPress={() => setTasks((list) => list.filter((x) => x !== t))}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: false }}
                accessibilityLabel={`Complete ${t}`}
                className="flex-row items-center gap-3 pl-4"
              >
                <View className="h-6 w-6 rounded-full border-2 border-primary" />
                <View className={`flex-1 py-4 pr-4 ${i > 0 ? "border-t border-border" : ""}`}>
                  <Text className="text-base">{t}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </Accent>
  );
}
