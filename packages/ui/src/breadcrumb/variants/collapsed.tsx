import * as React from "react";
import { View } from "react-native";
import { Breadcrumb } from "../breadcrumb";
import { Text } from "../../text/text";

/** BreadcrumbCollapsed — a team wiki page five levels deep. The trail keeps
 *  the root and the last two levels; tap the ellipsis to unfold the rest. */
export function BreadcrumbCollapsed() {
  const [page, setPage] = React.useState("Database failover");
  const trail = ["Northbeam", "Engineering", "Platform", "On-call", "Database failover"];
  const depth = trail.indexOf(page);
  return (
    <View className="w-full gap-4 overflow-hidden rounded-3xl bg-card p-5">
      <Breadcrumb
        maxItems={3}
        items={trail.slice(0, depth + 1).map((label, i) =>
          i === depth ? { label } : { label, onPress: () => setPage(label) },
        )}
      />
      <View className="gap-2">
        <Text className="text-2xl font-bold tracking-tight">{page}</Text>
        <Text className="text-[13px] text-muted-foreground">Edited by Ines Kowalczyk · 3 days ago</Text>
      </View>
      {page === "Database failover" ? (
        <View className="gap-3">
          {[
            "Page the secondary on-call before promoting a replica.",
            "Freeze writes from the admin console, then confirm lag is under 5 s.",
            "Promote the east-region replica and rotate the connection string.",
          ].map((line, i) => (
            <View key={line} className="flex-row gap-3">
              <Text className="w-5 text-[15px] font-semibold tabular-nums text-muted-foreground">{i + 1}.</Text>
              <Text className="flex-1 text-[15px] leading-[22px]">{line}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View className="gap-2">
          <Text className="text-[15px] leading-[22px] text-muted-foreground">
            {trail.length - depth - 1} pages below this one.
          </Text>
          <Text
            className="text-[15px] font-semibold text-primary-text"
            accessibilityRole="link"
            onPress={() => setPage("Database failover")}
          >
            Back to Database failover
          </Text>
        </View>
      )}
    </View>
  );
}
