import * as React from "react";
import { View } from "react-native";
import { Badge } from "../badge";
import { Text } from "../../text/text";

/** One side of a fixture — a team colour disc stands in for the crest. */
function Side({ name, score, disc, lead }: { name: string; score?: number; disc: string; lead?: boolean }) {
  return (
    <View className="flex-row items-center gap-2">
      <View className={`h-5 w-5 rounded-full ${disc}`} />
      <Text className={`flex-1 text-base ${lead ? "font-semibold" : ""}`} numberOfLines={1}>{name}</Text>
      {score != null ? (
        <Text className={`text-base tabular-nums ${lead ? "font-semibold" : "text-muted-foreground"}`}>{score}</Text>
      ) : null}
    </View>
  );
}

/** BadgeStatus — a scores list where every badge is the match state: the
 *  live one blinks and its minute ticks forward, finished and postponed
 *  games sit still. */
export function BadgeStatus() {
  const [minute, setMinute] = React.useState(67);
  React.useEffect(() => {
    const id = setInterval(() => setMinute((m) => (m >= 90 ? 90 : m + 1)), 3000);
    return () => clearInterval(id);
  }, []);

  const games = [
    {
      id: "live",
      home: { name: "Kestrel Bay", score: 2, disc: "bg-tint-green", lead: true },
      away: { name: "Ironworks FC", score: 1, disc: "bg-tint-amber" },
      badge: (
        <Badge variant="destructive" pulse contentKey={minute} accessibilityLabel={`Live, minute ${minute}`}>
          {`${minute}'`}
        </Badge>
      ),
    },
    {
      id: "ft",
      home: { name: "Millbrook Rovers", score: 0, disc: "bg-tint-lime" },
      away: { name: "Cedar Valley", score: 3, disc: "bg-tint-red", lead: true },
      badge: <Badge variant="secondary" icon={null}>FT</Badge>,
    },
    {
      id: "pp",
      home: { name: "Port Alder", disc: "bg-tint-green" },
      away: { name: "Saltmarsh United", disc: "bg-tint-sky" },
      badge: <Badge variant="warning" icon={null}>Postponed</Badge>,
    },
    {
      id: "next",
      home: { name: "North Quarry", disc: "bg-rose-800" },
      away: { name: "Larkhill Athletic", disc: "bg-blue-800" },
      badge: <Badge variant="outline">Sat 7:30 PM</Badge>,
    },
  ];

  return (
    <View className="w-full gap-2">
      <Text className="px-4 text-[13px] text-muted-foreground">Harbor League · Today</Text>
      <View className="w-full overflow-hidden rounded-2xl bg-card">
        {games.map((g, i) => (
          <View
            key={g.id}
            className={`flex-row items-center gap-4 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}
          >
            <View className="flex-1 gap-2">
              <Side {...g.home} />
              <Side {...g.away} />
            </View>
            <View className="w-24 flex-row justify-end">{g.badge}</View>
          </View>
        ))}
      </View>
    </View>
  );
}
